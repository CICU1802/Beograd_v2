import { cn } from "@/lib/utils";

type ProgressProps = {
    value: number;
    className?: string;
};

export function Progress({ value, className }: ProgressProps) {
    const safeValue = Math.max(0, Math.min(100, value));
    return (
        <div className={cn("h-2 w-full rounded-full bg-slate-100", className)}>
            <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700 transition-all duration-500"
                style={{ width: `${safeValue}%` }}
            />
        </div>
    );
}
