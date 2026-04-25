"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function R2VideoPlayer({
  src,
  porcentajeInicial = 0,
  onProgreso,
  onCompletar,
}: {
  src: string;
  porcentajeInicial?: number;
  onProgreso: (porcentaje: number) => void;
  onCompletar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [completadoLocal, setCompletadoLocal] = useState(porcentajeInicial >= 95);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportedRef = useRef(0);

  const resetHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    if (porcentajeInicial > 0 && porcentajeInicial < 95) {
      v.currentTime = (porcentajeInicial / 100) * v.duration;
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrentTime(v.currentTime);
    const pct = Math.round((v.currentTime / v.duration) * 100);
    if (pct - reportedRef.current >= 5) {
      reportedRef.current = pct;
      onProgreso(pct);
    }
    if (pct >= 95 && !completadoLocal) {
      setCompletadoLocal(true);
      onCompletar();
    }
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {}); // ignora AbortError si pause() interrumpe
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    resetHideTimer();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrentTime(v.currentTime);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const reiniciar = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
    setPlaying(true);
    resetHideTimer();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video overflow-hidden rounded-xl bg-black"
      onMouseMove={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
        playsInline
      />

      {/* Overlay — click en el área del video pausa/reanuda */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={toggle}
      >
        {/* Barra de progreso y controles — frenan propagación para no disparar toggle */}
        <div onClick={(e) => e.stopPropagation()}>
          <div className="px-4 pb-1">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.5}
              value={currentTime}
              onChange={seek}
              className="w-full cursor-pointer accent-primary h-1 rounded-full"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
            <div className="flex items-center gap-2">
              {completadoLocal ? (
                <button
                  type="button"
                  onClick={reiniciar}
                  className="rounded-full p-1.5 text-white/80 hover:text-white transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggle}
                  className="rounded-full p-1.5 text-white hover:text-primary transition-colors"
                  title={playing ? "Pausar" : "Reproducir"}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full p-1.5 text-white/80 hover:text-white transition-colors"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="text-xs tabular-nums text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button
              type="button"
              onClick={fullscreen}
              className="rounded-full p-1.5 text-white/80 hover:text-white transition-colors"
              title="Pantalla completa"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Botón play central cuando pausado */}
      {!playing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-lg transition-transform hover:scale-105">
            <Play className="h-7 w-7 text-primary-foreground translate-x-0.5" />
          </div>
        </button>
      )}
    </div>
  );
}
