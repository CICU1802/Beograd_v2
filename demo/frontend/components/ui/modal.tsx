import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
            <div
                className={cn("w-full max-w-lg rounded-2xl bg-white p-5 shadow-soft animate-fade-up")}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <div className="mt-3 text-sm text-slate-600">{children}</div>
            </div>
        </div>
    );
}
