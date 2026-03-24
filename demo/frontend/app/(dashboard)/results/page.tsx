"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { getSession, type SessionData } from "@/lib/session";
import { formatGpa, termLabel } from "@/lib/utils";
import { CourseRow, TermResult } from "@/lib/types";

export default function ResultsPage() {
    const router = useRouter();
    const [session, setSession] = useState<SessionData | null>(null);
    const [termFilter, setTermFilter] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [sortBy, setSortBy] = useState<"score10" | "score4">("score10");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const current = getSession();
        if (!current) {
            router.replace("/login");
            return;
        }
        setSession(current);
    }, [router]);

    const terms = session?.payload.terms ?? [];

    const displayedTerms = useMemo(() => {
        const selectedTerms = termFilter === "all" ? terms : terms.filter((term) => `${term.year}-${term.semester}` === termFilter);
        const query = keyword.trim().toLowerCase();

        return selectedTerms
            .map((term) => {
                const byStatus =
                    statusFilter === "all"
                        ? term.rows
                        : term.rows.filter((row) => (statusFilter === "pass" ? row.passed : !row.passed));

                const byKeyword = query
                    ? byStatus.filter((row) => row.courseCode.toLowerCase().includes(query) || row.courseName.toLowerCase().includes(query))
                    : byStatus;

                const rows = [...byKeyword].sort((a, b) => {
                    const left = sortBy === "score10" ? a.score10 : a.score4;
                    const right = sortBy === "score10" ? b.score10 : b.score4;
                    return sortDir === "asc" ? left - right : right - left;
                });

                return {
                    ...term,
                    displayRows: rows,
                    displayCredits: rows.reduce((sum, row) => sum + row.credits, 0),
                    passedCredits: rows.reduce((sum, row) => (row.passed ? sum + row.credits : sum), 0),
                    semesterAverage10: calcWeightedAverage10(rows)
                };
            })
            .filter((term) => term.displayRows.length > 0 || !query);
    }, [terms, termFilter, keyword, statusFilter, sortBy, sortDir]);

    const totalRows = useMemo(
        () => displayedTerms.reduce((sum, term) => sum + term.displayRows.length, 0),
        [displayedTerms]
    );

    if (!session) {
        return <div className="text-sm text-slate-500">Đang tải kết quả học tập...</div>;
    }

    const config = session.payload.config;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h1 className="font-display text-xl font-semibold text-slate-900">Kết quả học tập</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Dữ liệu đã fill theo học lực: {config.performanceLabel} | Kỳ mục tiêu: {termLabel(config.selectedTerm.year, config.selectedTerm.semester)}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-4">
                        <Input placeholder="Tìm mã môn / tên môn" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

                        <Select
                            value={termFilter}
                            onChange={(e) => setTermFilter(e.target.value)}
                            options={[
                                { value: "all", label: "Tất cả học kỳ" },
                                ...terms.map((term) => ({
                                    value: `${term.year}-${term.semester}`,
                                    label: termLabel(term.year, term.semester)
                                }))
                            ]}
                        />

                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "score10" | "score4")}
                            options={[
                                { value: "score10", label: "Sắp theo điểm hệ 10" },
                                { value: "score4", label: "Sắp theo điểm hệ 4" }
                            ]}
                        />

                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: "all", label: "Tất cả trạng thái" },
                                { value: "pass", label: "Đạt" },
                                { value: "fail", label: "Không đạt" }
                            ]}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Tabs
                            value={sortDir}
                            onChange={(value) => setSortDir(value as "asc" | "desc")}
                            items={[
                                { value: "desc", label: "Điểm cao trước" },
                                { value: "asc", label: "Điểm thấp trước" }
                            ]}
                        />
                        <p className="text-sm text-slate-500">Tổng số học phần hiển thị: {totalRows}</p>
                    </div>

                    <div className="space-y-5">
                        {displayedTerms.map((term) => (
                            <SemesterBlock key={`${term.year}-${term.semester}`} term={term} onSort10={() => setSortBy("score10")} onSort4={() => setSortBy("score4")} />
                        ))}

                        {displayedTerms.length === 0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                                Không có dữ liệu phù hợp bộ lọc.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                {terms.map((term) => (
                    <Card key={`${term.year}-${term.semester}`}>
                        <CardContent className="space-y-2">
                            <p className="text-sm font-semibold text-slate-800">{termLabel(term.year, term.semester)}</p>
                            <p className="text-xs text-slate-500">Số tín chỉ kỳ: {term.semesterCredits}</p>
                            <p className="text-lg font-bold text-brand-700">GPA kỳ: {formatGpa(term.semesterGpa4)}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ResultRow({ index, row }: { index: number; row: CourseRow }) {
    return (
        <Tr>
            <Td>{index}</Td>
            <Td className="font-semibold text-slate-800">{row.courseCode}</Td>
            <Td>{row.courseName}</Td>
            <Td>{row.credits}</Td>
            <Td>{row.score10.toFixed(1)}</Td>
            <Td>{row.score4.toFixed(1)}</Td>
            <Td>{row.letter}</Td>
            <Td>{row.passed ? <Badge tone="success">Đạt</Badge> : <Badge tone="danger">Không đạt</Badge>}</Td>
        </Tr>
    );
}

function SemesterBlock({
    term,
    onSort10,
    onSort4
}: {
    term: TermResult & {
        displayRows: CourseRow[];
        displayCredits: number;
        passedCredits: number;
        semesterAverage10: number;
    };
    onSort10: () => void;
    onSort4: () => void;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-brand-50 px-4 py-3">
                <p className="font-semibold text-brand-900">{termLabel(term.year, term.semester)}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-white px-2 py-1">Mã kỳ: {term.code}</span>
                    <span className="rounded-full bg-white px-2 py-1">GPA kỳ: {formatGpa(term.semesterGpa4)}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <thead>
                        <tr>
                            <Th>STT</Th>
                            <Th>Mã môn</Th>
                            <Th>Tên môn học</Th>
                            <Th>Số TC</Th>
                            <Th>
                                <button type="button" className="inline-flex items-center gap-1" onClick={onSort10}>
                                    Điểm hệ 10
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                            </Th>
                            <Th>
                                <button type="button" className="inline-flex items-center gap-1" onClick={onSort4}>
                                    Điểm hệ 4
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                            </Th>
                            <Th>Điểm chữ</Th>
                            <Th>Kết quả</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {term.displayRows.map((row, index) => (
                            <ResultRow key={`${term.code}-${row.courseCode}-${index}`} index={index + 1} row={row} />
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className="grid gap-3 border-t border-slate-200 bg-amber-50 px-4 py-3 text-xs text-slate-700 md:grid-cols-2">
                <div className="space-y-1">
                    <p>- Tổng số học phần hiển thị kỳ này: {term.displayRows.length}</p>
                    <p>- Tổng tín chỉ hiển thị kỳ này: {term.displayCredits}</p>
                    <p>- Tín chỉ đạt trong kỳ: {term.passedCredits}</p>
                </div>
                <div className="space-y-1">
                    <p>- Điểm TB học kỳ (hệ 10): {term.semesterAverage10.toFixed(2)}</p>
                    <p>- Điểm TB học kỳ (hệ 4): {formatGpa(term.semesterGpa4)}</p>
                    <p>- Xếp loại kỳ: {classifyByGpa(term.semesterGpa4)}</p>
                </div>
            </div>
        </section>
    );
}

function calcWeightedAverage10(rows: CourseRow[]) {
    const totalCredits = rows.reduce((sum, row) => sum + row.credits, 0);
    const totalScore = rows.reduce((sum, row) => sum + row.score10 * row.credits, 0);
    return totalCredits ? totalScore / totalCredits : 0;
}

function classifyByGpa(gpa4: number) {
    if (gpa4 >= 3.6) return "Xuất sắc";
    if (gpa4 >= 3.2) return "Giỏi";
    if (gpa4 >= 2.5) return "Khá";
    if (gpa4 >= 2.0) return "Trung bình";
    if (gpa4 >= 1.0) return "Yếu";
    return "Kém";
}
