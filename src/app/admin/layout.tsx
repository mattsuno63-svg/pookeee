"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

const ADMIN_EMAIL = "baroccodigitale@gmail.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, isLoading, isAdmin } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/admin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  const canAccess = isAdmin || user.email === ADMIN_EMAIL;
  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="font-zentry font-bold text-xl">
            Admin TourneyHub
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user.email}</span>
            <Link href="/" className="text-sm text-accent hover:underline">
              ← Torna al sito
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
