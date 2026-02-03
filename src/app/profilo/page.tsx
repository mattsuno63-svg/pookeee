"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useUser } from "@/hooks/useUser";
import { formatDate } from "@/lib/utils";

export default function ProfiloPage() {
  const router = useRouter();
  const { user, profile, isLoading, isOwner } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/profilo");
    }
  }, [user, isLoading, router]);

  // Owners go to dashboard
  useEffect(() => {
    if (!isLoading && isOwner) {
      router.replace("/dashboard");
    }
  }, [isOwner, isLoading, router]);

  if (isLoading || !user || isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  const stats = profile?.stats ?? { played: 0, won: 0, top3: 0 };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-zentry text-4xl font-bold uppercase mb-8">
            Il mio profilo
          </h1>

          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar
                  src={profile?.avatar_url ?? undefined}
                  fallback={profile?.nickname ?? user.email?.slice(0, 2).toUpperCase() ?? "?"}
                  size="xl"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="font-zentry text-2xl font-bold mb-1">
                    {profile?.nickname ?? "Giocatore"}
                  </h2>
                  <p className="text-muted text-sm">{user.email}</p>
                  {profile?.bio && (
                    <p className="mt-3 text-foreground/80">{profile.bio}</p>
                  )}
                  <Link href="/profilo/modifica" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      Modifica profilo
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-accent">{stats.played}</div>
                <div className="text-sm text-muted mt-1">Tornei giocati</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-accent">{stats.won}</div>
                <div className="text-sm text-muted mt-1">Vittorie</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-accent">{stats.top3}</div>
                <div className="text-sm text-muted mt-1">Top 3</div>
              </CardContent>
            </Card>
          </div>

          {profile?.badges && profile.badges.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <h3 className="font-robert font-bold">Targhe</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <Badge key={badge} variant="accent">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-robert font-bold">Informazioni account</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted">Membro dal:</span>{" "}
                {profile?.created_at ? formatDate(profile.created_at) : "-"}
              </p>
              <p>
                <span className="text-muted">Email verificata:</span>{" "}
                {user.email_confirmed_at ? "Sì" : "No"}
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/tornei" className="flex-1">
              <Button variant="accent" className="w-full">
                Cerca tornei
              </Button>
            </Link>
            <Link href="/miei-tornei" className="flex-1">
              <Button variant="outline" className="w-full">
                I miei tornei
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
