"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ImpostazioniPage() {
  const { profile, owner } = useUser();

  return (
    <div className="space-y-8">
      <h1 className="font-zentry text-3xl font-bold uppercase">Impostazioni</h1>

      <Card>
        <CardHeader>
          <h3 className="font-robert font-bold">Account</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted">Nickname:</span> {profile?.nickname ?? "-"}</p>
          {owner && (
            <>
              <p><span className="text-muted">Attività:</span> {owner.business_name}</p>
              {owner.business_email && (
                <p><span className="text-muted">Email aziendale:</span> {owner.business_email}</p>
              )}
            </>
          )}
          <Button variant="outline" size="sm" disabled>
            Modifica account (presto)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
