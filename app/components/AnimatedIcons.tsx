"use client";

import { motion } from "framer-motion";

interface AnimatedFireIconProps {
    size?: number;
    className?: string;
}

export function AnimatedFireIcon({ size = 16, className = "" }: AnimatedFireIconProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            animate={{ y: [0, -1, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Outer flame */}
            <motion.path
                initial={{ d: "M12 2C10.5 6 7 8 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 8 13.5 6 12 2Z" }}
                d="M12 2C10.5 6 7 8 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 8 13.5 6 12 2Z"
                fill="url(#fire-grad-outer)"
                animate={{
                    d: [
                        "M12 2C10.5 6 7 8 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 8 13.5 6 12 2Z",
                        "M12 3C10 5.5 6.5 8.5 6.5 12.5C6.5 16 9 18.5 12 18.5C15 18.5 17.5 16 17.5 12.5C17.5 8.5 14 5.5 12 3Z",
                        "M12 2C10.5 6 7 8 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 8 13.5 6 12 2Z",
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner flame */}
            <motion.path
                initial={{ d: "M12 8C11 10 9.5 11.5 9.5 13.5C9.5 15.5 10.6 17 12 17C13.4 17 14.5 15.5 14.5 13.5C14.5 11.5 13 10 12 8Z" }}
                d="M12 8C11 10 9.5 11.5 9.5 13.5C9.5 15.5 10.6 17 12 17C13.4 17 14.5 15.5 14.5 13.5C14.5 11.5 13 10 12 8Z"
                fill="url(#fire-grad-inner)"
                animate={{
                    d: [
                        "M12 8C11 10 9.5 11.5 9.5 13.5C9.5 15.5 10.6 17 12 17C13.4 17 14.5 15.5 14.5 13.5C14.5 11.5 13 10 12 8Z",
                        "M12 9C11.5 10.5 10 11.5 10 14C10 15.8 10.8 17.2 12 17.2C13.2 17.2 14 15.8 14 14C14 11.5 12.5 10.5 12 9Z",
                        "M12 8C11 10 9.5 11.5 9.5 13.5C9.5 15.5 10.6 17 12 17C13.4 17 14.5 15.5 14.5 13.5C14.5 11.5 13 10 12 8Z",
                    ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Tip */}
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
        </motion.svg>
    );
}

interface AnimatedBoltIconProps {
    size?: number;
    className?: string;
}

export function AnimatedBoltIcon({ size = 16, className = "" }: AnimatedBoltIconProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Bolt body */}
            <motion.path
                d="M13 2L4.5 13H11L10 22L19.5 11H13L13 2Z"
                fill="url(#bolt-grad)"
                stroke="url(#bolt-stroke-grad)"
                strokeWidth="0.5"
                strokeLinejoin="round"
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Glow center highlight */}
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
        </motion.svg>
    );
}
