import * as React from "react";
import { cn } from "@/lib/utils";

export function Radio({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input type="radio" className={cn("h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-200", className)} {...props} />;
}
