"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email o password non corretti");
        } else {
          setError(error.message);
        }
        return;
      }

      // Fetch profile to redirect based on role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const target = profile?.role === "admin" ? "/admin" : profile?.role === "owner" ? "/dashboard" : "/tornei";
      router.push(redirectTo || target);
      router.refresh();
    } catch {
      setError("Si è verificato un errore. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Abilitare quando configurati i provider OAuth
  // const handleOAuthLogin = async (provider: "google" | "discord") => {
  //   const supabase = createClient();
  //   await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}` }});
  // };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-zentry text-4xl font-bold uppercase mb-2">Accedi</h1>
        <p className="text-muted">Bentornato su TourneyHub</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="la-tua@email.com"
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Accedi
        </Button>
      </form>

      {/* Social auth - TODO: abilitare quando configurati i provider
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted">oppure continua con</span>
        </div>
      </div>
      */}

      {/* Links */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted">
          Non hai un account?{" "}
          <Link href="/registrati" className="text-accent hover:underline">
            Registrati
          </Link>
        </p>
        <p className="text-sm text-muted">
          Sei un gestore?{" "}
          <Link href="/registrati/gestore" className="text-primary hover:underline">
            Registra il tuo negozio
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center">
        <div className="h-10 bg-foreground/10 rounded w-32 mx-auto mb-2" />
        <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-foreground/10 rounded" />
        <div className="h-12 bg-foreground/10 rounded" />
        <div className="h-12 bg-foreground/10 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
