"use client";

interface IconProps {
    size?: number;
    className?: string;
}

export function DumbbellIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="9.5" width="3" height="5" rx="1" />
            <rect x="19" y="9.5" width="3" height="5" rx="1" />
            <rect x="5" y="7.5" width="2.5" height="9" rx="0.75" />
            <rect x="16.5" y="7.5" width="2.5" height="9" rx="0.75" />
            <line x1="7.5" y1="12" x2="16.5" y2="12" />
        </svg>
    );
}

export function PullUpIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Bar */}
            <line x1="3" y1="3.5" x2="21" y2="3.5" />
            {/* Arms reaching up to bar */}
            <line x1="9" y1="3.5" x2="9.5" y2="7" />
            <line x1="15" y1="3.5" x2="14.5" y2="7" />
            {/* Head */}
            <circle cx="12" cy="8.5" r="1.75" />
            {/* Torso */}
            <line x1="12" y1="10.25" x2="12" y2="16.5" />
            {/* Legs */}
            <line x1="12" y1="16.5" x2="9.5" y2="21" />
            <line x1="12" y1="16.5" x2="14.5" y2="21" />
        </svg>
    );
}

export function DipIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Parallel bars */}
            <line x1="3" y1="8" x2="8" y2="8" />
            <line x1="16" y1="8" x2="21" y2="8" />
            <line x1="3" y1="8" x2="3" y2="11" />
            <line x1="21" y1="8" x2="21" y2="11" />
            {/* Arms on bars */}
            <line x1="8" y1="8" x2="9.5" y2="6" />
            <line x1="16" y1="8" x2="14.5" y2="6" />
            {/* Head */}
            <circle cx="12" cy="4.5" r="1.75" />
            {/* Torso */}
            <line x1="12" y1="6.25" x2="12" y2="14" />
            {/* Shoulders */}
            <line x1="9.5" y1="6" x2="14.5" y2="6" />
            {/* Legs hanging */}
            <line x1="12" y1="14" x2="10.5" y2="19.5" />
            <line x1="12" y1="14" x2="13.5" y2="19.5" />
        </svg>
    );
}

export function PushUpIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="4.5" cy="10" r="1.75" />
            {/* Arms (straight down) */}
            <line x1="7" y1="13.5" x2="7" y2="17.5" />
            <line x1="9.5" y1="13.5" x2="9.5" y2="17.5" />
            {/* Torso angled */}
            <line x1="6.25" y1="11.5" x2="17" y2="13" />
            {/* Shoulders */}
            <line x1="6.25" y1="11.5" x2="9.5" y2="13.5" />
            <line x1="6.25" y1="11.5" x2="7" y2="13.5" />
            {/* Hips to legs */}
            <line x1="17" y1="13" x2="20" y2="15" />
            {/* Ground */}
            <line x1="3" y1="17.5" x2="21" y2="17.5" />
        </svg>
    );
}

export function SquatIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="12" cy="3.5" r="1.75" />
            {/* Torso (slightly forward lean) */}
            <line x1="12" y1="5.25" x2="11.5" y2="11" />
            {/* Upper legs (thighs parallel — squat position) */}
            <line x1="11.5" y1="11" x2="8" y2="12.5" />
            <line x1="11.5" y1="11" x2="15" y2="12.5" />
            {/* Lower legs */}
            <line x1="8" y1="12.5" x2="7.5" y2="18" />
            <line x1="15" y1="12.5" x2="15.5" y2="18" />
            {/* Feet */}
            <line x1="6.5" y1="18" x2="8.5" y2="18" />
            <line x1="14.5" y1="18" x2="16.5" y2="18" />
            {/* Arms forward for balance */}
            <line x1="12" y1="7" x2="16" y2="6" />
            <line x1="12" y1="7" x2="8" y2="6" />
        </svg>
    );
}

export function LungeIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="10" cy="3.5" r="1.75" />
            {/* Torso upright */}
            <line x1="10" y1="5.25" x2="10" y2="11.5" />
            {/* Front leg bent (lunge) */}
            <line x1="10" y1="11.5" x2="6.5" y2="14" />
            <line x1="6.5" y1="14" x2="6.5" y2="19" />
            <line x1="5.5" y1="19" x2="7.5" y2="19" />
            {/* Back leg extended */}
            <line x1="10" y1="11.5" x2="15" y2="13.5" />
            <line x1="15" y1="13.5" x2="18.5" y2="17" />
            <line x1="18.5" y1="17" x2="19.5" y2="17" />
            {/* Arms at sides */}
            <line x1="10" y1="7" x2="7.5" y2="9.5" />
            <line x1="10" y1="7" x2="12.5" y2="9.5" />
        </svg>
    );
}

export function DeadliftIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="12" cy="4" r="1.75" />
            {/* Torso — hinged forward */}
            <line x1="12" y1="5.75" x2="10" y2="11" />
            {/* Hips */}
            <line x1="10" y1="11" x2="9" y2="14.5" />
            <line x1="10" y1="11" x2="13" y2="14.5" />
            {/* Lower legs */}
            <line x1="9" y1="14.5" x2="8.5" y2="19.5" />
            <line x1="13" y1="14.5" x2="13.5" y2="19.5" />
            {/* Feet */}
            <line x1="7.5" y1="19.5" x2="9.5" y2="19.5" />
            <line x1="12.5" y1="19.5" x2="14.5" y2="19.5" />
            {/* Arms hanging down holding bar */}
            <line x1="11" y1="7.5" x2="9.5" y2="13" />
            <line x1="13" y1="7.5" x2="14.5" y2="13" />
            {/* Barbell on ground */}
            <line x1="5" y1="13" x2="19" y2="13" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="19" cy="13" r="1.5" />
        </svg>
    );
}

export function PlankIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <circle cx="4.5" cy="9.5" r="1.75" />
            {/* Torso — horizontal plank */}
            <line x1="6.25" y1="10.5" x2="18" y2="11.5" />
            {/* Front arms (forearms on ground) */}
            <line x1="6.25" y1="10.5" x2="7" y2="14.5" />
            <line x1="7" y1="14.5" x2="9" y2="14.5" />
            {/* Back legs */}
            <line x1="18" y1="11.5" x2="20.5" y2="14.5" />
            <line x1="20.5" y1="14.5" x2="21" y2="14.5" />
            {/* Ground */}
            <line x1="3" y1="14.5" x2="21" y2="14.5" />
        </svg>
    );
}

export function TimerIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Watch top */}
            <line x1="10" y1="2" x2="14" y2="2" />
            <line x1="12" y1="2" x2="12" y2="4" />
            {/* Side button */}
            <line x1="19.5" y1="7" x2="21" y2="5.5" />
            {/* Clock face */}
            <circle cx="12" cy="13" r="8" />
            {/* Minute hand */}
            <line x1="12" y1="13" x2="12" y2="8" />
            {/* Second hand */}
            <line x1="12" y1="13" x2="15.5" y2="10.5" />
            {/* Center dot */}
            <circle cx="12" cy="13" r="0.75" fill="currentColor" />
        </svg>
    );
}

export function MuscleIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Flexed arm / bicep */}
            <path d="M4 16 C4 16 4.5 14 5 13 C5.5 12 6 11.5 6.5 11 C7 10.5 7 9 7 8 C7 7 7.5 5.5 9 5 C10.5 4.5 11.5 5 12 6 C12.5 7 12.5 8.5 13 9 C13.5 9.5 14.5 9.5 15.5 9 C16.5 8.5 17 8 18 8 C19 8 20 9 20 10.5 C20 12 19.5 12.5 19 13 C18.5 13.5 17 14 16 14 L14.5 14" />
            {/* Fist */}
            <path d="M14.5 14 C14.5 14 15 15 14.5 15.5 C14 16 13 16 12.5 15.5 C12 15 12 14.5 12 14 C12 13.5 11 13 10 13.5 C9 14 8 15 7 16 C6 17 4.5 16.5 4 16" />
        </svg>
    );
}

export function PlayIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6,3 20,12 6,21" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function PauseIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="5" y="3" width="5" height="18" rx="1" fill="currentColor" />
            <rect x="14" y="3" width="5" height="18" rx="1" fill="currentColor" />
        </svg>
    );
}

export function SkipIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <polygon points="4,4 16,12 4,20" fill="currentColor" />
            <rect x="17" y="4" width="3.5" height="16" rx="0.75" fill="currentColor" />
        </svg>
    );
}

export function ResetIcon({ size = 24, className = "" }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {/* Circular arrow */}
            <path d="M3.5 2v6h6" />
            <path d="M3.5 8 A9 9 0 1 1 3.5 16" />
        </svg>
    );
}
