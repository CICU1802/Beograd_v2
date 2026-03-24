"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fetchOptions, postLogin } from "@/lib/api";
import { LoginOptionsResponse } from "@/lib/types";
import { saveSession, getSession } from "@/lib/session";

const defaultOptions: LoginOptionsResponse = {
    performance: [],
    scoreProfiles: [],
    terms: []
};

export default function LoginPage() {
    const router = useRouter();
    const [options, setOptions] = useState<LoginOptionsResponse>(defaultOptions);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [username, setUsername] = useState("Beograd");
    const [password, setPassword] = useState("Beograd");
    const [performance, setPerformance] = useState("xuat-sac");
    const [scoreProfile, setScoreProfile] = useState("can_bang");
    const [term, setTerm] = useState("3-1");

    useEffect(() => {
        const session = getSession();
        if (session) {
            router.replace("/student");
            return;
        }

        fetchOptions()
            .then((res) => {
                setOptions(res);
                if (res.performance[0]?.value) setPerformance(res.performance[0].value);
                if (res.scoreProfiles[0]?.value) setScoreProfile(res.scoreProfiles[0].value);
                const defaultTerm = res.terms.find((x) => x.value === "3-1")?.value ?? res.terms[0]?.value;
                if (defaultTerm) setTerm(defaultTerm);
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoadingOptions(false));
    }, [router]);

    const termParts = useMemo(() => {
        const [year, semester] = term.split("-").map(Number);
        return { year, semester };
    }, [term]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const response = await postLogin({
                username,
                password,
                performance,
                scoreProfile,
                year: termParts.year,
                semester: termParts.semester
            });

            saveSession({
                token: response.token,
                username: response.account.username,
                payload: response.payload
            });

            router.push("/student");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden p-4 lg:p-10">
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-100/60 blur-3xl" />

            <div className="relative mx-auto grid min-h-[85vh] max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="flex items-center">
                    <div className="animate-fade-up">
                        <p className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                            LMS SaaS Demo
                        </p>
                        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-900">
                            Cổng thông tin sinh viên
                            <br />
                            mô phỏng theo Beograd
                        </h1>
                        <p className="mt-4 max-w-lg text-slate-600">
                            Đăng nhập bằng tài khoản demo và chọn học lực + kỳ học để hệ thống tự fill dữ liệu điểm theo thang quy đổi bạn cung cấp.
                        </p>
                        <ul className="mt-6 space-y-2 text-sm text-slate-700">
                            <li>• Tài khoản demo: Beograd / Beograd</li>
                            <li>• Học lực: Xuất sắc, Giỏi, Khá, Trung bình, Yếu, Kém</li>
                            <li>• Fill điểm đến kỳ học bạn chọn (ví dụ năm 3 kỳ 1)</li>
                        </ul>
                    </div>
                </section>

                <section className="flex items-center">
                    <Card className="w-full animate-fade-up">
                        <CardHeader>
                            <h2 className="font-display text-xl font-semibold text-slate-900">Đăng nhập hệ thống</h2>
                            <p className="mt-1 text-sm text-slate-500">Tùy chỉnh hồ sơ học tập ngay lúc đăng nhập</p>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Tài khoản</label>
                                    <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Chọn học lực mục tiêu</label>
                                    <Select
                                        value={performance}
                                        onChange={(e) => setPerformance(e.target.value)}
                                        options={options.performance.map((item) => ({ value: item.value, label: item.label }))}
                                        disabled={loadingOptions}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Kiểu fill điểm</label>
                                    <Select
                                        value={scoreProfile}
                                        onChange={(e) => setScoreProfile(e.target.value)}
                                        options={options.scoreProfiles.map((item) => ({ value: item.value, label: item.label }))}
                                        disabled={loadingOptions}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Ổn định: ít dao động, Dao động: chênh lệch điểm giữa các môn lớn hơn.</p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Sinh viên năm / học kỳ</label>
                                    <Select
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                        options={options.terms.map((item) => ({ value: item.value, label: item.label }))}
                                        disabled={loadingOptions}
                                    />
                                </div>

                                {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

                                <Button className="w-full" disabled={submitting || loadingOptions}>
                                    {submitting ? "Đang đăng nhập..." : "Đăng nhập demo"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
