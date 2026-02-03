"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PreloaderProps {
  onComplete?: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Inizializzazione...");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const statuses = [
      "Inizializzazione...",
      "Caricamento risorse...",
      "Preparazione interfaccia...",
      "Quasi pronto...",
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setStatus("Pronto!");
        clearInterval(interval);
        
        setTimeout(() => {
          setIsDone(true);
          onComplete?.();
        }, 500);
      } else {
        setProgress(current);
        const statusIndex = Math.min(
          Math.floor((current / 100) * statuses.length),
          statuses.length - 1
        );
        setStatus(statuses[statusIndex]);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] grid place-items-center bg-background",
        "transition-opacity duration-350 ease-out",
        isDone && "opacity-0 pointer-events-none"
      )}
      aria-hidden={isDone}
    >
      <div className="w-[min(47.5rem,90vw)] text-left text-foreground">
        {/* Brand */}
        <h3 className="font-zentry text-2xl md:text-[1.75rem] tracking-wider mb-4 opacity-95">
          <span className="text-foreground">TOURNEY</span>
          <span className="text-accent">HUB</span>
        </h3>
        
        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-foreground/15 overflow-hidden">
          <span
            className="block h-full bg-gradient-to-r from-foreground/60 to-foreground/90 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Meta info */}
        <p className="mt-3 font-robert text-sm md:text-lg tracking-wide opacity-90">
          <span>{Math.round(progress)}%</span>
          <span className="opacity-60 mx-2">•</span>
          <span>{status}</span>
        </p>
      </div>
    </div>
  );
}
