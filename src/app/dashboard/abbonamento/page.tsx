"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default function AbbonamentoPage() {
  const { owner } = useUser();

  const status = owner?.subscription_status ?? "trial";
  const trialEnds = owner?.trial_ends_at;
  const subEnds = owner?.subscription_ends_at;

  return (
    <div className="space-y-8">
      <h1 className="font-zentry text-3xl font-bold uppercase">Abbonamento</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="font-robert font-bold">Stato attuale</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === "trial" ? "bg-accent/20 text-accent" :
              status === "active" ? "bg-green-500/20 text-green-400" :
              "bg-foreground/10 text-muted"
            }`}>
              {status === "trial" ? "Trial" : status === "active" ? "Attivo" : status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "trial" && trialEnds && (
            <p className="text-muted">
              Trial fino al {formatDate(trialEnds)}. Dopo dovrai attivare l&apos;abbonamento.
            </p>
          )}
          {status === "active" && subEnds && (
            <p className="text-muted">
              Abbonamento attivo fino al {formatDate(subEnds)}.
            </p>
          )}
          <div className="pt-4 border-t border-border">
            <h4 className="font-robert font-bold mb-2">Piano</h4>
            <p className="text-2xl font-bold text-accent">€29<span className="text-base font-normal text-muted">/mese</span></p>
            <p className="text-sm text-muted mt-1">Per la prima sede. Sedi aggiuntive +50%.</p>
          </div>
          <p className="text-sm text-muted">
            Fase 1: gestione abbonamento e pagamenti Stripe in arrivo. Per ora hai accesso completo in trial.
          </p>
          <Button variant="outline" disabled>
            Attiva abbonamento (presto)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
