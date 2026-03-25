# Beograd

Huong dan day du de chay toan bo du an khi chuyen sang may moi, bao gom cau hinh he thong, Python, Node.js, Neo4j, Gemini API, va cau hinh VS Code.

## 1. Tong quan he thong

Du an gom 3 phan chinh:

1. Python AI Agent o thu muc goc:
- `agent.py`, `tools.py`, `extraction.py`, `agent_bridge.py`
- Dung LangChain/LangGraph + Gemini + Neo4j

2. Demo web (Next.js + Node backend):
- `demo/frontend` (Next.js)
- `demo/backend` (Express API, goi Python agent qua `agent_bridge.py`)

3. Class status web:
- `demo/class-status-web` (Express + static web)

## 2. Yeu cau phan mem tren may moi

Bat buoc:

1. Windows 10/11
2. Node.js >= 18 (khuyen nghi Node 20 LTS)
3. Python 3.10-3.12 (khuyen nghi 3.11)
4. Neo4j (local hoac AuraDB), truy cap duoc tu may
5. Tai khoan Gemini API key

Kiem tra nhanh:

```powershell
node -v
npm -v
python --version
```

## 3. Cau hinh VS Code can co

### 3.1 Extension bat buoc/khuyen nghi

Can cai it nhat cac extension sau:

1. GitHub Copilot
2. GitHub Copilot Chat
3. Python (Microsoft)
4. Pylance
5. IntelliCode
6. GitLens
7. ESLint
8. Prettier - Code formatter
9. Tailwind CSS IntelliSense

Neu co dung CSDL o cac pha tiep theo, cai them:

10. SQLTools

### 3.2 Workspace settings khuyen nghi

Tao file `.vscode/settings.json` voi cau hinh:

```json
{
	"editor.formatOnSave": true,
	"files.autoSave": "onFocusChange",
	"python.defaultInterpreterPath": "${workspaceFolder}\\.venv\\Scripts\\python.exe",
	"python.analysis.typeCheckingMode": "basic",
	"python.terminal.activateEnvironment": true,
	"terminal.integrated.defaultProfile.windows": "PowerShell",
	"editor.codeActionsOnSave": {
		"source.organizeImports": "explicit"
	}
}
```

Ghi chu:
- Neu dung `.venv314` thi sua `python.defaultInterpreterPath` cho dung duong dan.
- Backend demo co uu tien `PYTHON_EXECUTABLE`, sau do den `.venv314`, `.venv`, roi moi den `python` he thong.

### 3.3 Workspace Extensions goi y

Co the tao `.vscode/extensions.json`:

```json
{
	"recommendations": [
		"GitHub.copilot",
		"GitHub.copilot-chat",
		"ms-python.python",
		"ms-python.vscode-pylance",
		"VisualStudioExptTeam.vscodeintellicode",
		"eamodio.gitlens",
		"dbaeumer.vscode-eslint",
		"esbenp.prettier-vscode",
		"bradlc.vscode-tailwindcss",
		"mtxr.sqltools"
	]
}
```

## 4. Cau hinh bien moi truong

### 4.1 File `.env` o thu muc goc

Tao file `.env`:

```env
LLM_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-2.5-flash

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# tuy chon, chi dung khi backend khong tu tim duoc python
# PYTHON_EXECUTABLE=H:\\NCKH\\Beograd_v2\\Beograd_v2\\.venv\\Scripts\\python.exe
```

### 4.2 Frontend env

Tao `demo/frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## 5. Cai dat Python dependencies

Luu y: repo hien tai chua co `requirements.txt`/`pyproject.toml`, can cai thu cong.

### Cach khuyen nghi (uv)

```powershell
cd <duong_dan_repo>
uv venv
.\.venv\Scripts\Activate.ps1

uv pip install python-dotenv langchain-core langchain-community langchain-classic langchain-google-genai langgraph neo4j pdfplumber pydantic faiss-cpu sentence-transformers rank-bm25
```

### Cach thay the (pip)

```powershell
cd <duong_dan_repo>
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install python-dotenv langchain-core langchain-community langchain-classic langchain-google-genai langgraph neo4j pdfplumber pydantic faiss-cpu sentence-transformers rank-bm25
```

## 6. Cai dat Node.js dependencies

```powershell
cd demo\backend
npm install

cd ..\frontend
npm install

cd ..\class-status-web
npm install
```

## 7. Chay toan bo du an

### 7.1 Cach nhanh

1. Chay file `demo/start-demo.bat`
2. Mo them file `demo/start-class-status-web.bat` neu can trang class status

Ket qua:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Class status web: http://localhost:3200

### 7.2 Cach thu cong

Mo 4 terminal:

Terminal A (Python env):

```powershell
cd <duong_dan_repo>
.\.venv\Scripts\Activate.ps1
```

Terminal B (backend):

```powershell
cd demo\backend
npm run dev
```

Terminal C (frontend):

```powershell
cd demo\frontend
npm run dev
```

Terminal D (class status web - tuy chon):

```powershell
cd demo
node generate_timetable_from_curriculum.js
cd class-status-web
npm start
```

## 8. Kiem tra nhanh sau khi setup

1. Backend health:
- Truy cap: `http://localhost:4000/api/health`

2. Class status health:
- Truy cap: `http://localhost:3200/health`

3. Dang nhap demo:
- Username: `Beograd`
- Password: `Beograd`

4. Kiem tra AI Agent:
- Chat tu giao dien demo (tab Agent) hoac chay truc tiep:

```powershell
cd <duong_dan_repo>
.\.venv\Scripts\Activate.ps1
python -X utf8 agent.py
```

## 9. Loi thuong gap va cach xu ly

1. Loi `Thiếu LLM_API_KEY`:
- Kiem tra file `.env` o thu muc goc.

2. Loi ket noi Neo4j:
- Kiem tra `NEO4J_URI/NEO4J_USERNAME/NEO4J_PASSWORD`.
- Dam bao Neo4j dang chay va mo cong.

3. Backend goi Python fail:
- Kiem tra da kich hoat/cai dung virtual env.
- Dat `PYTHON_EXECUTABLE` trong `.env` neu can.

4. Frontend khong goi duoc API:
- Kiem tra `demo/frontend/.env.local`.
- Kiem tra backend dang chay cong 4000.

5. Loi port da duoc su dung:
- Tat tien trinh cu hoac doi `PORT` cho backend/class-status.

## 10. Checklist migration sang may moi

1. Cai Node.js, Python, VS Code.
2. Cai extension VS Code theo muc 3.1.
3. Clone repo.
4. Tao `.env` (goc) va `.env.local` (frontend).
5. Tao virtual env Python + cai dependencies.
6. `npm install` cho 3 app Node.
7. Dam bao Neo4j da san sang va co du lieu.
8. Chay `start-demo.bat` + `start-class-status-web.bat`.
9. Test 3 URL: 3000/4000/3200.