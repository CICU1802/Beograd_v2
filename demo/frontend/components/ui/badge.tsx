import { cn } from "@/lib/utils";

type BadgeProps = {
    tone?: "success" | "warning" | "danger" | "neutral";
    children: React.ReactNode;
};

const toneMap = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    neutral: "bg-slate-100 text-slate-700"
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
    return <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", toneMap[tone])}>{children}</span>;
}
