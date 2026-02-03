"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useTemplates, useCreateTemplate, useDeleteTemplate } from "@/hooks/useTemplates";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export default function TemplatePage() {
  const { owner } = useUser();
  const { data: templates, isLoading } = useTemplates(owner?.id);
  const createTemplate = useCreateTemplate(owner?.id);
  const deleteTemplate = useDeleteTemplate(owner?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [templateJson, setTemplateJson] = useState("{}");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const t = JSON.parse(templateJson);
      await createTemplate.mutateAsync({ name: newName, template: t });
      setShowCreate(false);
      setNewName("");
      setTemplateJson("{}");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-zentry text-3xl font-bold uppercase">Template tornei</h1>
        <Button variant="accent" onClick={() => setShowCreate(true)}>
          + Nuovo template
        </Button>
      </div>

      <p className="text-muted">
        Salva le impostazioni di un torneo come template per riutilizzarle velocemente.
      </p>

      {isLoading ? (
        <div className="animate-pulse text-muted">Caricamento...</div>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted mb-6">Nessun template salvato.</p>
            <p className="text-sm text-muted mb-4">
              Crea un torneo, poi dalla pagina di modifica potrai salvarlo come template.
            </p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              Crea template manuale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row justify-between">
                <h3 className="font-robert font-bold">{t.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400"
                  onClick={() => setDeleteId(t.id)}
                >
                  Elimina
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">
                  Usa questo template quando crei un nuovo torneo (funzione in arrivo).
                </p>
                <Link href={`/dashboard/tornei/nuovo?template=${t.id}`}>
                  <Button variant="outline" size="sm">
                    Usa template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuovo template">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome template"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="es. Standard Friday"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Configurazione (JSON)</label>
            <textarea
              value={templateJson}
              onChange={(e) => setTemplateJson(e.target.value)}
              className="w-full h-40 px-4 py-3 bg-foreground/5 border border-border rounded-lg font-mono text-sm"
              placeholder='{"game":"magic","format":"swiss",...}'
            />
          </div>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Annulla
            </Button>
            <Button type="submit" variant="accent" isLoading={createTemplate.isPending}>
              Salva
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Elimina template">
        <p className="text-muted mb-6">Sei sicuro di voler eliminare questo template?</p>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Annulla
          </Button>
          <Button
            variant="default"
            className="bg-red-600"
            onClick={async () => {
              if (deleteId) {
                await deleteTemplate.mutateAsync(deleteId);
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
