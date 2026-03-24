import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600", className)} {...props} />;
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("border-b border-slate-100 px-3 py-2 text-slate-700", className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn("hover:bg-slate-50/80", className)} {...props} />;
}
