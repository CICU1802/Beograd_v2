import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GRADE_SCALE = [
    { letter: "A", point4: 4.0, min10: 8.5, max10: 10 },
    { letter: "B+", point4: 3.5, min10: 7.8, max10: 8.4 },
    { letter: "B", point4: 3.0, min10: 7.0, max10: 7.7 },
    { letter: "C+", point4: 2.5, min10: 6.3, max10: 6.9 },
    { letter: "C", point4: 2.0, min10: 5.5, max10: 6.2 },
    { letter: "D+", point4: 1.5, min10: 4.8, max10: 5.4 },
    { letter: "D", point4: 1.0, min10: 4.0, max10: 4.7 },
    { letter: "F+", point4: 0.5, min10: 3.0, max10: 3.9 },
    { letter: "F", point4: 0.0, min10: 0.0, max10: 2.9 }
];

const PERFORMANCE_TARGET = {
    "xuat-sac": { label: "Xuất sắc", min: 3.6, max: 4.0 },
    gioi: { label: "Giỏi", min: 3.2, max: 3.59 },
    kha: { label: "Khá", min: 2.5, max: 3.19 },
    "trung-binh": { label: "Trung bình", min: 2.0, max: 2.49 },
    yeu: { label: "Yếu", min: 1.0, max: 1.99 },
    kem: { label: "Kém", min: 0.0, max: 0.99 }
};

const SCORE_PROFILE = {
    on_dinh: { label: "Ổn định", variance: 0.18 },
    can_bang: { label: "Cân bằng", variance: 0.32 },
    dao_dong: { label: "Dao động", variance: 0.6 }
};

const FALLBACK_COURSE_PLAN = [
    {
        year: 1,
        semester: 1,
        code: "HK01",
        courses: [
            ["COMP1010", "Lập trình cơ bản", 3],
            ["COMP1800", "Cơ sở toán trong CNTT", 4],
            ["COMP1801", "Toán rời rạc và ứng dụng", 2],
            ["COMP1802", "Thiết kế web", 2],
            ["POLI1003", "Pháp luật đại cương", 2],
            ["PSYC1001", "Tâm lý học đại cương", 2]
        ]
    },
    {
        year: 1,
        semester: 2,
        code: "HK02",
        courses: [
            ["COMP1013", "Lập trình nâng cao", 3],
            ["COMP1017", "Lập trình hướng đối tượng", 3],
            ["COMP1018", "Cơ sở dữ liệu", 3],
            ["COMP1332", "Hệ điều hành", 3],
            ["POLI2002", "Kinh tế chính trị học Mác - Lênin", 2],
            ["PSYC1943", "Kỹ năng thích ứng với đại học", 2]
        ]
    },
    {
        year: 2,
        semester: 1,
        code: "HK03",
        courses: [
            ["COMP2003", "Cấu trúc dữ liệu và giải thuật", 4],
            ["COMP2101", "Mạng máy tính", 3],
            ["COMP2104", "Công nghệ phần mềm", 3],
            ["COMP2108", "Hệ quản trị cơ sở dữ liệu", 3],
            ["STAT2001", "Xác suất thống kê", 3],
            ["ENGL2001", "Tiếng Anh học thuật 1", 2]
        ]
    },
    {
        year: 2,
        semester: 2,
        code: "HK04",
        courses: [
            ["COMP2201", "Kiến trúc máy tính", 3],
            ["COMP2204", "Phân tích và thiết kế hệ thống", 3],
            ["COMP2208", "Lập trình web nâng cao", 3],
            ["COMP2210", "Phát triển ứng dụng di động", 3],
            ["COMP2212", "An toàn thông tin", 3],
            ["ENGL2002", "Tiếng Anh học thuật 2", 2]
        ]
    },
    {
        year: 3,
        semester: 1,
        code: "HK05",
        courses: [
            ["COMP3001", "Trí tuệ nhân tạo nhập môn", 3],
            ["COMP3004", "Phân tích dữ liệu", 3],
            ["COMP3012", "Điện toán đám mây", 3],
            ["COMP3015", "Thiết kế UI/UX", 2],
            ["COMP3018", "Kiểm thử phần mềm", 3],
            ["MANA3001", "Quản lý dự án CNTT", 2]
        ]
    },
    {
        year: 3,
        semester: 2,
        code: "HK06",
        courses: [
            ["COMP3102", "Phát triển API", 3],
            ["COMP3107", "Khai phá dữ liệu", 3],
            ["COMP3111", "Machine Learning cơ bản", 3],
            ["COMP3115", "DevOps và CI/CD", 3],
            ["COMP3120", "Bảo mật ứng dụng web", 3],
            ["COMP3990", "Đồ án chuyên ngành 1", 2]
        ]
    },
    {
        year: 4,
        semester: 1,
        code: "HK07",
        courses: [
            ["COMP4002", "Kiến trúc hệ thống lớn", 3],
            ["COMP4006", "Big Data", 3],
            ["COMP4010", "MLOps", 3],
            ["COMP4015", "Đảm bảo chất lượng phần mềm", 2],
            ["COMP4901", "Thực tập doanh nghiệp", 4],
            ["COMP4991", "Đồ án tốt nghiệp 1", 2]
        ]
    },
    {
        year: 4,
        semester: 2,
        code: "HK08",
        courses: [
            ["COMP4101", "Hệ gợi ý", 3],
            ["COMP4104", "Xử lý ngôn ngữ tự nhiên", 3],
            ["COMP4109", "Kỹ thuật tối ưu hóa", 2],
            ["COMP4115", "Khởi nghiệp công nghệ", 2],
            ["COMP4992", "Đồ án tốt nghiệp 2", 5],
            ["COMP4993", "Chuyên đề tự chọn", 2]
        ]
    }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCoursePlanFromCurriculum() {
    try {
        const curriculumPath = path.resolve(__dirname, "../../../data/processed/curriculum_extracted.json");
        const raw = fs.readFileSync(curriculumPath, "utf-8");
        const parsed = JSON.parse(raw);
        const sourceCourses = Array.isArray(parsed?.courses) ? parsed.courses : [];

        const courseCatalog = sourceCourses
            .map((course) => ({
                code: String(course?.ma_mon ?? "").trim(),
                name: String(course?.ten_mon ?? "").trim(),
                credits: Number(course?.so_tin_chi ?? 0),
                type: String(course?.loai_mon ?? "").trim(),
                suggestedTerm: Number(course?.hoc_ky_du_kien ?? 0),
                prereq: normalizeCourseList(course?.mon_tien_quyet),
                previous: normalizeCourseList(course?.mon_hoc_truoc),
                coreq: normalizeCourseList(course?.mon_song_hanh)
            }))
            .filter((course) => course.code && course.name && course.credits > 0 && Number.isInteger(course.suggestedTerm) && course.suggestedTerm >= 1 && course.suggestedTerm <= 8);

        if (!courseCatalog.length) return null;

        const selectedCourses = chooseCoursesByFramework(courseCatalog);
        const schedule = buildScheduleWithRules(selectedCourses);

        const plan = [];
        for (let hk = 1; hk <= 8; hk += 1) {
            const courses = (schedule.get(hk) ?? [])
                .map((course) => [course.code, course.name, course.credits])
                .sort((a, b) => a[0].localeCompare(b[0]));

            if (!courses.length) continue;

            plan.push({
                year: Math.floor((hk - 1) / 2) + 1,
                semester: hk % 2 === 1 ? 1 : 2,
                code: `HK${String(hk).padStart(2, "0")}`,
                courses
            });
        }

        return plan.length ? plan : null;
    } catch {
        return null;
    }
}

function normalizeCourseList(value) {
    return Array.isArray(value)
        ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
}

function chooseCoursesByFramework(courseCatalog) {
    const mandatory = courseCatalog.filter((course) => course.type === "Bắt buộc");
    const elective = courseCatalog.filter((course) => course.type !== "Bắt buộc");

    const selected = new Set(mandatory.map((course) => course.code));
    const electiveMap = new Map(elective.map((course) => [course.code, course]));
    const catalogMap = new Map(courseCatalog.map((course) => [course.code, course]));

    const groupGeneralCodes = ["EDUC2801", "PSYC1493", "PSYC2801", "DOMS0"];
    const groupSpecializedCodes = ["COMP1043", "COMP1308", "COMP1047", "COMP1712", "COMP1050", "COMP1709", "COMP1304", "COMP1024", "COMP1305"];

    pickElectivesByCredits(groupGeneralCodes.map((code) => electiveMap.get(code)).filter(Boolean), 4, selected);
    pickElectivesByCredits(groupSpecializedCodes.map((code) => electiveMap.get(code)).filter(Boolean), 6, selected);

    const remainingElectives = elective
        .filter((course) => !selected.has(course.code))
        .sort((a, b) => a.suggestedTerm - b.suggestedTerm || a.code.localeCompare(b.code));
    pickElectivesByCredits(remainingElectives, 18, selected);

    expandDependencies(selected, catalogMap);

    return courseCatalog.filter((course) => selected.has(course.code));
}

function expandDependencies(selectedCodes, catalogMap) {
    const queue = Array.from(selectedCodes);
    while (queue.length) {
        const code = queue.shift();
        const course = catalogMap.get(code);
        if (!course) continue;

        const dependencies = [...course.prereq, ...course.previous, ...course.coreq];
        for (const depCode of dependencies) {
            if (selectedCodes.has(depCode)) continue;
            if (!catalogMap.has(depCode)) continue;
            selectedCodes.add(depCode);
            queue.push(depCode);
        }
    }
}

function pickElectivesByCredits(candidates, requiredCredits, selectedCodes) {
    let credits = 0;
    for (const course of candidates) {
        if (credits >= requiredCredits) break;
        if (selectedCodes.has(course.code)) continue;

        const nextCredits = credits + course.credits;
        if (nextCredits > requiredCredits && credits > 0) continue;

        selectedCodes.add(course.code);
        credits = nextCredits;
    }
}

function buildScheduleWithRules(selectedCourses) {
    const remaining = new Map(selectedCourses.map((course) => [course.code, course]));
    const schedule = new Map(Array.from({ length: 8 }, (_, idx) => [idx + 1, []]));
    const passedCodes = new Set();
    const maxCreditsByTerm = { 1: 18, 2: 19, 3: 19, 4: 19, 5: 19, 6: 19, 7: 16, 8: 14 };

    for (let term = 1; term <= 8; term += 1) {
        const termCourses = [];
        const termSet = new Set();
        let termCredits = 0;
        const maxCredits = maxCreditsByTerm[term] ?? 18;

        let changed = true;
        while (changed) {
            changed = false;
            const candidates = Array.from(remaining.values())
                .filter((course) => course.suggestedTerm <= term)
                .filter((course) => prerequisitesSatisfied(course, passedCodes))
                .filter((course) => corequisitesSatisfied(course, passedCodes, termSet))
                .sort((a, b) => {
                    const aPriority = a.type === "Bắt buộc" ? 0 : 1;
                    const bPriority = b.type === "Bắt buộc" ? 0 : 1;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    if (a.suggestedTerm !== b.suggestedTerm) return a.suggestedTerm - b.suggestedTerm;
                    return a.code.localeCompare(b.code);
                });

            for (const course of candidates) {
                if (termSet.has(course.code)) continue;
                if (termCredits + course.credits > maxCredits && termCredits > 0) continue;

                termSet.add(course.code);
                termCourses.push(course);
                termCredits += course.credits;
                changed = true;
            }
        }

        if (!termCourses.length) {
            const fallback = Array.from(remaining.values())
                .filter((course) => prerequisitesSatisfied(course, passedCodes))
                .filter((course) => corequisitesSatisfied(course, passedCodes, termSet))
                .sort((a, b) => a.suggestedTerm - b.suggestedTerm || a.code.localeCompare(b.code))[0];

            if (fallback) {
                termSet.add(fallback.code);
                termCourses.push(fallback);
            }
        }

        schedule.set(term, termCourses);
        for (const course of termCourses) {
            remaining.delete(course.code);
            passedCodes.add(course.code);
        }
    }

    if (remaining.size) {
        const lastTerm = schedule.get(8) ?? [];
        for (const course of remaining.values()) {
            lastTerm.push(course);
        }
        schedule.set(8, lastTerm);
    }

    return schedule;
}

function prerequisitesSatisfied(course, passedCodes) {
    const required = [...course.prereq, ...course.previous];
    return required.every((code) => passedCodes.has(code));
}

function corequisitesSatisfied(course, passedCodes, currentTermCodes) {
    return course.coreq.every((code) => passedCodes.has(code) || currentTermCodes.has(code));
}

const COURSE_PLAN = loadCoursePlanFromCurriculum() ?? FALLBACK_COURSE_PLAN;

function createSeed(str) {
    let seed = 0;
    for (let i = 0; i < str.length; i += 1) {
        seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
    }
    return seed || 123456;
}

function seededRandom(seedObj) {
    seedObj.value = (seedObj.value * 1664525 + 1013904223) % 4294967296;
    return seedObj.value / 4294967296;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getNearestGradeByPoint4(targetPoint) {
    const sorted = [...GRADE_SCALE].sort((a, b) => Math.abs(a.point4 - targetPoint) - Math.abs(b.point4 - targetPoint));
    return sorted[0];
}

function randomScoreInBand(grade, seedObj) {
    const r = seededRandom(seedObj);
    const raw = grade.min10 + r * (grade.max10 - grade.min10);
    return Math.round(raw * 10) / 10;
}

function round2(num) {
    return Math.round(num * 100) / 100;
}

function buildResultForCourse(course, targetGpa, variance, seedObj) {
    const noise = (seededRandom(seedObj) - 0.5) * 2 * variance;
    const targetPoint = clamp(targetGpa + noise, 0, 4);
    const grade = getNearestGradeByPoint4(targetPoint);
    const score10 = randomScoreInBand(grade, seedObj);

    return {
        courseCode: course[0],
        courseName: course[1],
        credits: course[2],
        score10,
        score4: grade.point4,
        letter: grade.letter,
        passed: grade.point4 >= 1.0
    };
}

function calcGpa(rows) {
    const totalCredits = rows.reduce((sum, row) => sum + row.credits, 0);
    const weighted = rows.reduce((sum, row) => sum + row.score4 * row.credits, 0);
    return {
        totalCredits,
        gpa4: totalCredits ? round2(weighted / totalCredits) : 0
    };
}

export function getLoginOptions() {
    return {
        performance: Object.entries(PERFORMANCE_TARGET).map(([value, item]) => ({ value, label: item.label })),
        scoreProfiles: Object.entries(SCORE_PROFILE).map(([value, item]) => ({ value, label: item.label })),
        terms: COURSE_PLAN.map((term) => ({
            value: `${term.year}-${term.semester}`,
            label: `Năm ${term.year} - Học kỳ ${term.semester}`,
            year: term.year,
            semester: term.semester
        }))
    };
}

export function generateStudentDataset({ performance, scoreProfile, year, semester }) {
    const perf = PERFORMANCE_TARGET[performance] || PERFORMANCE_TARGET.kha;
    const profile = SCORE_PROFILE[scoreProfile] || SCORE_PROFILE.can_bang;

    const targetIndex = COURSE_PLAN.findIndex((x) => x.year === year && x.semester === semester);
    const lastIndex = targetIndex >= 0 ? targetIndex : 4;

    const seedObj = { value: createSeed(`${performance}|${scoreProfile}|${year}|${semester}`) };
    const targetGpa = perf.min + seededRandom(seedObj) * (perf.max - perf.min);

    const terms = COURSE_PLAN.slice(0, lastIndex + 1).map((term) => {
        const rows = term.courses.map((course) => buildResultForCourse(course, targetGpa, profile.variance, seedObj));
        const summary = calcGpa(rows);

        return {
            ...term,
            rows,
            semesterGpa4: summary.gpa4,
            semesterCredits: summary.totalCredits
        };
    });

    const allRows = terms.flatMap((term) => term.rows);
    const cumulative = calcGpa(allRows);

    const student = {
        id: "50.01.104.022",
        fullName: "Võ Chí Cường",
        email: "demo.student@beograd.edu.vn",
        className: "50.01.CNTT.C",
        program: "Công nghệ thông tin",
        faculty: "Khoa Công nghệ thông tin",
        advisor: "Nguyễn Phương Nam",
        cohort: "Khóa 50 (2024)",
        phone: "0398190250",
        address: "272 Lê Quí Tôn, Phường 08, Thành phố Hồ Chí Minh"
    };

    return {
        student,
        config: {
            performance,
            performanceLabel: perf.label,
            scoreProfile,
            scoreProfileLabel: profile.label,
            selectedTerm: { year, semester }
        },
        overview: {
            accumulatedCredits: cumulative.totalCredits,
            cumulativeGpa4: cumulative.gpa4,
            targetRange: `${perf.min} - ${perf.max}`
        },
        terms
    };
}
