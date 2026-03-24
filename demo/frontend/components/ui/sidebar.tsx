"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, GraduationCap, LayoutDashboard, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const MENU = [
    { href: "/student", label: "Thông tin sinh viên", icon: UserCircle2 },
    { href: "/results", label: "Kết quả học tập", icon: BarChart3 },
    { href: "/agent", label: "AI Agent", icon: Bot }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 backdrop-blur lg:flex lg:flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
                <div className="rounded-2xl bg-brand-600 p-2 text-white">
                    <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-display text-base font-bold text-slate-900">Beograd LMS</p>
                    <p className="text-xs text-slate-500">Demo Student Portal</p>
                </div>
            </div>

            <div className="mx-4 mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                    <Avatar name="Võ Chí Cường" size="md" />
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Võ Chí Cường</p>
                        <p className="text-xs text-slate-500">50.01.104.022</p>
                    </div>
                </div>
            </div>

            <nav className="mt-5 flex flex-1 flex-col gap-1 px-3">
                <Link
                    href="/student"
                    className={cn(
                        "mb-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                        pathname.startsWith("/student") || pathname.startsWith("/results") || pathname.startsWith("/agent")
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-100"
                    )}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Link>

                {MENU.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                                active ? "bg-brand-600 text-white shadow-soft" : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
