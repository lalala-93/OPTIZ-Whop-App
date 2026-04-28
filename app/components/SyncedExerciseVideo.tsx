"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SyncedExerciseVideo — primitive vidéo unique, dirigée par les `phase` props.
 *
 * Le composant garde **un seul** <video> monté pendant toute la séance pour éviter
 * tout flash / re-buffer. Les transitions visuelles entre phases sont gérées via
 * overlays animés (Framer Motion) — pas via remount.
 *
 * Phases :
 * - "idle"        : vidéo arrêtée, poster visible (avant démarrage).
 * - "preview"     : boucle x1, légère dim, badge "Démo".
 * - "set_active"  : boucle x1, plein écran, ring rouge subtil.
 * - "set_done"    : video pausée, overlay vert "✓ Set validé".
 * - "rest"        : video continue en boucle dimmed, overlay rest géré au-dessus
 *                   par le parent (countdown + citation Hakim).
 *
 * Le parent peut accéder au <video> via ref pour seek/replay si besoin.
 */

export type VideoPhase = "idle" | "preview" | "set_active" | "set_done" | "rest";

export interface SyncedExerciseVideoHandle {
  /** Force le replay depuis le début (utile en cas de switch d'exercice). */
  restart: () => void;
  /** Accès direct au <video> sous-jacent (pour mesures avancées). */
  el: HTMLVideoElement | null;
}

interface Props {
  src: string;
  poster: string;
  phase: VideoPhase;
  /** Optional badge text (ex: "Démo", "Série 2/4"). Défaut: dérivé de la phase. */
  badge?: string;
  /** Désactiver les overlays (utile pour preview standalone dans library). */
  bare?: boolean;
  className?: string;
}

export const SyncedExerciseVideo = forwardRef<SyncedExerciseVideoHandle, Props>(
  function SyncedExerciseVideo(
    { src, poster, phase, badge, bare = false, className },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [ready, setReady] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        restart: () => {
          const v = videoRef.current;
          if (!v) return;
          v.currentTime = 0;
          v.play().catch(() => {});
        },
        get el() {
          return videoRef.current;
        },
      }),
      [],
    );

    // Reset ready quand src change (changement d'exercice).
    useEffect(() => {
      setReady(false);
    }, [src]);

    // Sync play/pause selon phase. Re-synchronise aussi quand `src` change pour
    // garantir que la nouvelle vidéo démarre bien après le reload natif.
    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;

      switch (phase) {
        case "idle":
        case "rest":
          // Pendant le repos l'utilisateur ne regarde plus la démo — on pause
          // pour économiser la bande passante et réduire le bruit visuel.
          v.pause();
          break;
        case "preview":
        case "set_active":
          v.playbackRate = 1;
          v.play().catch(() => {
            // Autoplay refusé (rare avec muted=true), pas grave.
          });
          break;
        case "set_done":
          // Pause immédiate pour effet net.
          v.pause();
          break;
      }
    }, [phase, src]);

    const onLoadedData = useCallback(() => setReady(true), []);

    const overlayCfg = computeOverlay(phase, badge);

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-black",
          "aspect-video select-none",
          className,
        )}
      >
        {/* key={src} : garantit un <video> tout neuf à chaque changement
            d'exercice. Sans ça, certains navigateurs (Safari iOS notamment)
            gardent le buffer de la vidéo précédente et continuent à la
            lire/boucler malgré la mise à jour de l'attribut `src`. */}
        <video
          key={src}
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={phase !== "idle" && phase !== "rest"}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={onLoadedData}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Skeleton tant que la vidéo n'est pas prête. */}
        {!ready && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] animate-pulse" />
        )}

        {bare ? null : (
          <>
            {/* Dim layer — varie selon phase pour focus. */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={false}
              animate={{
                backgroundColor: overlayCfg.dimColor,
                opacity: overlayCfg.dimOpacity,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Phase ring (set_active only) */}
            <AnimatePresence>
              {phase === "set_active" && (
                <motion.div
                  key="ring"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-inset ring-[#E80000]/40"
                />
              )}
            </AnimatePresence>

            {/* Badge en haut à gauche */}
            <AnimatePresence>
              {overlayCfg.badge && (
                <motion.div
                  key={`badge-${overlayCfg.badge}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-3 left-3 px-2.5 h-7 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90"
                >
                  {overlayCfg.badgeDot && (
                    <span className={cn("w-1.5 h-1.5 rounded-full", overlayCfg.badgeDot)} />
                  )}
                  {overlayCfg.badge}
                </motion.div>
              )}
            </AnimatePresence>

            {/* set_done overlay — checkmark splash */}
            <AnimatePresence>
              {phase === "set_done" && (
                <motion.div
                  key="set-done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-400/40 flex items-center justify-center">
                    <Check size={32} className="text-emerald-300" strokeWidth={2.5} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    );
  },
);

function computeOverlay(phase: VideoPhase, badgeOverride?: string) {
  switch (phase) {
    case "idle":
      return {
        dimColor: "rgba(0,0,0,0.55)",
        dimOpacity: 1,
        badge: badgeOverride ?? null,
        badgeDot: null,
      };
    case "preview":
      return {
        dimColor: "rgba(0,0,0,0.18)",
        dimOpacity: 1,
        badge: badgeOverride ?? null,
        badgeDot: null,
      };
    case "set_active":
      return {
        dimColor: "rgba(0,0,0,0)",
        dimOpacity: 0,
        badge: badgeOverride ?? "En série",
        badgeDot: "bg-[#FF4D4D] animate-pulse",
      };
    case "set_done":
      return {
        dimColor: "rgba(0,0,0,0.35)",
        dimOpacity: 1,
        badge: badgeOverride ?? "Validée",
        badgeDot: "bg-emerald-400",
      };
    case "rest":
      return {
        // Dim plus marquée — l'overlay rest viendra par-dessus.
        dimColor: "rgba(0,0,0,0.5)",
        dimOpacity: 1,
        badge: null,
        badgeDot: null,
      };
  }
}
