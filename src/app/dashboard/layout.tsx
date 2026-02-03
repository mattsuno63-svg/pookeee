"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, owner, isLoading, isOwner, isAdmin, refresh } = useUser();
  const supabase = createClient();

  // Aggiorna subscription_status se trial scaduto
  useEffect(() => {
    if (owner && owner.subscription_status === "trial" && owner.trial_ends_at) {
      const trialEnds = new Date(owner.trial_ends_at);
      if (trialEnds < new Date()) {
        // Chiama la funzione per aggiornare lo status
        supabase.rpc("expire_expired_trials").then(() => {
          refresh();
        });
      }
    }
  }, [owner, refresh, supabase]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      router.replace("/admin");
      return;
    }
    if (!isLoading && user && !isOwner && !isAdmin) {
      router.replace("/profilo");
    }
  }, [user, isOwner, isAdmin, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  if (owner?.application_status === "pending" || owner?.application_status === "rejected") {
    const isRejected = owner?.application_status === "rejected";
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="font-zentry text-2xl font-bold uppercase mb-4">
              {isRejected ? "Richiesta non approvata" : "In attesa di approvazione"}
            </h1>
            <p className="text-muted mb-6">
              {isRejected
                ? "La tua richiesta non è stata approvata. Per maggiori informazioni contatta l'assistenza."
                : "La tua richiesta è stata ricevuta. L'admin verificherà i dati e ti abiliterà l'accesso alla dashboard."}
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>Torna alla home</Button>
          </div>
        </main>
      </>
    );
  }

  // Controllo scadenza trial: blocca accesso se trial scaduto e subscription non attiva
  const subscriptionStatus = owner?.subscription_status ?? "trial";
  const trialEndsAt = owner?.trial_ends_at ? new Date(owner.trial_ends_at) : null;
  const isTrialExpired = trialEndsAt && trialEndsAt < new Date();
  const isSubscriptionActive = subscriptionStatus === "active";
  const isTrialExpiredAndNotActive = isTrialExpired && !isSubscriptionActive;

  if (isTrialExpiredAndNotActive) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-6">
            <div className="space-y-2">
              <h1 className="font-zentry text-3xl font-bold uppercase text-accent">
                Trial scaduto
              </h1>
              <p className="text-muted">
                Il tuo periodo di prova gratuito di 4 giorni è terminato il{" "}
                {trialEndsAt?.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/10 border border-accent/30 space-y-4">
              <p className="font-medium">
                Per continuare a utilizzare TourneyHub devi attivare un abbonamento.
              </p>
              <p className="text-sm text-muted">
                Piano: <span className="font-bold text-foreground">€29/mese</span>
                <br />
                Per la prima sede. Sedi aggiuntive +50%.
              </p>
              <Button
                variant="accent"
                onClick={() => router.push("/dashboard/abbonamento")}
                className="w-full"
              >
                Attiva abbonamento
              </Button>
            </div>
            <p className="text-xs text-muted">
              Hai bisogno di aiuto? Contatta{" "}
              <a href="mailto:baroccodigitale@gmail.com" className="text-accent hover:underline">
                baroccodigitale@gmail.com
              </a>
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex pt-20 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </>
  );
}
