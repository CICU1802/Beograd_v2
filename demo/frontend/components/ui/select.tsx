import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: SelectOption[];
};

export function Select({ className, options, ...props }: SelectProps) {
    return (
        <select
            className={cn(
                "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                className
            )}
            {...props}
        >
            {options.map((item) => (
                <option key={item.value} value={item.value}>
                    {item.label}
                </option>
            ))}
        </select>
    );
}
