const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const curriculumPath = path.join(rootDir, "data", "processed", "curriculum_extracted.json");
const outputPathProcessed = path.join(rootDir, "data", "processed", "course_timetable_generated.json");
const outputPathDemo = path.join(__dirname, "course_timetable_generated.json");
const outputPathFrontendPublic = path.join(__dirname, "frontend", "public", "course_timetable_generated.json");
const outputPathClassStatusPublic = path.join(__dirname, "class-status-web", "public", "course_timetable_generated.json");

const semesterConfig = {
    1: { start: "2025-09-08", end: "2025-12-20", phase: "Học kì 1 - Năm 1" },
    2: { start: "2026-01-12", end: "2026-05-02", phase: "Học kì 2 - Năm 1" },
    3: { start: "2026-05-25", end: "2026-08-08", phase: "Học kì 3 - Hè" },
    4: { start: "2026-09-07", end: "2026-12-19", phase: "Học kì 4 - Năm 2" },
    5: { start: "2027-01-11", end: "2027-05-01", phase: "Học kì 5 - Năm 3" },
    6: { start: "2027-05-24", end: "2027-08-07", phase: "Học kì 6 - Hè" },
    7: { start: "2027-09-06", end: "2027-12-18", phase: "Học kì 7 - Năm 4" },
    8: { start: "2028-01-10", end: "2028-04-29", phase: "Học kì 8 - Năm 4" }
};

const oddCycle = {
    start: semesterConfig[1].start,
    end: semesterConfig[1].end,
    phase: "Chu kỳ lẻ (dùng khung HK1)"
};

const evenCycle = {
    start: semesterConfig[2].start,
    end: semesterConfig[2].end,
    phase: "Chu kỳ chẵn (dùng khung HK2)"
};

const weekdayNames = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const slots = [
    { period: "Tiết(1 - 3)", time: "07:00 - 09:25" },
    { period: "Tiết(3 - 6)", time: "09:35 - 12:00" },
    { period: "Tiết(7 - 9)", time: "13:00 - 15:25" },
    { period: "Tiết(9 - 12)", time: "15:35 - 18:00" },
    { period: "Tiết(13 - 15)", time: "18:10 - 20:35" }
];
const rooms = [
    "I.101", "I.102", "I.201", "I.202", "I.301", "I.302",
    "LVS.A.201", "LVS.A.202", "LVS.B.101", "LVS.B.201", "ADV II", "Online"
];
const classGroups = ["50.01.CNTT.A", "50.01.CNTT.B", "50.01.CNTT.C", "50.01.CNTT.D", "50.01.SPTIN.B"];
const lecturerNames = ["", "Giảng viên A", "Giảng viên B", "Giảng viên C", "Giảng viên D", "Giảng viên E"];

function safeReadJson(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
}

function seededInt(seed, mod) {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
        h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return h % mod;
}

function toDisplayDate(isoDate) {
    const [y, m, d] = String(isoDate).split("-");
    return `${d}/${m}/${y}`;
}

function addDays(isoDate, delta) {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + delta);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function buildSlotPool() {
    const pool = [];
    for (let d = 0; d < weekdayNames.length; d += 1) {
        for (let s = 0; s < slots.length; s += 1) {
            pool.push({ dayIndex: d, slotIndex: s });
        }
    }
    return pool;
}

function formatSchedule(dayIndex, slotIndex, room, startDate, endDate) {
    const day = weekdayNames[dayIndex];
    const slot = slots[slotIndex];
    return `${day}, ${slot.period}, ${room} (${toDisplayDate(startDate)} -> ${toDisplayDate(endDate)})`;
}

function createClassCode(courseCode, semester, indexInSemester) {
    const prefix = String(2400 + semester);
    const idx = String(indexInSemester + 1).padStart(2, "0");
    return `${prefix}${courseCode}${idx}`;
}

function getCycleConfig(semester) {
    return semester % 2 === 1 ? oddCycle : evenCycle;
}

function generateTimetableData(curriculum) {
    const courses = Array.isArray(curriculum?.courses) ? curriculum.courses : [];
    const groupedBySemester = new Map();

    for (const course of courses) {
        const semester = Number(course?.hoc_ky_du_kien);
        const code = String(course?.ma_mon ?? "").trim();
        const name = String(course?.ten_mon ?? "").trim();
        const credits = Number(course?.so_tin_chi ?? 0);
        if (!semesterConfig[semester] || !code || !name || credits <= 0) continue;

        if (!groupedBySemester.has(semester)) groupedBySemester.set(semester, []);
        groupedBySemester.get(semester).push({
            ma_mon: code,
            ten_mon: name,
            so_tin_chi: credits,
            loai_mon: String(course?.loai_mon ?? "").trim() || "Bắt buộc",
            don_vi_quan_ly: String(course?.don_vi_quan_ly ?? "").trim()
        });
    }

    const semesterEntries = [];
    for (let semester = 1; semester <= 8; semester += 1) {
        const items = (groupedBySemester.get(semester) || []).sort((a, b) => a.ma_mon.localeCompare(b.ma_mon));
        if (!items.length) continue;

        const cycleCfg = getCycleConfig(semester);
        const pool = buildSlotPool();
        const occupied = new Set();
        const rows = [];
        let classIndexInSemester = 0;

        for (let i = 0; i < items.length; i += 1) {
            const c = items[i];
            const sectionsPerCourse = 4 + seededInt(`${c.ma_mon}-${semester}-sections`, 2);

            for (let sectionIndex = 0; sectionIndex < sectionsPerCourse; sectionIndex += 1) {
                const keySeed = `${c.ma_mon}-${semester}-${i}-${sectionIndex}`;
                const poolStart = seededInt(keySeed, pool.length);

                let chosen = null;
                for (let k = 0; k < pool.length; k += 1) {
                    const idx = (poolStart + k) % pool.length;
                    const candidate = pool[idx];
                    const key = `${candidate.dayIndex}-${candidate.slotIndex}`;
                    if (!occupied.has(key)) {
                        chosen = candidate;
                        occupied.add(key);
                        break;
                    }
                }
                if (!chosen) {
                    chosen = pool[poolStart % pool.length];
                }

                const room = rooms[seededInt(`${keySeed}-room`, rooms.length)];
                const classGroup = classGroups[seededInt(`${keySeed}-class`, classGroups.length)];
                const status = seededInt(`${keySeed}-status`, 10) < 2 ? "Hủy" : "Cho Sinh viên đăng kí";
                const capacity = 40 + seededInt(`${keySeed}-cap`, 5) * 10;
                const registered = status === "Hủy" ? 0 : Math.min(capacity, Math.floor(capacity * (0.35 + seededInt(`${keySeed}-reg`, 50) / 100)));
                const lecturer = lecturerNames[seededInt(`${keySeed}-lec`, lecturerNames.length)];
                const startOffset = seededInt(`${keySeed}-start`, 8);
                const endOffset = seededInt(`${keySeed}-end`, 8);
                const startIso = addDays(cycleCfg.start, startOffset);
                const endIso = addDays(cycleCfg.end, -endOffset);

                rows.push({
                    ma_lhp: createClassCode(c.ma_mon, semester, classIndexInSemester),
                    ma_hp: c.ma_mon,
                    ten_hp: c.ten_mon,
                    so_tc: c.so_tin_chi,
                    loai_mon: c.loai_mon,
                    don_vi_quan_ly: c.don_vi_quan_ly,
                    tinh_trang_lhp: status,
                    lop_sinh_vien: status === "Hủy" ? "." : classGroup,
                    si_so: capacity,
                    so_luong_da_dk: registered,
                    ngay_bd: toDisplayDate(startIso),
                    ngay_kt: toDisplayDate(endIso),
                    thoi_khoa_bieu: status === "Hủy" ? "-" : formatSchedule(chosen.dayIndex, chosen.slotIndex, room, startIso, endIso),
                    giang_vien: status === "Hủy" ? "-" : lecturer
                });
                classIndexInSemester += 1;
            }
        }

        semesterEntries.push({
            hoc_ky: semester,
            hoc_ky_nhan: semesterConfig[semester].phase,
            chu_ky_lich: cycleCfg.phase,
            ngay_bat_dau: toDisplayDate(cycleCfg.start),
            ngay_ket_thuc: toDisplayDate(cycleCfg.end),
            tong_so_lop: rows.length,
            danh_sach_lop_hoc_phan: rows
        });
    }

    return {
        generated_at: new Date().toISOString(),
        source_file: "data/processed/curriculum_extracted.json",
        program: curriculum?.program || {},
        total_semesters: semesterEntries.length,
        total_classes: semesterEntries.reduce((sum, s) => sum + s.tong_so_lop, 0),
        semesters: semesterEntries
    };
}

function main() {
    const curriculum = safeReadJson(curriculumPath);
    const output = generateTimetableData(curriculum);
    const outputJson = JSON.stringify(output, null, 2);
    fs.writeFileSync(outputPathProcessed, outputJson, "utf8");
    fs.writeFileSync(outputPathDemo, outputJson, "utf8");
    fs.writeFileSync(outputPathFrontendPublic, outputJson, "utf8");
    fs.writeFileSync(outputPathClassStatusPublic, outputJson, "utf8");
    console.log(`Generated: ${outputPathProcessed}`);
    console.log(`Generated: ${outputPathDemo}`);
    console.log(`Generated: ${outputPathFrontendPublic}`);
    console.log(`Generated: ${outputPathClassStatusPublic}`);
    console.log(`Semesters: ${output.total_semesters}`);
    console.log(`Classes: ${output.total_classes}`);
}

main();