"use client";

import { useState } from "react";
import { AvatarCard } from "./AvatarCard";
import { AddAvatarModal } from "./AddAvatarModal";
import { UpsellModal } from "./UpsellModal";
import { SuccessAnimation } from "./SuccessAnimation";

const INITIAL_AVATARS = [
    { id: "1", emoji: "🏃‍♂️", name: "Morning Run", level: 1, currentXp: 150, goalXp: 300, streak: 3 },
];

export function ExperienceDashboard({ userId }: { userId: string }) {
    const [avatars, setAvatars] = useState(INITIAL_AVATARS);
    const [activeTab, setActiveTab] = useState("Home");
    const [isPro, setIsPro] = useState(false); // Mock pro status for now

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

    // Animation state
    const [successAnim, setSuccessAnim] = useState({ isVisible: false, xpEarned: 0 });
    const [completingId, setCompletingId] = useState<string | null>(null);

    const totalXp = avatars.reduce((sum, a) => sum + a.currentXp, 0) + (avatars.length * 100); // Mock math
    const globalLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;

    const handleComplete = (id: string) => {
        setCompletingId(id);

        // Simulate API call
        setTimeout(() => {
            const xpEarned = 50; // Random/fixed logic

            setAvatars(prev => prev.map(a => {
                if (a.id === id) {
                    const newXp = a.currentXp + xpEarned;
                    let newLevel = a.level;
                    let newGoal = a.goalXp;
                    if (newXp >= a.goalXp) {
                        newLevel++;
                        newGoal = Math.floor(a.goalXp * 1.5);
                    }
                    return { ...a, currentXp: newXp, level: newLevel, goalXp: newGoal, streak: a.streak + 1 };
                }
                return a;
            }));

            setCompletingId(null);
            setSuccessAnim({ isVisible: true, xpEarned });
        }, 800);
    };

    const handleAddClick = () => {
        if (!isPro && avatars.length >= 2) {
            setIsUpsellModalOpen(true);
        } else {
            setIsAddModalOpen(true);
        }
    };

    const handleSaveAvatar = (newAvatar: any) => {
        setAvatars(prev => [...prev, {
            id: Date.now().toString(),
            emoji: newAvatar.emoji,
            name: newAvatar.name,
            level: 1,
            currentXp: 0,
            goalXp: 300, // Starting goal
            streak: 0
        }]);
    };

    const handleUpgrade = () => {
        // We will call Whop SDK iframe.openCheckout() here
        alert("Opening Whop Checkout... (WIP)");
    };

    return (
        <div className="min-h-screen bg-[--color-optiz-dark] text-white flex flex-col max-w-md mx-auto relative border-x border-white/5 shadow-2xl">
            {/* Header */}
            <header className="px-6 pt-8 pb-4 sticky top-0 bg-[--color-optiz-dark]/80 backdrop-blur-xl z-30 border-b border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[--color-optiz-red] to-[--color-optiz-orange] flex items-center justify-center font-bold shadow-lg">
                            {globalLevel}
                        </div>
                        <div>
                            <p className="text-xs text-[--color-optiz-muted] font-medium tracking-wide uppercase">Hero Status</p>
                            <h1 className="text-lg font-bold">{totalXp.toLocaleString()} XP</h1>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-[--color-optiz-card] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        ⚙️
                    </button>
                </div>

                {/* Custom Tabs */}
                <div className="flex bg-black rounded-2xl p-1 border border-white/5">
                    {["Home", "Leaderboard"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? "bg-[--color-optiz-card] text-white shadow-md border border-white/5"
                                    : "text-[--color-optiz-muted] hover:text-white/80"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {activeTab === "Home" ? (
                    <div className="space-y-6 pb-24">
                        <div className="flex justify-between items-end mb-2">
                            <h2 className="text-2xl font-black">Your Sports</h2>
                            {!isPro && avatars.length >= 2 && (
                                <span className="text-xs font-bold text-[--color-optiz-red] bg-[--color-optiz-red]/10 px-2 py-1 rounded-lg">Limit Reached</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            {avatars.map(avatar => (
                                <AvatarCard
                                    key={avatar.id}
                                    {...avatar}
                                    onComplete={handleComplete}
                                    isCompleting={completingId === avatar.id}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleAddClick}
                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-3xl text-[--color-optiz-muted] hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-bold flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">+</span> Add Sport Avatar
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black mb-6">Leaderboard</h2>
                        {/* Mock Leaderboard */}
                        {[
                            { rank: 1, name: "Alex F.", xp: 12500, emoji: "🥇" },
                            { rank: 2, name: "Sarah M.", xp: 11200, emoji: "🥈" },
                            { rank: 3, name: "You", xp: totalXp, emoji: "🥉", isMe: true },
                            { rank: 4, name: "John D.", xp: 8400, emoji: "💪" },
                        ].sort((a, b) => b.xp - a.xp).map((user, idx) => (
                            <div key={user.name} className={`flex items-center justify-between p-4 rounded-2xl border ${user.isMe ? 'bg-[--color-optiz-card] border-[--color-optiz-red]/50' : 'bg-black border-white/5'}`}>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl w-6 text-center">{user.emoji}</span>
                                    <div>
                                        <p className={`font-bold ${user.isMe ? 'text-[--color-optiz-red]' : 'text-white'}`}>{user.name}</p>
                                        <p className="text-xs text-[--color-optiz-muted]">Rank {idx + 1}</p>
                                    </div>
                                </div>
                                <span className="font-bold font-mono text-sm">{user.xp.toLocaleString()} XP</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Global Modals & Animations */}
            <AddAvatarModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveAvatar}
                isPro={isPro}
                currentCount={avatars.length}
            />

            <UpsellModal
                isOpen={isUpsellModalOpen}
                onClose={() => setIsUpsellModalOpen(false)}
                onUpgrade={handleUpgrade}
            />

            <SuccessAnimation
                isVisible={successAnim.isVisible}
                onComplete={() => setSuccessAnim({ ...successAnim, isVisible: false })}
                xpEarned={successAnim.xpEarned}
            />
        </div>
    );
}
