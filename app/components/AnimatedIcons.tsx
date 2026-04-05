"use client";

interface AnimatedFireIconProps {
    size?: number;
    className?: string;
}

export function AnimatedFireIcon({ size = 16, className = "" }: AnimatedFireIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={`${className}`}
            style={{ animation: "fire-flicker 1.8s ease-in-out infinite" }}
        >
            <path
                d="M12 2C10.5 6 7 8 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 8 13.5 6 12 2Z"
                fill="url(#fire-grad-outer)"
            />
            <path
                d="M12 8C11 10 9.5 11.5 9.5 13.5C9.5 15.5 10.6 17 12 17C13.4 17 14.5 15.5 14.5 13.5C14.5 11.5 13 10 12 8Z"
                fill="url(#fire-grad-inner)"
            />
            <path
                d="M12 12C11.5 13 11 14 11 15C11 15.8 11.4 16.5 12 16.5C12.6 16.5 13 15.8 13 15C13 14 12.5 13 12 12Z"
                fill="#FFF5CC"
            />
            <defs>
                <linearGradient id="fire-grad-outer" x1="12" y1="2" x2="12" y2="18" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF6B00" />
                    <stop offset="50%" stopColor="#FF3D00" />
                    <stop offset="100%" stopColor="#E80000" />
                </linearGradient>
                <linearGradient id="fire-grad-inner" x1="12" y1="8" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFAB40" />
                    <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>
            </defs>
        </svg>
    );
}

interface AnimatedBoltIconProps {
    size?: number;
    className?: string;
}

export function AnimatedBoltIcon({ size = 16, className = "" }: AnimatedBoltIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path
                d="M13 2L4.5 13H11L10 22L19.5 11H13L13 2Z"
                fill="url(#bolt-grad)"
                stroke="url(#bolt-stroke-grad)"
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
            <path
                d="M12.5 6L9 13H12L11.5 18L16 11H13L12.5 6Z"
                fill="rgba(255,255,255,0.3)"
            />
            <defs>
                <linearGradient id="bolt-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>
                <linearGradient id="bolt-stroke-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFE082" />
                    <stop offset="100%" stopColor="#FF8F00" />
                </linearGradient>
            </defs>
        </svg>
    );
}
