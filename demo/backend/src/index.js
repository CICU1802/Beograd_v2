import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { generateStudentDataset, getLoginOptions } from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const agentBridgeScript = path.resolve(projectRoot, "agent_bridge.py");

function resolvePythonExecutable() {
    if (process.env.PYTHON_EXECUTABLE) return process.env.PYTHON_EXECUTABLE;

    const venv314Python = path.resolve(projectRoot, ".venv314", "Scripts", "python.exe");
    if (fs.existsSync(venv314Python)) return venv314Python;

    const venvPython = path.resolve(projectRoot, ".venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPython)) return venvPython;

    return "python";
}

function buildAgentPrompt({ message, studentContext, history }) {
    const blocks = [];
    blocks.push(
        "[System Note cho AI]",
        "Bạn ĐƯỢC PHÉP sử dụng dữ liệu trang demo kết quả học tập. " +
        "Nếu trong Student Context có trường terms/rows thì đó là điểm chi tiết đã được cấp quyền truy cập. " +
        "Không được nói 'chưa có quyền truy cập bảng điểm' khi terms/rows đã có dữ liệu."
    );

    if (studentContext) {
        blocks.push(
            "[Student Context - dùng để cá nhân hóa tư vấn]",
            JSON.stringify(studentContext, null, 2)
        );
    }

    if (Array.isArray(history) && history.length) {
        const recent = history.slice(-8);
        const historyText = recent
            .map((item) => `${item.role === "assistant" ? "Advisor" : "Sinh viên"}: ${item.content}`)
            .join("\n");
        blocks.push("[Lịch sử hội thoại gần đây]", historyText);
    }

    blocks.push("[Câu hỏi hiện tại]", message);
    return blocks.join("\n\n");
}

function runPythonAgent({ sessionId, message }) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(agentBridgeScript)) {
            reject(new Error(`Không tìm thấy file bridge: ${agentBridgeScript}`));
            return;
        }

        const py = spawn(
            resolvePythonExecutable(),
            [agentBridgeScript, "--session-id", sessionId, "--message", message],
            {
                cwd: projectRoot,
                env: process.env,
                stdio: ["ignore", "pipe", "pipe"]
            }
        );

        let stdout = "";
        let stderr = "";

        py.stdout.on("data", (chunk) => {
            stdout += chunk.toString("utf-8");
        });
        py.stderr.on("data", (chunk) => {
            stderr += chunk.toString("utf-8");
        });

        const timeout = setTimeout(() => {
            py.kill("SIGTERM");
            reject(new Error("AI agent timeout sau 120 giây."));
        }, 120000);

        py.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        py.on("close", (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
                reject(new Error(stderr.trim() || `Python process exit code ${code}`));
                return;
            }

            try {
                const parsed = JSON.parse(stdout.trim());
                if (!parsed.ok) {
                    reject(new Error(parsed.error || "Agent bridge trả về lỗi không xác định."));
                    return;
                }
                resolve(parsed.answer);
            } catch {
                reject(new Error(`Không parse được output từ agent bridge: ${stdout}`));
            }
        });
    });
}

app.use(cors());
app.use(express.json());

const DEMO_ACCOUNT = {
    username: "Beograd",
    password: "Beograd"
};

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "beograd-demo-backend" });
});

app.get("/api/options", (_req, res) => {
    res.json(getLoginOptions());
});

app.post("/api/auth/login", (req, res) => {
    const {
        username,
        password,
        performance = "kha",
        scoreProfile = "can_bang",
        year = 3,
        semester = 1
    } = req.body ?? {};

    if (username !== DEMO_ACCOUNT.username || password !== DEMO_ACCOUNT.password) {
        return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu demo." });
    }

    const payload = generateStudentDataset({
        performance,
        scoreProfile,
        year: Number(year),
        semester: Number(semester)
    });

    return res.json({
        token: "beograd-demo-token",
        account: { username: DEMO_ACCOUNT.username, role: "student" },
        payload
    });
});

app.post("/api/agent/chat", async (req, res) => {
    const { sessionId = "demo-web-session", message, studentContext = null, history = [] } = req.body ?? {};

    if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Thiếu nội dung tin nhắn để gửi cho AI Agent." });
    }

    try {
        const prompt = buildAgentPrompt({
            message: message.trim(),
            studentContext,
            history
        });

        const answer = await runPythonAgent({
            sessionId: String(sessionId),
            message: prompt
        });

        return res.json({ answer });
    } catch (error) {
        const messageText = error instanceof Error ? error.message : "Lỗi chưa xác định khi gọi AI Agent.";
        return res.status(500).json({ message: messageText });
    }
});

app.listen(PORT, () => {
    console.log(`Backend demo running at http://localhost:${PORT}`);
});
