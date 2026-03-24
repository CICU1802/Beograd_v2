"use client";

import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/session";

export function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        clearSession();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex items-center justify-between gap-3">
                <div className="relative hidden w-full max-w-md sm:block">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        placeholder="Tìm môn học, mã môn, ghi chú..."
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button type="button" className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100">
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                    </button>

                    <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 sm:flex">
                        <Avatar name="Võ Chí Cường" size="sm" />
                        <span className="text-sm font-medium text-slate-700">Beograd</span>
                    </div>

                    <Button variant="outline" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </div>
        </header>
    );
}
