"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { useUser } from "@/hooks/useUser";
import { useNicknameCheck } from "@/hooks/useNicknameCheck";
import { createClient } from "@/lib/supabase/client";
import { validateNickname } from "@/lib/utils";
import { PROVINCES } from "@/lib/constants";

export default function ModificaProfiloPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, isLoading, isOwner, refresh } = useUser();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [province, setProvince] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/profilo/modifica");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isOwner) router.replace("/dashboard");
  }, [isOwner, router]);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname ?? "");
      setBio(profile.bio ?? "");
      setProvince(profile.province ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const nicknameStatus = useNicknameCheck(nickname, user?.id ?? null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const valid = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!valid.includes(file.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WebP o GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Immagine troppo grande (max 2 MB)");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setAvatarUrl(url);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore upload immagine");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nickValidation = validateNickname(nickname);
    if (!nickValidation.valid) {
      setError(nickValidation.error ?? "Nickname non valido");
      return;
    }
    if (nicknameStatus === "taken") {
      setError("Questo nickname è già in uso");
      return;
    }
    if (nicknameStatus === "checking") {
      setError("Attendi la verifica del nickname");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nickname,
          bio: bio || null,
          province: province || null,
        })
        .eq("id", user!.id);

      if (updateError) throw updateError;
      setSaved(true);
      refresh();
      setTimeout(() => router.push("/profilo"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user || isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="font-zentry text-3xl font-bold uppercase mb-8">
            Modifica profilo
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Avatar
                src={avatarUrl ?? undefined}
                fallback={(nickname || user.email?.slice(0, 2).toUpperCase()) ?? "?"}
                size="xl"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                isLoading={uploading}
              >
                {uploading ? "Caricamento..." : "Cambia immagine"}
              </Button>
            </div>

            <div>
              <Input
                label="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Il tuo nickname"
                error={
                  nicknameStatus === "taken" ? "Questo nickname è già in uso" : undefined
                }
                hint={
                  nicknameStatus === "available"
                    ? undefined
                    : nicknameStatus === "checking"
                      ? "Verifica disponibilità..."
                      : "3-20 caratteri, lettere, numeri e underscore"
                }
                required
              />
              {nicknameStatus === "available" && (
                <p className="mt-1.5 text-xs text-green-500 font-robert">✓ Nickname disponibile</p>
              )}
            </div>

            <Select
              label="Provincia"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Raccontaci di te..."
                className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none h-24"
                maxLength={200}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                {error}
              </p>
            )}
            {saved && (
              <p className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                Profilo salvato!
              </p>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="accent"
                isLoading={saving}
                disabled={saved}
              >
                Salva
              </Button>
              <Link href="/profilo">
                <Button type="button" variant="outline">
                  Annulla
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
