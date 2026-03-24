"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { Navbar } from "@/components/ui/navbar";
import { getSession } from "@/lib/session";

type DashboardShellProps = {
    children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const session = getSession();
        if (!session) {
            router.replace("/login");
            return;
        }
        setReady(true);
    }, [router]);

    if (!ready) {
        return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải dashboard...</div>;
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Navbar />
                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
