import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
    subsets: ["latin", "vietnamese"],
    variable: "--font-manrope"
});

const sora = Sora({
    subsets: ["latin", "latin-ext"],
    variable: "--font-sora"
});

export const metadata: Metadata = {
    title: "Beograd LMS Demo",
    description: "Mô phỏng giao diện cổng thông tin sinh viên"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="vi">
            <body className={`${manrope.variable} ${sora.variable}`}>{children}</body>
        </html>
    );
}
