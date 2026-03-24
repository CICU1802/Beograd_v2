const state = {
    allRows: [],
    semester: "all",
    status: "all",
    keyword: "",
    page: 1,
    pageSize: 16
};

const els = {
    keyword: document.getElementById("keyword"),
    semester: document.getElementById("semester"),
    status: document.getElementById("status"),
    btnSearch: document.getElementById("btn-search"),
    btnCopy: document.getElementById("btn-copy"),
    btnExport: document.getElementById("btn-export"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    pagerLabel: document.getElementById("pager-label"),
    tableBody: document.getElementById("table-body"),
    stats: document.getElementById("stats")
};

boot();

async function boot() {
    const data = await fetch("/course_timetable_generated.json").then((r) => r.json());
    state.allRows = data.semesters.flatMap((s) =>
        s.danh_sach_lop_hoc_phan.map((c) => ({ ...c, hoc_ky: s.hoc_ky, hoc_ky_nhan: s.hoc_ky_nhan }))
    );

    const semesters = [...new Set(state.allRows.map((r) => r.hoc_ky))].sort((a, b) => a - b);
    els.semester.innerHTML = ["<option value=\"all\">Tất cả học kỳ</option>"]
        .concat(semesters.map((s) => `<option value=\"${s}\">Học kỳ ${s}</option>`))
        .join("");

    bindEvents();
    renderStats();
    renderTable();
}

function bindEvents() {
    els.btnSearch.addEventListener("click", () => {
        state.keyword = (els.keyword.value || "").trim().toLowerCase();
        state.semester = els.semester.value;
        state.status = els.status.value;
        state.page = 1;
        renderTable();
    });

    els.btnCopy.addEventListener("click", async () => {
        const rows = getFilteredRows();
        await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    });

    els.btnExport.addEventListener("click", () => {
        const rows = getFilteredRows();
        exportCsv(rows);
    });

    els.btnPrev.addEventListener("click", () => {
        state.page = Math.max(1, state.page - 1);
        renderTable();
    });

    els.btnNext.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(getFilteredRows().length / state.pageSize));
        state.page = Math.min(totalPages, state.page + 1);
        renderTable();
    });
}

function getFilteredRows() {
    return state.allRows
        .filter((r) => (state.semester === "all" ? true : String(r.hoc_ky) === state.semester))
        .filter((r) => {
            if (state.status === "all") return true;
            if (state.status === "open") return r.tinh_trang_lhp.includes("đăng kí");
            return r.tinh_trang_lhp === "Hủy";
        })
        .filter((r) => {
            if (!state.keyword) return true;
            const target = `${r.ma_lhp} ${r.ma_hp} ${r.ten_hp} ${r.giang_vien}`.toLowerCase();
            return target.includes(state.keyword);
        })
        .sort((a, b) => (a.hoc_ky - b.hoc_ky) || a.ma_lhp.localeCompare(b.ma_lhp));
}

function renderStats() {
    const total = state.allRows.length;
    const open = state.allRows.filter((r) => r.tinh_trang_lhp.includes("đăng kí")).length;
    const cancelled = state.allRows.filter((r) => r.tinh_trang_lhp === "Hủy").length;

    els.stats.innerHTML = `
    <div class="stat">Tổng lớp học phần<b>${total}</b></div>
    <div class="stat">Lớp đang mở<b>${open}</b></div>
    <div class="stat">Lớp đã hủy<b>${cancelled}</b></div>
  `;
}

function renderTable() {
    const rows = getFilteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const paged = rows.slice(start, start + state.pageSize);

    els.pagerLabel.textContent = `Xem trang ${state.page} / ${totalPages}`;

    if (!paged.length) {
        els.tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:#64748b;padding:26px">Không có dữ liệu phù hợp bộ lọc.</td></tr>`;
        return;
    }

    const headerRow = `<tr class="group-row"><td colspan="11">Môn chuyên ngành - Khoa Công nghệ Thông tin</td></tr>`;
    const bodyRows = paged.map((r) => {
        const badge = r.tinh_trang_lhp === "Hủy"
            ? `<span class="badge badge-cancelled">Hủy</span>`
            : `<span class="badge badge-open">Cho Sinh viên đăng kí</span>`;
        return `
      <tr>
        <td>${escapeHtml(r.ma_lhp)}</td>
        <td><b>${escapeHtml(r.ten_hp)}</b><div style="margin-top:4px;color:#64748b;font-size:12px">${escapeHtml(r.ma_hp)} | HK ${r.hoc_ky}</div></td>
        <td>${r.so_tc}</td>
        <td>${badge}</td>
        <td>${escapeHtml(r.lop_sinh_vien)}</td>
        <td>${r.si_so}</td>
        <td>${r.so_luong_da_dk}</td>
        <td>${escapeHtml(r.ngay_bd)}</td>
        <td>${escapeHtml(r.ngay_kt)}</td>
        <td>${escapeHtml(r.thoi_khoa_bieu)}</td>
        <td>${escapeHtml(r.giang_vien || "-")}</td>
      </tr>`;
    }).join("");

    els.tableBody.innerHTML = headerRow + bodyRows;
}

function exportCsv(rows) {
    const header = [
        "hoc_ky", "ma_lhp", "ma_hp", "ten_hp", "so_tc", "tinh_trang_lhp", "lop_sinh_vien",
        "si_so", "so_luong_da_dk", "ngay_bd", "ngay_kt", "thoi_khoa_bieu", "giang_vien"
    ];
    const lines = rows.map((r) => [
        r.hoc_ky, r.ma_lhp, r.ma_hp, r.ten_hp, r.so_tc, r.tinh_trang_lhp, r.lop_sinh_vien,
        r.si_so, r.so_luong_da_dk, r.ngay_bd, r.ngay_kt, r.thoi_khoa_bieu, r.giang_vien
    ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "danh_sach_lop_hoc_phan.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
