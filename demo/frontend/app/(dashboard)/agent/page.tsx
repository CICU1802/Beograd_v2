"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getSession, type SessionData } from "@/lib/session";
import { postAgentChat } from "@/lib/api";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const STARTER_QUESTIONS = [
    "Em đang học năm 2, kỳ này nên ưu tiên môn nào để đỡ nặng?",
    "Kiểm tra giúp em môn tiên quyết của COMP1307.",
    "Nếu em muốn theo AI/Data thì lộ trình môn nên đi thế nào?"
];

export default function AgentPage() {
    const router = useRouter();
    const listRef = useRef<HTMLDivElement | null>(null);

    const [session, setSession] = useState<SessionData | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const current = getSession();
        if (!current) {
            router.replace("/login");
            return;
        }
        setSession(current);
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content:
                    "Chào em, mình là AI Academic Advisor. Em cứ hỏi về môn học, tiên quyết, lộ trình hoặc chiến lược đăng ký môn theo học lực hiện tại nhé."
            }
        ]);
    }, [router]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, sending]);

    const sessionId = useMemo(() => {
        if (!session) return "demo-web-session";
        return `demo-${session.payload.student.id}`;
    }, [session]);

    const sendMessage = async (messageText: string) => {
        const content = messageText.trim();
        if (!content || sending || !session) return;

        const userMsg: ChatMessage = {
            id: `${Date.now()}-user`,
            role: "user",
            content
        };

        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInput("");
        setError(null);
        setSending(true);

        try {
            const response = await postAgentChat({
                sessionId,
                message: content,
                studentContext: {
                    student: session.payload.student,
                    overview: session.payload.overview,
                    config: session.payload.config,
                    terms: session.payload.terms
                },
                history: nextMessages.map((item) => ({ role: item.role, content: item.content }))
            });

            const aiMsg: ChatMessage = {
                id: `${Date.now()}-assistant`,
                role: "assistant",
                content: response.answer
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể gọi AI Agent.");
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await sendMessage(input);
    };

    if (!session) {
        return <div className="text-sm text-slate-500">Đang tải AI Agent...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-display text-xl font-semibold text-slate-900">AI Agent Tư vấn học tập</h1>
                        <Badge tone="success">Powered by agent.py</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        AI đang nhận ngữ cảnh hồ sơ của {session.payload.student.fullName} để trả lời cá nhân hóa theo học lực và tiến độ hiện tại.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div ref={listRef} className="max-h-[55vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-brand-600 text-white"
                                        : "border border-slate-200 bg-white text-slate-800"
                                        }`}
                                >
                                    <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
                                        {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                        {msg.role === "user" ? "Bạn" : "AI Advisor"}
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {sending && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                    AI Advisor đang suy nghĩ...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {STARTER_QUESTIONS.map((question) => (
                            <button
                                key={question}
                                type="button"
                                onClick={() => sendMessage(question)}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                                disabled={sending}
                            >
                                {question}
                            </button>
                        ))}
                    </div>

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi cho AI Advisor..."
                            className="min-h-28"
                            disabled={sending}
                        />
                        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                        <div className="flex justify-end">
                            <Button disabled={sending || !input.trim()} className="gap-2">
                                <Send className="h-4 w-4" />
                                {sending ? "Đang gửi..." : "Gửi cho AI Agent"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
