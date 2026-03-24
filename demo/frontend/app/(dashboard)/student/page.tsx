"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSession, type SessionData } from "@/lib/session";
import { formatGpa } from "@/lib/utils";

export default function StudentPage() {
    const router = useRouter();
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        const current = getSession();
        if (!current) {
            router.replace("/login");
            return;
        }
        setSession(current);
    }, [router]);

    const lastTerm = useMemo(() => {
        if (!session) return null;
        return session.payload.terms.at(-1) ?? null;
    }, [session]);

    if (!session) {
        return <div className="text-sm text-slate-500">Đang tải dữ liệu sinh viên...</div>;
    }

    const { student, overview, config } = session.payload;
    const progress = Math.min(100, Math.round((overview.accumulatedCredits / 140) * 100));

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
                    <Avatar name={student.fullName} size="lg" />
                    <div>
                        <p className="text-sm text-slate-500">Xin chào,</p>
                        <h1 className="font-display text-2xl font-bold text-slate-900">{student.fullName}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">MSSV: {student.id}</Badge>
                            <Badge tone="success">Học lực mô phỏng: {config.performanceLabel}</Badge>
                            <Badge tone="warning">Kiểu fill: {config.scoreProfileLabel}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <h2 className="font-display text-lg font-semibold text-slate-900">Thông tin sinh viên</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Info label="Email" value={student.email} />
                            <Info label="Lớp" value={student.className} />
                            <Info label="Chương trình" value={student.program} />
                            <Info label="Khoa" value={student.faculty} />
                            <Info label="Cố vấn học tập" value={student.advisor} />
                            <Info label="Niên khóa" value={student.cohort} />
                            <Info label="Số điện thoại" value={student.phone} />
                            <Info label="Địa chỉ" value={student.address} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="font-display text-lg font-semibold text-slate-900">Tiến độ học tập</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500">Số tín chỉ tích lũy</p>
                            <p className="text-xl font-bold text-slate-900">{overview.accumulatedCredits}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">GPA tích lũy hệ 4</p>
                            <p className="text-xl font-bold text-brand-700">{formatGpa(overview.cumulativeGpa4)}</p>
                            <p className="text-xs text-slate-500">Mức mục tiêu: {overview.targetRange}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs text-slate-500">Lộ trình hoàn thành chương trình</p>
                            <Progress value={progress} />
                            <p className="mt-2 text-xs text-slate-500">{progress}% trên mốc 140 tín chỉ</p>
                        </div>
                        {lastTerm && (
                            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                Kỳ gần nhất: Năm {lastTerm.year} - HK {lastTerm.semester} | GPA kỳ: {formatGpa(lastTerm.semesterGpa4)}
                            </div>
                        )}
                        <Link href="/results" className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
                            Xem chi tiết kết quả học tập →
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}
