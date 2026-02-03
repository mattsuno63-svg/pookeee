"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { validateNickname, validatePassword } from "@/lib/utils";
import { useNicknameCheck } from "@/hooks/useNicknameCheck";
import { PROVINCES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    province: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const nicknameStatus = useNicknameCheck(formData.nickname);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Nickname
    const nicknameValidation = validateNickname(formData.nickname);
    if (!nicknameValidation.valid) {
      newErrors.nickname = nicknameValidation.error!;
    } else if (nicknameStatus === "taken") {
      newErrors.nickname = "Questo nickname è già in uso";
    } else if (nicknameStatus === "checking") {
      newErrors.nickname = "Attendi la verifica del nickname";
    }

    // Email
    if (!formData.email) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Inserisci un'email valida";
    }

    // Password
    const pwdValidation = validatePassword(formData.password);
    if (!pwdValidation.valid) {
      newErrors.password = pwdValidation.error!;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Le password non corrispondono";
    }

    // Province
    if (!formData.province.trim()) {
      newErrors.province = "La provincia è obbligatoria per mostrarti i tornei nella tua zona";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nickname: formData.nickname,
            role: "player",
            province: formData.province || undefined,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setErrors({ email: "Questa email è già registrata" });
        } else if (error.message.includes("Invalid email")) {
          setErrors({ email: "Inserisci un'email valida" });
        } else {
          setErrors({ form: error.message });
        }
        return;
      }

      // Aggiorna profilo con provincia
      if (data?.user) {
        await supabase
          .from("profiles")
          .update({
            province: formData.province || null,
          })
          .eq("id", data.user.id);
      }

      // Se c'è sessione (conferma email disabilitata), reindirizza subito
      if (data?.session) {
        router.push("/tornei");
        router.refresh();
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Errore registrazione:", err);
      setErrors({ form: err instanceof Error ? err.message : "Si è verificato un errore. Riprova." });
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Abilitare quando configurati i provider OAuth
  // const handleOAuthSignup = async (provider: "google" | "discord") => { ... };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-zentry text-3xl font-bold uppercase">Registrazione completata!</h1>
        <p className="text-muted">
          Abbiamo inviato un&apos;email di conferma a <strong>{formData.email}</strong>.
          Clicca sul link per attivare il tuo account.
        </p>
        <Button variant="accent" onClick={() => router.push("/login")}>
          Vai al login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-zentry text-4xl font-bold uppercase mb-2">Registrati</h1>
        <p className="text-muted">Crea il tuo profilo giocatore gratuito</p>
        <p className="text-sm text-muted mt-2">
          Sei un negozio?{" "}
          <Link href="/registrati/gestore" className="text-accent hover:underline font-medium">
            Registra la tua attività →
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Nickname"
            value={formData.nickname}
            onChange={(e) => handleChange("nickname", e.target.value)}
            placeholder="Il tuo nickname"
            error={
              errors.nickname ||
              (nicknameStatus === "taken" ? "Questo nickname è già in uso" : undefined)
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

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="la-tua@email.com"
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          placeholder="••••••••"
          error={errors.password}
          hint="8+ caratteri, maiuscola, minuscola e numero"
          required
          autoComplete="new-password"
        />

        <Input
          label="Conferma Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          placeholder="••••••••"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <Select
          label="Provincia *"
          value={formData.province}
          onChange={(e) => handleChange("province", e.target.value)}
          options={[{ value: "", label: "Seleziona provincia" }, ...PROVINCES.filter((p) => p.value).map((p) => ({ value: p.value, label: p.label }))]}
          error={errors.province}
          required
        />

        {errors.form && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
            {errors.form}
          </p>
        )}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Crea Account
        </Button>
      </form>

      {/* Social auth - TODO: abilitare quando configurati i provider */}

      {/* Links */}
      <div className="text-center">
        <p className="text-sm text-muted">
          Hai già un account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
