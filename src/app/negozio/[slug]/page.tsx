"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useStore } from "@/hooks/useStores";
import { useTournamentsForStore } from "@/hooks/useTournaments";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatDate, formatTime, formatCurrency, getGoogleMapsUrl, getWhatsAppUrl } from "@/lib/utils";

const socialIcons: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: "Instagram", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z", color: "hover:text-pink-400" },
  facebook: { label: "Facebook", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", color: "hover:text-blue-500" },
  discord: { label: "Discord", icon: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z", color: "hover:text-indigo-400" },
  whatsapp: { label: "WhatsApp", icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z", color: "hover:text-green-500" },
};

export default function NegozioPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: store, isLoading, error } = useStore(slug, { publicOnly: true });
  const { data: tournaments } = useTournamentsForStore(store?.id);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted">Caricamento...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !store) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center gap-4">
          <p className="text-muted">Negozio non trovato</p>
          <Link href="/tornei">
            <span className="text-accent hover:underline">Cerca tornei</span>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const openTornei = (tournaments ?? []).filter((t) => t.status === "published" || t.status === "closed" || t.status === "in_progress");
  const social = (store.social_links ?? {}) as Record<string, string>;
  const gallery = (store.gallery_images ?? []) as string[];
  const hours = (store.opening_hours ?? {}) as Record<string, string>;
  const hasHours = typeof hours === "object" && Object.keys(hours).length > 0;
  const mapUrl = getGoogleMapsUrl(store.address, store.city, store.postal_code);
  const whatsappUrl = getWhatsAppUrl(social.whatsapp || store.phone, `Ciao! Vorrei informazioni su ${store.name}`);
  const dayLabels: Record<string, string> = { lun: "Lun", mar: "Mar", mer: "Mer", gio: "Gio", ven: "Ven", sab: "Sab", dom: "Dom" };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero con cover */}
        <section className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          {store.banner_url ? (
            <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end gap-4 md:gap-6">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-20 h-20 md:w-28 md:h-28 rounded-xl object-cover border-4 border-background shadow-xl shrink-0" />
            ) : (
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl bg-primary/50 flex items-center justify-center font-zentry font-bold text-2xl md:text-3xl shrink-0 border-4 border-background">
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-zentry text-2xl md:text-4xl font-bold uppercase">{store.name}</h1>
              {store.city && <p className="text-muted mt-1">{store.city}</p>}
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-10 pb-16">
          {/* CTA contatti */}
          <div className="flex flex-wrap gap-3 mb-8">
            {store.phone && (
              <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-foreground/10 border border-border hover:bg-foreground/20 transition-colors">
                <span>📞</span> Chiama
              </a>
            )}
            {(social.whatsapp || store.phone) && (
              <a href={whatsappUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d={socialIcons.whatsapp.icon} /></svg>
                WhatsApp
              </a>
            )}
            {store.email && (
              <a href={`mailto:${store.email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-foreground/10 border border-border hover:bg-foreground/20 transition-colors">
                <span>✉</span> Email
              </a>
            )}
            {(store.address || store.city) && (
              <a href={mapUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-foreground/10 border border-border hover:bg-foreground/20 transition-colors">
                <span>📍</span> Mappa
              </a>
            )}
          </div>

          {/* Social */}
          <div className="flex flex-wrap gap-4 mb-8">
            {(["instagram", "facebook", "discord", "whatsapp"] as const).map((key) => {
              const url = social[key] || (key === "whatsapp" && store.phone ? whatsappUrl : null);
              if (!url) return null;
              const cfg = socialIcons[key];
              return (
                <a key={key} href={url} target="_blank" rel="noopener" className={`flex items-center gap-2 text-muted ${cfg.color} transition-colors`} aria-label={cfg.label}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d={cfg.icon} /></svg>
                  <span>{cfg.label}</span>
                </a>
              );
            })}
          </div>

          {store.description && (
            <section className="mb-10">
              <h2 className="font-zentry text-xl font-bold uppercase mb-3">Chi siamo</h2>
              <p className="text-muted whitespace-pre-wrap leading-relaxed">{store.description}</p>
            </section>
          )}

          {/* Galleria */}
          {gallery.length > 0 && (
            <section className="mb-10">
              <h2 className="font-zentry text-xl font-bold uppercase mb-4">Il nostro negozio</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener" className="aspect-square rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-colors">
                    <img src={url} alt={`${store.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Contatti e indirizzo */}
            <Card>
              <CardContent className="py-6">
                <h2 className="font-zentry text-lg font-bold uppercase mb-4">Contatti</h2>
                {store.address && <p className="text-foreground mb-2">📍 {store.address}</p>}
                {(store.city || store.postal_code) && (
                  <p className="text-muted mb-4">{[store.postal_code, store.city].filter(Boolean).join(" ")}</p>
                )}
                {store.phone && (
                  <p className="mb-2">
                    <a href={`tel:${store.phone}`} className="text-accent hover:underline">{store.phone}</a>
                  </p>
                )}
                {store.email && (
                  <p>
                    <a href={`mailto:${store.email}`} className="text-accent hover:underline">{store.email}</a>
                  </p>
                )}
                {(store.address || store.city) && (
                  <a href={mapUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-4 text-accent hover:underline">
                    <span>Vedi su Google Maps →</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Orari */}
            {hasHours && (
              <Card>
                <CardContent className="py-6">
                  <h2 className="font-zentry text-lg font-bold uppercase mb-4">Orari</h2>
                  <div className="space-y-2 text-sm">
                    {Object.entries(hours).map(([day, h]) => (
                      <div key={day} className="flex justify-between gap-4">
                        <span className="text-muted">{dayLabels[day] ?? day}</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tornei */}
          <section>
            <h2 className="font-zentry text-2xl font-bold uppercase mb-4">Tornei in programma</h2>
            {openTornei.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted">
                  Nessun torneo al momento. Torna a controllare!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {openTornei.map((t) => {
                  const g = GAMES.find((x) => x.value === t.game);
                  const tImg = (t as { image_url?: string }).image_url;
                  return (
                    <Link key={t.id} href={`/tornei/${t.id}`}>
                      <Card variant="interactive">
                        <CardContent className="p-0 overflow-hidden flex flex-row">
                          {tImg && (
                            <div className="w-24 h-20 shrink-0 bg-foreground/5">
                              <img src={tImg} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className={cn("py-4 flex flex-row items-center justify-between gap-4 flex-1", tImg ? "px-4" : "px-6")}>
                          <div>
                            <h3 className="font-robert font-bold">{t.name}</h3>
                            <p className="text-sm text-muted">
                              {g?.label} • {formatDate(t.start_date)} ore {formatTime(t.start_time)}
                              {t.entry_fee > 0 && ` • ${formatCurrency(Number(t.entry_fee))}`}
                            </p>
                          </div>
                          <Badge variant={t.status === "published" ? "accent" : "outline"}>
                            {t.status === "published" ? "Iscrizioni aperte" : t.status}
                          </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
