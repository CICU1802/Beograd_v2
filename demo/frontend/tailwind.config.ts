import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Manrope", "system-ui", "sans-serif"],
                display: ["Sora", "system-ui", "sans-serif"]
            },
            colors: {
                brand: {
                    50: "#e8f3ff",
                    100: "#d4eaff",
                    200: "#a8d4ff",
                    300: "#74bbff",
                    400: "#429fff",
                    500: "#1e80ff",
                    600: "#105fd1",
                    700: "#0f4ca5",
                    800: "#113f86",
                    900: "#15386f"
                }
            },
            boxShadow: {
                soft: "0 12px 30px -18px rgba(16, 95, 209, 0.45)",
                card: "0 10px 24px -16px rgba(12, 34, 77, 0.35)"
            },
            keyframes: {
                "fade-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" }
                }
            },
            animation: {
                "fade-up": "fade-up 420ms ease-out"
            }
        }
    },
    plugins: []
};

export default config;
