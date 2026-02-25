"use client";

import { Info } from "lucide-react";
import { Exercise } from "../lib/workout-data";
import { SetRow } from "./SetRow";

interface SetState {
    kg: string;
    reps: string;
    isCompleted: boolean;
}

interface ExerciseCardProps {
    exercise: Exercise;
    setStates: SetState[];
    onSetChange: (setIndex: number, field: "kg" | "reps", value: string) => void;
    onSetToggle: (setIndex: number) => void;
    onInfoClick: (exercise: Exercise) => void;
}

export function ExerciseCard({
    exercise,
    setStates,
    onSetChange,
    onSetToggle,
    onInfoClick,
}: ExerciseCardProps) {
    return (
        <div className="bg-[--color-optiz-card] rounded-2xl overflow-hidden border border-[--color-optiz-border] mb-4">
            {/* Header */}
            <div className="px-4 py-3 flex items-start justify-between bg-black/40 border-b border-[--color-optiz-border]">
                <div>
                    <h3 className="font-bold text-lg text-[--color-optiz-red] leading-tight flex items-center gap-2">
                        {exercise.name}
                    </h3>
                    <p className="text-xs text-[--color-optiz-muted] mt-1 line-clamp-1">{exercise.notes || exercise.muscleGroups}</p>
                </div>
                <button
                    onClick={() => onInfoClick(exercise)}
                    className="p-2 -mr-2 text-[--color-optiz-muted] hover:text-[--color-optiz-orange] transition-colors"
                >
                    <Info size={20} />
                </button>
            </div>

            {/* Table Header */}
            <div className="px-4 pt-3 pb-2">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_3rem] items-center gap-2 px-2">
                    <span className="text-xs font-bold text-[--color-optiz-muted] text-center">Set</span>
                    <span className="text-xs font-bold text-[--color-optiz-muted] text-center">Previous</span>
                    <span className="text-xs font-bold text-[--color-optiz-muted] text-center">kg</span>
                    <span className="text-xs font-bold text-[--color-optiz-muted] text-center">Reps</span>
                    <span className="text-xs font-bold text-[--color-optiz-muted] text-center">✔</span>
                </div>

                {/* Rows */}
                <div className="mt-1 flex flex-col gap-1 pb-2">
                    {setStates.map((state, index) => (
                        <SetRow
                            key={index}
                            setNumber={index + 1}
                            previousText={`- kg x ${exercise.reps}`}
                            kg={state.kg}
                            reps={state.reps}
                            isCompleted={state.isCompleted}
                            onKgChange={(val) => onSetChange(index, "kg", val)}
                            onRepsChange={(val) => onSetChange(index, "reps", val)}
                            onCompleteToggle={() => onSetToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
