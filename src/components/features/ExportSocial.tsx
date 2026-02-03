"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/Button";
import { GAMES } from "@/lib/constants";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import type { TournamentWithStore } from "@/types/database";

const GAME_LABELS: Record<string, string> = Object.fromEntries(GAMES.map((g) => [g.value, g.label]));

export function ExportSocial({
  tournament,
  format,
  compact,
}: {
  tournament: TournamentWithStore;
  format: "story" | "post";
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const store = tournament.store as { name?: string; city?: string; logo_url?: string } | null;
  const w = format === "story" ? 1080 : 1080;
  const h = format === "story" ? 1920 : 1080;
  const scale = compact ? 4 : 2;

  const handleExport = async () => {
    if (!ref.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(ref.current, {
        scale,
        backgroundColor: "#000000",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `torneo-${tournament.name}-${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <div
        ref={ref}
        className="overflow-hidden relative"
        style={{
          width: compact ? w / 4 : w / 2,
          height: compact ? h / 4 : h / 2,
          fontFamily: "var(--font-zentry), system-ui",
        }}
      >
        <div className="w-full h-full relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} 
            />
          </div>
          
          {/* Logo negozio top-left */}
          {store?.logo_url && (
            <img 
              src={store.logo_url} 
              alt="Logo"
              className="absolute top-8 left-8 w-16 h-16 object-contain rounded-lg bg-white/10 p-2"
            />
          )}
          
          {/* Contenuto principale */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center px-12 text-center">
            <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
              {GAME_LABELS[tournament.game] ?? tournament.game}
            </p>
            <h1 className="font-zentry text-5xl font-bold mb-6 text-white leading-tight">
              {tournament.name}
            </h1>
            <div className="text-3xl font-bold mb-3 text-white">
              {formatDate(tournament.start_date)}
            </div>
            <div className="text-2xl mb-8 text-white/90">
              ore {formatTime(tournament.start_time)}
            </div>
            
            {/* CTA */}
            <div className="bg-pink-500 text-white px-8 py-4 rounded-2xl text-xl font-bold mb-8 shadow-2xl">
              Iscriviti su TourneyHub
            </div>
            
            {/* Info sede */}
            <div className="text-lg text-white/80">
              📍 {store?.name}
              {store?.city && <span> - {store.city}</span>}
            </div>
            {tournament.entry_fee > 0 && (
              <div className="text-xl font-bold text-pink-300 mt-2">
                {formatCurrency(Number(tournament.entry_fee))}
              </div>
            )}
          </div>
          
          {/* Watermark bottom-right */}
          <div className="absolute bottom-6 right-6 text-white/30 text-sm font-medium">
            TourneyHub.it
          </div>
        </div>
      </div>
      <Button variant="accent" size={compact ? "sm" : "md"} onClick={handleExport} isLoading={loading}>
        Scarica PNG
      </Button>
    </div>
  );
}
