"use client";

import { cn } from "@/lib/utils";

type TabItem = { value: string; label: string };

type TabsProps = {
    value: string;
    items: TabItem[];
    onChange: (value: string) => void;
};

export function Tabs({ value, items, onChange }: TabsProps) {
    return (
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => onChange(item.value)}
                    className={cn(
                        "rounded-lg px-3 py-1.5 text-sm transition",
                        value === item.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
