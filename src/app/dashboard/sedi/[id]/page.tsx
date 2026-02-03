"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useStoreById, useUpdateStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { OPENING_HOURS_DAYS, PROVINCES } from "@/lib/constants";

export default function ModificaSedePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { owner, isLoading: userLoading } = useUser();
  const { data: store, isLoading } = useStoreById(id);
  const updateStore = useUpdateStore(owner?.id);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    email: "",
    logo_url: "",
    banner_url: "",
    gallery_images: "" as string,
    instagram: "",
    facebook: "",
    discord: "",
    whatsapp: "",
    ...Object.fromEntries(OPENING_HOURS_DAYS.map((d) => [d.key, ""])),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (store) {
      const sl = (store.social_links ?? {}) as Record<string, string>;
      const oh = (store.opening_hours ?? {}) as Record<string, string>;
      const gallery = (store.gallery_images ?? []) as string[];
      setFormData({
        name: store.name ?? "",
        description: store.description ?? "",
        address: store.address ?? "",
        city: store.city ?? "",
        province: store.province ?? "",
        postal_code: store.postal_code ?? "",
        phone: store.phone ?? "",
        email: store.email ?? "",
        logo_url: store.logo_url ?? "",
        banner_url: store.banner_url ?? "",
        gallery_images: gallery.join("\n"),
        instagram: sl.instagram ?? "",
        facebook: sl.facebook ?? "",
        discord: sl.discord ?? "",
        whatsapp: sl.whatsapp ?? "",
        ...Object.fromEntries(OPENING_HOURS_DAYS.map((d) => [d.key, oh[d.key] ?? ""])),
      });
    }
  }, [store]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!formData.name.trim()) {
      setErrors({ name: "Il nome è obbligatorio" });
      return;
    }
    try {
      const social_links: Record<string, string> = {};
      if (formData.instagram?.trim()) social_links.instagram = formData.instagram.trim();
      if (formData.facebook?.trim()) social_links.facebook = formData.facebook.trim();
      if (formData.discord?.trim()) social_links.discord = formData.discord.trim();
      if (formData.whatsapp?.trim()) social_links.whatsapp = formData.whatsapp.trim();
      const opening_hours: Record<string, string> = {};
      OPENING_HOURS_DAYS.forEach((d) => {
        const v = formData[d.key as keyof typeof formData];
        if (typeof v === "string" && v.trim()) opening_hours[d.key] = v.trim();
      });
      const gallery_images = formData.gallery_images
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      await updateStore.mutateAsync({
        id,
        ...formData,
        social_links,
        opening_hours,
        gallery_images,
        logo_url: formData.logo_url.trim() || undefined,
        banner_url: formData.banner_url.trim() || undefined,
      });
      router.push("/dashboard/sedi");
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  };

  if (userLoading || isLoading || !store) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  if (!owner?.id || store.owner_id !== owner.id) {
    return (
      <div className="text-red-500">
        Non hai i permessi per modificare questa sede.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/sedi" className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna alle sedi
        </Link>
        <h1 className="font-zentry text-3xl font-bold uppercase">Modifica {store.name}</h1>
        <p className="text-sm text-muted mt-1">Slug: /negozio/{store.slug}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nome negozio *"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="es. Dragon Cards Roma"
          error={errors.name}
          required
        />

        <div className="border-t border-border pt-6">
          <h3 className="font-robert font-medium mb-3">Immagine di copertina e logo</h3>
          <p className="text-sm text-muted mb-3">URL delle immagini (hosting esterno es. Imgur, Cloudinary)</p>
          <div className="space-y-4">
            <Input
              label="Logo (URL)"
              value={formData.logo_url}
              onChange={(e) => handleChange("logo_url", e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Immagine di copertina / Banner (URL)"
              value={formData.banner_url}
              onChange={(e) => handleChange("banner_url", e.target.value)}
              placeholder="https://..."
            />
            <div>
              <label className="block text-sm font-medium mb-2">Galleria immagini (un URL per riga)</label>
              <textarea
                value={formData.gallery_images}
                onChange={(e) => handleChange("gallery_images", e.target.value)}
                placeholder={"https://img1.jpg\nhttps://img2.jpg"}
                rows={4}
                className="w-full px-4 py-3 rounded-btn bg-foreground/5 border border-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const q = [formData.address, formData.postal_code, formData.city].filter(Boolean).join(", ");
              if (!q.trim()) {
                setErrors((e) => ({ ...e, form: "Inserisci indirizzo e città per geocodificare" }));
                return;
              }
              setGeocoding(true);
              try {
                const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
                const d = await r.json();
                if (d.latitude != null && d.longitude != null) {
                  await updateStore.mutateAsync({ id, latitude: d.latitude, longitude: d.longitude });
                  setErrors((e) => ({ ...e, form: "" }));
                } else {
                  setErrors((e) => ({ ...e, form: "Indirizzo non trovato. Prova con un indirizzo più specifico." }));
                }
              } catch {
                setErrors((e) => ({ ...e, form: "Errore durante la geocodifica" }));
              } finally {
                setGeocoding(false);
              }
            }}
            disabled={geocoding}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            {geocoding ? "Geocodifica in corso..." : "📍 Geocodifica indirizzo (per filtrare i tornei per distanza)"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Città" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Roma" />
          <Input label="CAP" value={formData.postal_code} onChange={(e) => handleChange("postal_code", e.target.value)} placeholder="00100" />
        </div>
        <Select
          label="Provincia"
          value={formData.province}
          onChange={(e) => handleChange("province", e.target.value)}
          options={[{ value: "", label: "Seleziona provincia" }, ...PROVINCES.filter((p) => p.value).map((p) => ({ value: p.value, label: p.label }))]}
        />
        <Input label="Telefono" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+39 06 1234567" />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="negozio@email.com" />

        <div className="border-t border-border pt-6">
          <h3 className="font-robert font-medium mb-3">Social e contatti</h3>
          <p className="text-sm text-muted mb-3">Link completi (es. https://instagram.com/tuoprofilo)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Instagram" value={formData.instagram} onChange={(e) => handleChange("instagram", e.target.value)} placeholder="https://instagram.com/..." />
            <Input label="Facebook" value={formData.facebook} onChange={(e) => handleChange("facebook", e.target.value)} placeholder="https://facebook.com/..." />
            <Input label="Discord" value={formData.discord} onChange={(e) => handleChange("discord", e.target.value)} placeholder="https://discord.gg/..." />
            <Input label="WhatsApp (link o numero con prefisso)" value={formData.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} placeholder="https://wa.me/39..." />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-robert font-medium mb-3">Orari di apertura</h3>
          <p className="text-sm text-muted mb-3">Es. 9:00-13:00, 15:00-19:00 oppure Chiuso</p>
          <div className="space-y-3">
            {OPENING_HOURS_DAYS.map((d) => (
              <div key={d.key} className="flex items-center gap-4">
                <span className="w-24 text-sm text-muted">{d.label}</span>
                <Input
                  value={formData[d.key as keyof typeof formData] as string}
                  onChange={(e) => handleChange(d.key, e.target.value)}
                  placeholder="9:00-13:00, 15:00-19:00"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {errors.form && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errors.form}</p>
        )}

        <div className="flex gap-4">
          <Button type="submit" variant="accent" isLoading={updateStore.isPending}>
            Salva modifiche
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
