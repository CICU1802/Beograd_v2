import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
};

const variantClass: Record<Variant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                variantClass[variant],
                className
            )}
            {...props}
        />
    );
}
