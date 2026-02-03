"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useStores, useDeleteStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export default function SediPage() {
  const { owner } = useUser();
  const { data: stores, isLoading, error } = useStores(owner?.id);
  const deleteStore = useDeleteStore(owner?.id);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  if (!owner?.id) {
    return (
      <div className="p-6 border border-amber-500/50 bg-amber-500/10 rounded-lg max-w-xl">
        <p className="text-amber-200 font-medium">Dati account non disponibili</p>
        <p className="text-muted text-sm mt-2">
          I dati del tuo account non sono stati caricati. Prova a fare logout e login, oppure ricarica la pagina.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Errore nel caricamento: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-zentry text-3xl font-bold uppercase">Le tue sedi</h1>
        <Link href="/dashboard/sedi/nuova">
          <Button variant="accent">+ Nuova sede</Button>
        </Link>
      </div>

      {!stores || stores.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted mb-6">Non hai ancora creato nessuna sede.</p>
            <Link href="/dashboard/sedi/nuova">
              <Button variant="accent">Crea la tua prima sede</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((store) => (
            <Card key={store.id} variant="interactive">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <h3 className="font-robert font-bold text-lg">{store.name}</h3>
                  <p className="text-sm text-muted">/{store.slug}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {store.approval_status === "pending" && (
                    <Badge variant="outline">In attesa approvazione</Badge>
                  )}
                  {store.approval_status === "approved" && store.is_active && (
                    <Badge variant="success">Approvata e attiva</Badge>
                  )}
                  {store.approval_status === "approved" && !store.is_active && (
                    <Badge variant="outline">Approvata (inattiva)</Badge>
                  )}
                  {store.approval_status === "rejected" && (
                    <Badge variant="error">Rifiutata</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {store.approval_status === "pending" && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-200">
                      ⏳ Questa sede è in attesa di approvazione da parte dell&apos;admin. Riceverai una notifica quando sarà approvata.
                    </p>
                  </div>
                )}
                {store.approval_status === "rejected" && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-200">
                      ❌ Questa sede è stata rifiutata dall&apos;admin. Contatta l&apos;assistenza per maggiori informazioni.
                    </p>
                  </div>
                )}
                {store.city && (
                  <p className="text-sm text-foreground/80 mb-4">📍 {store.city}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {store.approval_status === "approved" && (
                    <Link href={`/negozio/${store.slug}`} target="_blank" rel="noopener">
                      <Button variant="outline" size="sm">
                        Vedi landing
                      </Button>
                    </Link>
                  )}
                  <Link href={`/dashboard/sedi/${store.id}`}>
                    <Button variant="outline" size="sm">
                      Modifica
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => setDeleteId(store.id)}
                  >
                    Elimina
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Elimina sede"
      >
        <p className="text-muted mb-6">
          Sei sicuro? Tornei e iscrizioni associati a questa sede saranno eliminati.
        </p>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Annulla
          </Button>
          <Button
            variant="default"
            className="bg-red-600 hover:bg-red-700"
            isLoading={deleteStore.isPending}
            onClick={async () => {
              if (deleteId) {
                await deleteStore.mutateAsync(deleteId);
                setDeleteId(null);
              }
            }}
          >
            Elimina
          </Button>
        </div>
      </Modal>
    </div>
  );
}
