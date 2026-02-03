"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useCreateStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PROVINCES } from "@/lib/constants";

export default function NuovaSedePage() {
  const router = useRouter();
  const { owner, isLoading: userLoading } = useUser();
  const createStore = useCreateStore(owner?.id);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    discord: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!owner?.id) {
      setErrors({ form: "Dati account non caricati. Ricarica la pagina o effettua nuovamente il login." });
      return;
    }
    if (!formData.name.trim()) {
      setErrors({ name: "Il nome è obbligatorio" });
      return;
    }
    try {
      const social_links: Record<string, string> = {};
      if (formData.instagram?.trim()) social_links.instagram = formData.instagram.trim();
      if (formData.facebook?.trim()) social_links.facebook = formData.facebook.trim();
      if (formData.discord?.trim()) social_links.discord = formData.discord.trim();
      const store = await createStore.mutateAsync({ ...formData, social_links });
      router.push(`/dashboard/sedi/${store.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante la creazione";
      setErrors({ form: msg });
      console.error("Errore creazione sede:", err);
    }
  };

  if (userLoading) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }
  if (!owner?.id) {
    return (
      <div className="max-w-xl space-y-6">
        <Link href="/dashboard/sedi" className="text-muted hover:text-foreground text-sm inline-block">
          ← Torna alle sedi
        </Link>
        <div className="p-6 border border-amber-500/50 bg-amber-500/10 rounded-lg">
          <p className="text-amber-200 font-medium">Impossibile creare la sede</p>
          <p className="text-muted text-sm mt-2">
            I dati del tuo account non sono stati caricati correttamente. Prova a fare logout e login di nuovo,
            oppure contatta l&apos;assistenza se il problema persiste.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/sedi")}>
            Torna alle sedi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link href="/dashboard/sedi" className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna alle sedi
        </Link>
        <h1 className="font-zentry text-3xl font-bold uppercase">Nuova sede</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome negozio *"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="es. Dragon Cards Roma"
          error={errors.name}
          required
        />
        <Input
          label="Descrizione"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Breve descrizione del negozio"
        />
        <Input
          label="Indirizzo"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Via, civico"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Città"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Roma"
          />
          <Input
            label="CAP"
            value={formData.postal_code}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            placeholder="00100"
          />
        </div>
        <Select
          label="Provincia"
          value={formData.province}
          onChange={(e) => handleChange("province", e.target.value)}
          options={[{ value: "", label: "Seleziona provincia" }, ...PROVINCES.filter((p) => p.value).map((p) => ({ value: p.value, label: p.label }))]}
        />
        <Input
          label="Telefono"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="+39 06 1234567"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="negozio@email.com"
        />
        <div className="border-t border-border pt-4">
          <h3 className="font-robert font-medium mb-2">Social (link ai profili)</h3>
          <Input
            label="Instagram"
            value={formData.instagram}
            onChange={(e) => handleChange("instagram", e.target.value)}
            placeholder="https://instagram.com/..."
          />
          <Input
            label="Facebook"
            value={formData.facebook}
            onChange={(e) => handleChange("facebook", e.target.value)}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Discord"
            value={formData.discord}
            onChange={(e) => handleChange("discord", e.target.value)}
            placeholder="https://discord.gg/..."
          />
        </div>

        {errors.form && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errors.form}</p>
        )}

        <div className="flex gap-4">
          <Button type="submit" variant="accent" isLoading={createStore.isPending}>
            Crea sede
          </Button>
          <Link href="/dashboard/sedi">
            <Button type="button" variant="outline">
              Annulla
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
