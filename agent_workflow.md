# AI Agent Workflow (Chi tiết luồng hoạt động)

Tài liệu này mô tả đầy đủ luồng chạy của AI Academic Advisor trong dự án Beograd, từ frontend đến backend Node.js, bridge Python, LangGraph agent, tools, dữ liệu Neo4j/RAG/crawl và cơ chế memory theo phiên.

---

## 1) Thành phần chính

### 1.1 Runtime web
- **Frontend**: `demo/frontend` (Next.js)
- **Backend API**: `demo/backend/src/index.js` (Express)
- **Bridge Python**: `agent_bridge.py`
- **Agent core**: `agent.py`
- **Tools layer**: `tools.py`

### 1.2 Nguồn dữ liệu
- **Neo4j Knowledge Graph**: môn học, quan hệ tiên quyết/học trước/song hành, khoa.
- **Curriculum JSON**: `data/processed/curriculum_extracted.json` (RAG fallback).
- **Dữ liệu crawl hợp nhất**: `data/processed/crawled_agent_data.json`.
- **Class-status JSON**: `course_timetable_generated.json` từ web class-status.

---

## 2) Luồng tổng thể khi user chat từ web

1. User gửi câu hỏi ở trang Agent (`/agent`) trên frontend.
2. Frontend gọi API `POST /api/agent/chat` ở backend Node.
3. Backend ghép prompt mở rộng bằng `buildAgentPrompt()`:
	- System note (cho phép dùng dữ liệu điểm từ context)
	- Student context (student/overview/config/terms)
	- History hội thoại gần đây (tối đa 8 lượt)
	- Câu hỏi hiện tại
4. Backend gọi process Python qua `runPythonAgent()`:
	- chạy `agent_bridge.py --session-id ... --message ...`
	- timeout 120 giây
5. `agent_bridge.py` khởi tạo `AcademicAdvisorAgent` và gọi `chat()`.
6. `agent.py` (LangGraph ReAct) quyết định gọi tool nào trong `ALL_TOOLS`.
7. Tool trả dữ liệu về agent, agent tổng hợp thành câu trả lời cuối.
8. Bridge in JSON stdout: `{ ok: true, answer: ... }`.
9. Backend parse JSON, trả về frontend.
10. Frontend hiển thị answer vào khung chat.

---

## 3) Luồng trong `agent.py`

## 3.1 Khởi tạo
- Load `.env` (`LLM_API_KEY`, `LLM_MODEL`, Neo4j config dùng ở tools).
- Khởi tạo model Gemini (`ChatGoogleGenerativeAI`).
- Nạp tools từ `ALL_TOOLS` trong `tools.py`.
- Tạo memory checkpointer `MemorySaver()`.
- Tạo ReAct agent bằng `create_react_agent()` với:
  - model
  - tools
  - checkpointer
  - system prompt định hướng hành vi tư vấn.

## 3.2 Chat theo session
- Hàm `chat(session_id, message)` dùng config:
  - `thread_id = session_id`
- LangGraph tự động:
  - load history cũ theo `thread_id`
  - append message mới
  - chạy vòng ReAct (think -> tool -> observe -> final)
  - lưu history mới lại vào memory.
- Chuẩn hoá output text (hỗ trợ cả `str` hoặc list content).

## 3.3 Nếu lỗi
- Bắt exception và trả thông báo lỗi thân thiện cho user.

---

## 4) Routing tool theo nghiệp vụ (thực tế trong prompt + tools)

Agent được hướng dẫn gọi tool theo thứ tự logic:

1. Hỏi môn theo học kỳ -> `tim_mon_theo_ky`
2. Hỏi môn theo ngôn ngữ/công cụ -> `tim_mon_theo_cong_cu`
3. Hỏi chi tiết 1 môn -> `xem_dieu_kien_tien_quyet` + `xem_mo_ta_mon`
4. Hỏi có mở lớp hay không -> `kiem_tra_mo_lop`
5. Hỏi lộ trình đến môn đích -> `tim_lo_trinh_den_mon`
6. Hỏi tối ưu toàn cục -> `toi_uu_lo_trinh_hoc_tap`
7. Hỏi đặc thù phức tạp (khó hardcode) -> `truy_van_do_thi_linh_hoat`
8. Hỏi ngoài graph schema (quy chế/chuẩn đầu ra, v.v.) -> `hoi_tai_lieu_chuong_trinh` (RAG)
9. Hỏi dữ liệu kết quả học tập/lớp mở thật từ demo/class-status:
	- crawl trước: `crawl_du_lieu_demo_va_class_status`
	- rồi hỏi: `hoi_du_lieu_da_crawl`

---

## 5) Chi tiết nhóm tool

## 5.1 Neo4j graph tools
Các tool: `tim_mon_theo_ky`, `tim_mon_theo_cong_cu`, `xem_dieu_kien_tien_quyet`, `xem_mo_ta_mon`, `tim_lo_trinh_den_mon`, `toi_uu_lo_trinh_hoc_tap`, `truy_van_do_thi_linh_hoat`.

Luồng chung:
1. `get_neo4j_driver()` đọc `NEO4J_URI/NEO4J_USERNAME/NEO4J_PASSWORD`.
2. `verify_connectivity()` đảm bảo kết nối tốt.
3. Chạy Cypher read-only, format dữ liệu trả về text có cấu trúc.

Guardrail quan trọng:
- `truy_van_do_thi_linh_hoat` chặn từ khoá phá huỷ dữ liệu (`delete/drop/create/merge/...`), chỉ cho phép truy vấn đọc.

## 5.2 RAG tool (`hoi_tai_lieu_chuong_trinh`)
Pipeline 3 bước:
1. **Query rewrite** bằng Gemini để tối ưu từ khoá tìm kiếm.
2. **Hybrid retrieval**:
	- BM25 (sparse)
	- FAISS + embedding `all-MiniLM-L6-v2` (dense)
	- ensemble weight: 0.3 / 0.7
	- rerank bằng cross-encoder `ms-marco-TinyBERT-L-2-v2` (top_n=4)
3. **Generation** bằng Gemini dựa trên context đã lọc.

Mục tiêu: giảm hallucination, tăng độ chính xác với câu hỏi ngoài graph.

## 5.3 Crawl + hỏi dữ liệu crawl

### `crawl_du_lieu_demo_va_class_status`
- Gọi `crawl_all_sources()` trong `crawl_data.py`:
  - Crawl backend demo (`/api/options`, `/api/auth/login` nhiều kịch bản performance/scoreProfile/term)
  - Crawl class-status (`/course_timetable_generated.json`)
- Lưu hợp nhất ra `data/processed/crawled_agent_data.json`.

### `hoi_du_lieu_da_crawl`
- Load file JSON đã crawl.
- Tách token câu hỏi, rank records theo độ khớp (`_rank_records`).
- Lấy top records từ demo terms / demo courses / class rows.
- Đưa context rút gọn vào Gemini để tạo câu trả lời có số liệu.

---

## 6) Luồng trong backend Node (`demo/backend/src/index.js`)

## 6.1 Resolve Python executable
Ưu tiên:
1. `PYTHON_EXECUTABLE` trong env
2. `.venv314/Scripts/python.exe`
3. `.venv/Scripts/python.exe`
4. fallback `python`

## 6.2 Endpoint chính
- `GET /api/health`: health backend
- `GET /api/options`: trả tùy chọn login
- `POST /api/auth/login`: sinh dataset demo student/results
- `POST /api/agent/chat`: cầu nối sang agent Python

## 6.3 Khi gọi agent
- Spawn Python process (`agent_bridge.py`).
- Thu stdout/stderr.
- Timeout 120s -> kill process và trả lỗi.
- Parse JSON bridge output -> trả answer cho frontend.

---

## 7) Memory và session

- Web gửi `sessionId` lên backend.
- Backend forward nguyên `sessionId` sang bridge.
- Agent dùng `thread_id = sessionId` trong LangGraph.
- Kết quả: cùng session sẽ giữ ngữ cảnh hội thoại liên tục.

Lưu ý: hiện tại `MemorySaver` là in-memory theo process. Nếu backend tạo process Python mới cho mỗi request, memory không bền xuyên process. Muốn persistence thực sự production nên thay bằng Redis/Postgres checkpointer hoặc chạy agent service long-lived.

---

## 8) Error handling theo tầng

1. **Frontend**: hiển thị lỗi API nếu request fail.
2. **Backend**:
	- validate input thiếu `message` -> HTTP 400
	- lỗi bridge/python -> HTTP 500
	- timeout >120s -> lỗi timeout
3. **Bridge**: catch exception, in JSON `{ok:false,error,trace}`.
4. **Agent/tools**: catch lỗi truy vấn/LLM và trả thông điệp lỗi an toàn.

---

## 9) Sơ đồ luồng rút gọn

1. User -> Frontend Agent Page
2. Frontend -> Backend `/api/agent/chat`
3. Backend -> Python Bridge
4. Bridge -> `AcademicAdvisorAgent.chat()`
5. Agent -> (Neo4j Tool | RAG Tool | Crawl Tool)
6. Tool result -> Agent synthesis
7. Agent -> Bridge JSON
8. Bridge -> Backend
9. Backend -> Frontend
10. Frontend render response

---

## 10) Danh sách tool hiện hành (`ALL_TOOLS`)

1. `tim_mon_theo_ky`
2. `tim_mon_theo_cong_cu`
3. `xem_dieu_kien_tien_quyet`
4. `xem_mo_ta_mon`
5. `kiem_tra_mo_lop`
6. `tim_lo_trinh_den_mon`
7. `toi_uu_lo_trinh_hoc_tap`
8. `truy_van_do_thi_linh_hoat`
9. `hoi_tai_lieu_chuong_trinh`
10. `crawl_du_lieu_demo_va_class_status`
11. `hoi_du_lieu_da_crawl`

---

## 11) Kết luận

Con AI agent này hoạt động theo mô hình **ReAct + Tool Calling**:
- Agent không trả lời “chay”, mà ưu tiên gọi tool lấy dữ liệu thật.
- Dùng Neo4j cho logic CTĐT, dùng RAG cho phần ngoài graph, dùng crawler cho dữ liệu vận hành demo/class-status.
- Backend Node đóng vai trò orchestration giữa web và Python agent.
- Session-based memory giúp giữ mạch tư vấn theo từng sinh viên.

---

## 12) Flowchart ngắn (checklist vận hành production)

### 12.1 Flowchart nhanh

```text
[Start]
	|
	v
[Health checks OK?]
 (Backend 4000, Frontend 3000, Class-status 3200, Neo4j)
	|Yes
	v
[Config OK?]
 (.env, .env.local, PYTHON_EXECUTABLE, LLM key)
	|Yes
	v
[Request vào /api/agent/chat]
	|
	v
[Spawn agent_bridge.py + timeout guard]
	|
	v
[LangGraph ReAct]
	|
	+--> [Neo4j Tool] -----+
	|                      |
	+--> [RAG Tool] -------+--> [Synthesize answer]
	|                      |
	+--> [Crawl Tool] -----+
	|
	v
[Return JSON answer]
	|
	v
[Log + Monitor + Alert]
	|
	v
[End]
```

### 12.2 Checklist vận hành theo ca

#### A. Pre-flight (trước khi mở dịch vụ)
- [ ] `GET /api/health` trả 200.
- [ ] `http://localhost:3200/health` trả 200.
- [ ] Frontend mở được và gọi API đúng `NEXT_PUBLIC_API_BASE`.
- [ ] Neo4j `verify_connectivity()` OK.
- [ ] `.env` có `LLM_API_KEY`, `LLM_MODEL`, `NEO4J_*`, `PYTHON_EXECUTABLE`.
- [ ] Python env đúng version, package đủ cho `agent.py` + `tools.py`.

#### B. Runtime guardrails
- [ ] Bật timeout bridge (đang 120s).
- [ ] Chặn truy vấn Cypher nguy hiểm trong tool linh hoạt.
- [ ] Không log lộ secrets (`LLM_API_KEY`, password).
- [ ] Retry có kiểm soát cho lỗi network tạm thời (Neo4j/HTTP).

#### C. Observability (theo dõi)
- [ ] Log đủ 4 tầng: frontend, backend, bridge, tools.
- [ ] Theo dõi p95 latency endpoint `/api/agent/chat`.
- [ ] Theo dõi tỉ lệ lỗi 4xx/5xx.
- [ ] Cảnh báo khi timeout hoặc lỗi Neo4j tăng đột biến.

#### D. Data freshness
- [ ] Chạy crawl định kỳ để cập nhật `crawled_agent_data.json`.
- [ ] Nếu trả lời thiếu dữ liệu -> trigger crawl lại.
- [ ] Có cơ chế version/timestamp cho dữ liệu crawl.

#### E. Scale & reliability
- [ ] Cân nhắc chuyển từ process-per-request sang agent service long-lived.
- [ ] Thay `MemorySaver` in-memory bằng Redis/Postgres checkpointer nếu cần state bền.
- [ ] Đặt giới hạn concurrent requests để tránh quá tải Python worker.

#### F. Incident response (khi có sự cố)
- [ ] Xác định lỗi thuộc tầng nào (frontend/backend/bridge/tool/data).
- [ ] Nếu lỗi agent: fallback trả lời an toàn + thông báo thử lại.
- [ ] Nếu lỗi Neo4j: fallback qua RAG/crawl (nếu phù hợp).
- [ ] Sau khi fix: chạy lại smoke test các endpoint và 3-5 câu hỏi mẫu.
