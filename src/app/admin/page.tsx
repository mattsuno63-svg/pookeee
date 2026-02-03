"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

const LIQUID_GLASS = "bg-white/5 backdrop-blur-xl border border-white/10";

interface OwnerWithStores {
  id: string;
  business_name: string;
  vat_number: string | null;
  business_email: string | null;
  business_phone: string | null;
  application_status: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    city: string | null;
    is_active: boolean;
    approval_status: string;
    created_at: string;
  }>;
  profile: {
    nickname: string | null;
    email?: string;
  } | null;
}

interface PendingStore {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  approval_status: string;
  created_at: string;
  owner_id: string;
  owner: {
    business_name: string;
    business_email: string | null;
    business_phone: string | null;
  };
}

export default function AdminPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [revokeStoreId, setRevokeStoreId] = useState<string | null>(null);
  const [revokeOwnerId, setRevokeOwnerId] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithStores | null>(null);

  const { data: owners, isLoading } = useQuery({
    queryKey: ["admin-owners-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select(`
          *,
          stores(id, name, slug, city, is_active, approval_status, created_at),
          profile:profiles!id(nickname)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OwnerWithStores[];
    },
  });

  const { data: pendingStores } = useQuery({
    queryKey: ["admin-pending-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(`
          id,
          name,
          slug,
          city,
          address,
          approval_status,
          created_at,
          owner_id,
          owner:owners(business_name, business_email, business_phone)
        `)
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingStore[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("owners")
        .update({ application_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners-full"] });
    },
  });

  const updateStoreStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("stores")
        .update({ approval_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-stores"] });
    },
  });

  const revokeStore = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from("stores")
        .update({ is_active: false })
        .eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-stores"] });
      setRevokeStoreId(null);
    },
  });

  const revokeOwner = useMutation({
    mutationFn: async (ownerId: string) => {
      // Disattiva tutti i negozi
      const { error: storesError } = await supabase
        .from("stores")
        .update({ is_active: false })
        .eq("owner_id", ownerId);
      if (storesError) throw storesError;
      // Aggiorna subscription_status
      const { error: ownerError } = await supabase
        .from("owners")
        .update({ subscription_status: "cancelled" })
        .eq("id", ownerId);
      if (ownerError) throw ownerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners-full"] });
      setRevokeOwnerId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  const pending = (owners ?? []).filter((o) => o.application_status === "pending");
  const approved = (owners ?? []).filter((o) => o.application_status === "approved");
  const rejected = (owners ?? []).filter((o) => o.application_status === "rejected");

  const getSubscriptionBadge = (owner: OwnerWithStores) => {
    const status = owner.subscription_status;
    const trialEnds = owner.trial_ends_at ? new Date(owner.trial_ends_at) : null;
    const isExpired = trialEnds && trialEnds < new Date() && status === "trial";
    
    if (status === "active") {
      return <Badge variant="success">Attivo</Badge>;
    } else if (status === "expired" || isExpired) {
      return <Badge variant="error">Scaduto</Badge>;
    } else if (status === "trial") {
      return <Badge variant="outline">Trial</Badge>;
    } else if (status === "cancelled") {
      return <Badge variant="error">Revocato</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-accent/10 via-transparent to-transparent">
          <h1 className="font-zentry text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-muted mt-2">Gestione commercianti e negozi</p>
        </section>

        {/* Statistiche rapide */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className={`rounded-2xl ${LIQUID_GLASS} p-4`}>
            <div className="text-2xl font-bold text-accent">{pending.length}</div>
            <div className="text-sm text-muted">Commercianti in attesa</div>
          </div>
          <div className={`rounded-2xl ${LIQUID_GLASS} p-4`}>
            <div className="text-2xl font-bold text-accent">{(pendingStores ?? []).length}</div>
            <div className="text-sm text-muted">Sedi in attesa</div>
          </div>
          <div className={`rounded-2xl ${LIQUID_GLASS} p-4`}>
            <div className="text-2xl font-bold text-foreground">{approved.length}</div>
            <div className="text-sm text-muted">Commercianti approvati</div>
          </div>
          <div className={`rounded-2xl ${LIQUID_GLASS} p-4`}>
            <div className="text-2xl font-bold text-foreground">{(owners ?? []).length}</div>
            <div className="text-sm text-muted">Totale commercianti</div>
          </div>
        </div>

        {/* Commercianti in attesa */}
        {pending.length > 0 && (
          <div className={`rounded-2xl ${LIQUID_GLASS} shadow-xl overflow-hidden`}>
            <div className="p-6 border-b border-white/10">
              <h2 className="font-robert font-bold text-lg">
                Commercianti in attesa di approvazione ({pending.length})
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {pending.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl bg-background/50 border border-white/5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg">{o.business_name}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                        {o.business_email && (
                          <a href={`mailto:${o.business_email}`} className="hover:text-accent transition-colors">
                            📧 {o.business_email}
                          </a>
                        )}
                        {o.business_phone && (
                          <a href={`tel:${o.business_phone}`} className="hover:text-accent transition-colors">
                            📞 {o.business_phone}
                          </a>
                        )}
                        {o.vat_number && <span>P.IVA: {o.vat_number}</span>}
                      </div>
                      <p className="text-xs text-muted mt-2">
                        Iscritto il {formatDate(o.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => updateStatus.mutate({ id: o.id, status: "approved" })}
                      >
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                        onClick={() => updateStatus.mutate({ id: o.id, status: "rejected" })}
                      >
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sedi in attesa */}
        {(pendingStores ?? []).length > 0 && (
          <div className={`rounded-2xl ${LIQUID_GLASS} shadow-xl overflow-hidden`}>
            <div className="p-6 border-b border-white/10">
              <h2 className="font-robert font-bold text-lg">
                Sedi in attesa di approvazione ({(pendingStores ?? []).length})
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {(pendingStores ?? []).map((store) => (
                <div
                  key={store.id}
                  className="p-4 rounded-xl bg-background/50 border border-white/5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg">{store.name}</h3>
                      <div className="text-sm text-muted mt-1">
                        Commerciante: <span className="text-foreground">{store.owner.business_name}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                        {store.city && <span>📍 {store.city}</span>}
                        {store.address && <span>{store.address}</span>}
                        <span>Slug: {store.slug}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                        {store.owner.business_email && (
                          <a href={`mailto:${store.owner.business_email}`} className="hover:text-accent transition-colors">
                            📧 {store.owner.business_email}
                          </a>
                        )}
                        {store.owner.business_phone && (
                          <a href={`tel:${store.owner.business_phone}`} className="hover:text-accent transition-colors">
                            📞 {store.owner.business_phone}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-2">
                        Creata il {formatDate(store.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => updateStoreStatus.mutate({ id: store.id, status: "approved" })}
                      >
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                        onClick={() => updateStoreStatus.mutate({ id: store.id, status: "rejected" })}
                      >
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commercianti approvati */}
        <div className={`rounded-2xl ${LIQUID_GLASS} shadow-xl overflow-hidden`}>
          <div className="p-6 border-b border-white/10">
            <h2 className="font-robert font-bold text-lg">
              Commercianti approvati ({approved.length})
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {approved.length === 0 ? (
              <p className="text-muted text-center py-8">Nessun commerciante approvato.</p>
            ) : (
              approved.map((o) => {
                const trialEnds = o.trial_ends_at ? new Date(o.trial_ends_at) : null;
                const isExpired = trialEnds && trialEnds < new Date() && o.subscription_status === "trial";
                return (
                  <div
                    key={o.id}
                    className="p-5 rounded-xl bg-background/50 border border-white/5 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-medium text-lg">{o.business_name}</h3>
                          {getSubscriptionBadge(o)}
                          {o.application_status === "approved" && (
                            <Badge variant="success">Approvato</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                          {o.business_email && (
                            <a href={`mailto:${o.business_email}`} className="hover:text-accent transition-colors">
                              📧 {o.business_email}
                            </a>
                          )}
                          {o.business_phone && (
                            <a href={`tel:${o.business_phone}`} className="hover:text-accent transition-colors">
                              📞 {o.business_phone}
                            </a>
                          )}
                          {o.vat_number && <span>P.IVA: {o.vat_number}</span>}
                        </div>
                        <div className="mt-2 text-xs text-muted space-y-1">
                          <p>Iscritto il {formatDate(o.created_at)}</p>
                          {o.trial_ends_at && (
                            <p>
                              Trial fino al {formatDate(o.trial_ends_at)}
                              {isExpired && <span className="text-red-400 ml-2">(scaduto)</span>}
                            </p>
                          )}
                          {o.subscription_ends_at && o.subscription_status === "active" && (
                            <p>Abbonamento fino al {formatDate(o.subscription_ends_at)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOwner(o);
                          }}
                        >
                          Dettagli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                          onClick={() => setRevokeOwnerId(o.id)}
                        >
                          Revoca
                        </Button>
                      </div>
                    </div>
                    {/* Negozi */}
                    {o.stores && o.stores.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-muted mb-2">Negozi ({o.stores.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {o.stores.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-white/5 text-sm"
                            >
                              <span>{s.name}</span>
                              {s.city && <span className="text-muted">• {s.city}</span>}
                              {s.approval_status === "pending" && (
                                <Badge variant="outline" className="text-xs">In attesa</Badge>
                              )}
                              {s.approval_status === "rejected" && (
                                <Badge variant="error" className="text-xs">Rifiutato</Badge>
                              )}
                              {!s.is_active && (
                                <Badge variant="error" className="text-xs">Disattivato</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 text-xs p-1 h-auto"
                                onClick={() => setRevokeStoreId(s.id)}
                              >
                                Revoca
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rifiutati */}
        {rejected.length > 0 && (
          <div className={`rounded-2xl ${LIQUID_GLASS} shadow-xl overflow-hidden`}>
            <div className="p-6 border-b border-white/10">
              <h2 className="font-robert font-bold text-lg">Rifiutati ({rejected.length})</h2>
            </div>
            <div className="p-6 space-y-2">
              {rejected.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5"
                >
                  <div>
                    <span className="font-medium">{o.business_name}</span>
                    <span className="text-sm text-muted ml-3">
                      {formatDate(o.created_at)}
                    </span>
                  </div>
                  <Badge variant="error">Rifiutato</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal revoca negozio */}
      <Modal
        isOpen={!!revokeStoreId}
        onClose={() => setRevokeStoreId(null)}
        title="Revoca negozio"
        size="md"
      >
        <p className="text-foreground mb-4">
          Sei sicuro di voler disattivare questo negozio? Il commerciante non potrà più gestirlo.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setRevokeStoreId(null)}>
            Annulla
          </Button>
          <Button
            variant="accent"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => revokeStoreId && revokeStore.mutate(revokeStoreId)}
            isLoading={revokeStore.isPending}
          >
            Conferma revoca
          </Button>
        </div>
      </Modal>

      {/* Modal revoca commerciante */}
      <Modal
        isOpen={!!revokeOwnerId}
        onClose={() => setRevokeOwnerId(null)}
        title="Revoca commerciante"
        size="md"
      >
        <p className="text-foreground mb-4">
          Sei sicuro di voler revocare l&apos;accesso a questo commerciante? Tutti i suoi negozi verranno disattivati e l&apos;abbonamento sarà annullato.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setRevokeOwnerId(null)}>
            Annulla
          </Button>
          <Button
            variant="accent"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => revokeOwnerId && revokeOwner.mutate(revokeOwnerId)}
            isLoading={revokeOwner.isPending}
          >
            Conferma revoca
          </Button>
        </div>
      </Modal>

      {/* Modal dettagli commerciante */}
      <Modal
        isOpen={!!selectedOwner}
        onClose={() => setSelectedOwner(null)}
        title={selectedOwner?.business_name ?? "Dettagli"}
        size="lg"
      >
        {selectedOwner && (
          <div className="space-y-4">
            <div>
              <h4 className="font-robert font-bold text-sm uppercase tracking-wider text-muted mb-2">
                Informazioni contatto
              </h4>
              <div className="space-y-2 text-sm">
                {selectedOwner.business_email && (
                  <p>
                    <span className="text-muted">Email:</span>{" "}
                    <a href={`mailto:${selectedOwner.business_email}`} className="text-accent hover:underline">
                      {selectedOwner.business_email}
                    </a>
                  </p>
                )}
                {selectedOwner.business_phone && (
                  <p>
                    <span className="text-muted">Telefono:</span>{" "}
                    <a href={`tel:${selectedOwner.business_phone}`} className="text-accent hover:underline">
                      {selectedOwner.business_phone}
                    </a>
                  </p>
                )}
                {selectedOwner.vat_number && (
                  <p>
                    <span className="text-muted">P.IVA:</span> {selectedOwner.vat_number}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-robert font-bold text-sm uppercase tracking-wider text-muted mb-2">
                Stato abbonamento
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted">Status:</span> {getSubscriptionBadge(selectedOwner)}
                </p>
                {selectedOwner.trial_ends_at && (
                  <p>
                    <span className="text-muted">Trial fino al:</span> {formatDate(selectedOwner.trial_ends_at)}
                  </p>
                )}
                {selectedOwner.subscription_ends_at && (
                  <p>
                    <span className="text-muted">Abbonamento fino al:</span> {formatDate(selectedOwner.subscription_ends_at)}
                  </p>
                )}
                <p>
                  <span className="text-muted">Iscritto il:</span> {formatDate(selectedOwner.created_at)}
                </p>
              </div>
            </div>
            {selectedOwner.stores && selectedOwner.stores.length > 0 && (
              <div>
                <h4 className="font-robert font-bold text-sm uppercase tracking-wider text-muted mb-2">
                  Negozi ({selectedOwner.stores.length})
                </h4>
                <div className="space-y-2">
                  {selectedOwner.stores.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-foreground/5 border border-white/5">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted">
                        {s.city && `${s.city} • `}
                        Slug: {s.slug} • {s.is_active ? "Attivo" : "Disattivato"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
