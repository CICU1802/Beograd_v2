type AvatarProps = {
    name: string;
    size?: "sm" | "md" | "lg";
};

const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg"
};

export function Avatar({ name, size = "md" }: AvatarProps) {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    return (
        <div
            className={`${sizeMap[size]} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white`}
        >
            {initials}
        </div>
    );
}
