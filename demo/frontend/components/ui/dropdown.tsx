"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DropdownProps = {
    label: string;
    items: { value: string; label: string; onClick: () => void }[];
};

export function Dropdown({ label, items }: DropdownProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen((prev) => !prev)}
            >
                {label}
                <ChevronDown className="h-4 w-4" />
            </button>
            {open && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
                    {items.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100")}
                            onClick={() => {
                                item.onClick();
                                setOpen(false);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
