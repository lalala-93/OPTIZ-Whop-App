"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, VideoOff } from "lucide-react";
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
  /** `null` = pas de vidéo Hakim disponible → placeholder affiché. */
  src: string | null;
  poster: string | null;
  phase: VideoPhase;
  /** Offset de démarrage (secondes). Le clip rebouclera depuis ce point. */
  start?: number;
  /** Optional badge text (ex: "Démo", "Série 2/4"). Défaut: dérivé de la phase. */
  badge?: string;
  /** Désactiver les overlays (utile pour preview standalone dans library). */
  bare?: boolean;
  className?: string;
}

export const SyncedExerciseVideo = forwardRef<SyncedExerciseVideoHandle, Props>(
  function SyncedExerciseVideo(
    { src, poster, phase, start = 0, badge, bare = false, className },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        restart: () => {
          const v = videoRef.current;
          if (!v) return;
          v.currentTime = start;
          v.play().catch(() => {});
        },
        get el() {
          return videoRef.current;
        },
      }),
      [start],
    );

    // Seek au point de départ dès que les métadonnées sont prêtes.
    // Et boucle manuelle (`onEnded`) pour reboucler depuis `start` plutôt
    // que depuis 0 — évite l'intro/setup qu'on veut sauter.
    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      const seekStart = () => {
        if (start > 0 && v.currentTime < start) v.currentTime = start;
      };
      if (v.readyState >= 1) seekStart();
      else v.addEventListener("loadedmetadata", seekStart, { once: true });
      return () => v.removeEventListener("loadedmetadata", seekStart);
    }, [src, start]);

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

    const overlayCfg = computeOverlay(phase, badge);

    // Pas de vidéo native fidèle pour cet exercice → placeholder explicite
    // plutôt qu'une démo trompeuse (ex. cardio vélo qui jouait corde à sauter).
    if (!src) {
      return (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl",
            "aspect-video select-none",
            "bg-gradient-to-br from-white/[0.03] to-white/[0.01]",
            "border border-white/[0.05]",
            className,
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <VideoOff size={20} className="text-gray-8" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-10 tracking-tight">
                Démonstration actuellement indisponible
              </p>
              <p className="mt-1 text-[11.5px] text-gray-7 leading-relaxed">
                La vidéo Hakim pour cet exercice arrive bientôt.
              </p>
            </div>
          </div>
        </div>
      );
    }

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
          src={start > 0 ? `${src}#t=${start}` : src}
          poster={poster ?? undefined}
          autoPlay={phase !== "idle" && phase !== "rest"}
          muted
          loop={start === 0}
          playsInline
          preload="auto"
          onEnded={() => {
            // Boucle manuelle quand `start > 0` : `loop` natif rejoue depuis 0
            // et zappe l'offset, donc on relance nous-mêmes.
            const v = videoRef.current;
            if (!v) return;
            v.currentTime = start;
            v.play().catch(() => {});
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />

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

            {/* Note : on n'affiche plus de ring rouge ni de badge "EN SÉRIE"
                pendant set_active — l'info était redondante avec le set tracker
                (qui marque déjà la série active en rouge) et le ring rouge sur
                la vidéo surchargeait visuellement la card. Le seul overlay
                conservé est le checkmark "Validée" sur set_done. */}

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
