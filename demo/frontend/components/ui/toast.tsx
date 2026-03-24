"use client";

import { useEffect } from "react";

type ToastProps = {
    message: string;
    open: boolean;
    onClose: () => void;
};

export function Toast({ message, open, onClose }: ToastProps) {
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(onClose, 2400);
        return () => clearTimeout(timer);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-soft animate-fade-up">
            {message}
        </div>
    );
}
