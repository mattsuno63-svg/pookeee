"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";

export default function DashboardPage() {
  const { profile, owner } = useUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-zentry text-3xl font-bold uppercase mb-1">
          Benvenuto{profile?.nickname ? `, ${profile.nickname}` : ""}
        </h1>
        <p className="text-muted">
          {owner?.business_name && (
            <>Gestisci {owner.business_name} da questa dashboard.</>
          )}
          {!owner?.business_name && <>Configura il tuo account gestore.</>}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="interactive">
          <CardHeader>
            <h3 className="font-robert font-bold">Sedi</h3>
          </CardHeader>
          <CardContent>
            <p className="text-muted text-sm mb-4">
              Gestisci i tuoi negozi e le landing page.
            </p>
            <Link href="/dashboard/sedi">
              <Button variant="outline" size="sm">
                Vai alle sedi
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <h3 className="font-robert font-bold">Tornei</h3>
          </CardHeader>
          <CardContent>
            <p className="text-muted text-sm mb-4">
              Crea e gestisci i tuoi tornei.
            </p>
            <Link href="/dashboard/tornei">
              <Button variant="outline" size="sm">
                Vai ai tornei
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <h3 className="font-robert font-bold">Abbonamento</h3>
          </CardHeader>
          <CardContent>
            <p className="text-muted text-sm mb-4">
              Stato:{" "}
              <span className="text-accent font-medium">
                {owner?.subscription_status ?? "trial"}
              </span>
            </p>
            <Link href="/dashboard/abbonamento">
              <Button variant="outline" size="sm">
                Gestisci abbonamento
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-robert font-bold">Prossimi passi</h3>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted">
            <li>Aggiungi la tua prima sede/negozio</li>
            <li>Crea un torneo o usa i template</li>
            <li>Configura la programmazione settimanale</li>
            <li>Condividi la landing page con i giocatori</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
