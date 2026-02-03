"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, validateStoreName, validatePassword, isSlugReserved } from "@/lib/utils";
import { PROVINCES } from "@/lib/constants";

export default function RegisterOwnerPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2: Business + Sede (tutti i dati per la prima sede)
    businessName: "",
    vatNumber: "",
    businessEmail: "",
    businessPhone: "",
    description: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    emailStore: "",
    instagram: "",
    facebook: "",
    discord: "",
    whatsapp: "",
    // Step 3: Terms
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Inserisci un'email valida";
    }

    const pwdValidation = validatePassword(formData.password);
    if (!pwdValidation.valid) {
      newErrors.password = pwdValidation.error ?? "La password non è valida";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Le password non corrispondono";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName) {
      newErrors.businessName = "Il nome dell'attività è obbligatorio";
    } else if (formData.businessName.length < 3) {
      newErrors.businessName = "Il nome deve avere almeno 3 caratteri";
    } else {
      const validation = validateStoreName(formData.businessName);
      if (!validation.valid) newErrors.businessName = validation.error ?? "";
      const slug = generateSlug(formData.businessName);
      if (isSlugReserved(slug)) newErrors.businessName = "Questo nome non è disponibile";
    }

    if (formData.businessPhone && !/^[+]?[\d\s-]{6,}$/.test(formData.businessPhone)) {
      newErrors.businessPhone = "Inserisci un numero di telefono valido";
    }

    if (formData.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
      newErrors.businessEmail = "Inserisci un'email valida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      setErrors({ acceptTerms: "Devi accettare i termini e condizioni" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "owner",
            business_name: formData.businessName.trim(),
            vat_number: formData.vatNumber?.trim() || "",
            business_email: formData.businessEmail?.trim() || "",
            business_phone: formData.businessPhone?.trim() || "",
            description: formData.description?.trim() || "",
            address: formData.address?.trim() || "",
            city: formData.city?.trim() || "",
            province: formData.province?.trim() || "",
            postal_code: formData.postal_code?.trim() || "",
            phone: formData.phone?.trim() || "",
            emailStore: formData.emailStore?.trim() || "",
            instagram: formData.instagram?.trim() || "",
            facebook: formData.facebook?.trim() || "",
            discord: formData.discord?.trim() || "",
            whatsapp: formData.whatsapp?.trim() || "",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          setErrors({ form: "Questa email è già registrata" });
        } else {
          setErrors({ form: authError.message });
        }
        return;
      }

      if (!authData.user) return;

      // Owner e store creati dal trigger handle_new_user (funziona anche con conferma email)
      // La sede è già creata con i dati inseriti. L'admin deve approvare manualmente.
      // Se sessione attiva (conferma email disabilitata), redirect a dashboard (vedrà "In attesa")
      if (authData.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Errore registrazione gestore:", err);
      setErrors({ form: err instanceof Error ? err.message : "Si è verificato un errore. Riprova." });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-zentry text-3xl font-bold uppercase">Richiesta inviata!</h1>
        <p className="text-muted">
          La tua richiesta è stata inviata. Riceverai un&apos;email quando l&apos;admin avrà approvato il tuo account.
        </p>
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-accent text-sm">
            Verifica la tua email <strong>{formData.email}</strong> per attivare l&apos;account.
          </p>
        </div>
        <Button variant="accent" onClick={() => router.push("/login")}>
          Vai al login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-zentry text-4xl font-bold uppercase mb-2">Registra la tua attività</h1>
        <p className="text-muted">Inizia la prova gratuita di 4 giorni</p>
        <p className="text-sm text-muted mt-2">
          <Link href="/registrati" className="text-accent hover:underline">
            ← Torna a registrazione giocatore
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              s === step ? "bg-accent" : s < step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-robert font-medium text-lg mb-4">Credenziali di accesso</h2>
            <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="la-tua@email.com" error={errors.email} required autoComplete="email" />
            <Input label="Password" type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="••••••••" error={errors.password} hint="Minimo 8 caratteri" required autoComplete="new-password" />
            <Input label="Conferma Password" type="password" value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} placeholder="••••••••" error={errors.confirmPassword} required autoComplete="new-password" />
            <Button type="button" variant="accent" size="lg" className="w-full" onClick={handleNext}>
              Continua
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-robert font-medium text-lg mb-4">Dati attività e sede</h2>
            <p className="text-sm text-muted mb-4">Questi dati compileranno automaticamente la tua prima sede.</p>
            <Input label="Nome Attività *" value={formData.businessName} onChange={(e) => handleChange("businessName", e.target.value)} placeholder="Es: Dragon Cards Roma" error={errors.businessName} required />
            <Input label="P.IVA (opzionale)" value={formData.vatNumber} onChange={(e) => handleChange("vatNumber", e.target.value)} placeholder="IT12345678901" />
            <Input label="Descrizione" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Breve descrizione del negozio" />
            <Input label="Indirizzo" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Via, civico" />
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
            <Input label="Telefono Sede" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+39 06 1234567" />
            <Input label="Email Sede" type="email" value={formData.emailStore} onChange={(e) => handleChange("emailStore", e.target.value)} placeholder="negozio@email.com" />
            <Input label="Email Aziendale (fallback)" type="email" value={formData.businessEmail} onChange={(e) => handleChange("businessEmail", e.target.value)} placeholder="info@tuonegozio.it" error={errors.businessEmail} />
            <Input label="Telefono Aziendale (fallback)" type="tel" value={formData.businessPhone} onChange={(e) => handleChange("businessPhone", e.target.value)} placeholder="+39 06 1234567" error={errors.businessPhone} />
            <div className="border-t border-border pt-4">
              <h3 className="font-robert font-medium mb-2">Social (link ai tuoi profili)</h3>
              <Input label="Instagram" value={formData.instagram} onChange={(e) => handleChange("instagram", e.target.value)} placeholder="https://instagram.com/..." />
              <Input label="Facebook" value={formData.facebook} onChange={(e) => handleChange("facebook", e.target.value)} placeholder="https://facebook.com/..." />
              <Input label="Discord" value={formData.discord} onChange={(e) => handleChange("discord", e.target.value)} placeholder="https://discord.gg/..." />
              <Input label="WhatsApp (link o numero con prefisso)" value={formData.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} placeholder="https://wa.me/39... o +39 06 1234567" />
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleBack}>Indietro</Button>
              <Button type="button" variant="accent" size="lg" className="flex-1" onClick={handleNext}>Continua</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-robert font-medium text-lg mb-4">Riepilogo e conferma</h2>
            <div className="space-y-3 p-4 bg-foreground/5 border border-border rounded-lg">
              <div className="flex justify-between"><span className="text-muted">Email:</span><span>{formData.email}</span></div>
              <div className="flex justify-between"><span className="text-muted">Attività:</span><span>{formData.businessName}</span></div>
              {formData.city && <div className="flex justify-between"><span className="text-muted">Città:</span><span>{formData.city}</span></div>}
              {formData.province && <div className="flex justify-between"><span className="text-muted">Provincia:</span><span>{PROVINCES.find((p) => p.value === formData.province)?.label ?? formData.province}</span></div>}
            </div>
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <h3 className="font-medium text-accent mb-2">Prova Gratuita 4 Giorni</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>✓ Accesso completo dopo approvazione admin</li>
                <li>✓ La tua sede sarà creata automaticamente</li>
                <li>✓ Nessuna carta di credito richiesta</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.acceptTerms} onChange={(e) => handleChange("acceptTerms", e.target.checked)} className="mt-1 w-4 h-4 rounded border-border bg-transparent checked:bg-accent" />
              <span className="text-sm text-muted">
                Accetto i <Link href="/termini" className="text-accent hover:underline">Termini e Condizioni</Link> e la <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}
            {errors.form && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errors.form}</p>}
            <div className="flex gap-4">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleBack}>Indietro</Button>
              <Button type="submit" variant="accent" size="lg" className="flex-1" isLoading={isLoading}>Invia richiesta</Button>
            </div>
          </>
        )}
      </form>

      <div className="text-center">
        <p className="text-sm text-muted">
          Hai già un account?{" "}
          <Link href="/login" className="text-accent hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
