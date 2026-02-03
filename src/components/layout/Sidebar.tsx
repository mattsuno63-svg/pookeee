"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Avatar } from "@/components/ui/Avatar";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const dashboardLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/sedi",
    label: "Sedi",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/tornei",
    label: "Tornei",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/template",
    label: "Template",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/programmazione",
    label: "Programmazione",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/abbonamento",
    label: "Abbonamento",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/impostazioni",
    label: "Impostazioni",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, owner } = useUser();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Prefetch data al mouse hover sui link
  const handleMouseEnter = (href: string) => {
    if (href.includes('/tornei')) {
      queryClient.prefetchQuery({
        queryKey: ['owner-tournaments', owner?.id],
        queryFn: async () => {
          const { data } = await supabase
            .from("tournaments")
            .select("*, store:stores(name, slug)")
            .eq("stores.owner_id", owner!.id)
            .order("start_date", { ascending: false });
          return data ?? [];
        },
        staleTime: 5 * 60 * 1000,
      });
    } else if (href.includes('/sedi')) {
      queryClient.prefetchQuery({
        queryKey: ['owner-stores', owner?.id],
        queryFn: async () => {
          const { data } = await supabase
            .from("stores")
            .select("*")
            .eq("owner_id", owner!.id);
          return data ?? [];
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="font-robert font-bold text-xl">
          <span className="text-foreground">Tourney</span>
          <span className="text-accent">Hub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {dashboardLinks.map((link) => {
            // Per Overview, deve essere esattamente /dashboard
            // Per gli altri, può essere la pagina o una sottopagina
            const isActive = link.href === "/dashboard" 
              ? pathname === "/dashboard"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onMouseEnter={() => handleMouseEnter(link.href)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-robert text-sm",
                    "transition-all duration-200",
                    isActive
                      ? "bg-accent text-background"
                      : "text-muted hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar
            src={profile?.avatar_url ?? undefined}
            fallback={profile?.nickname ?? user?.email?.slice(0, 2).toUpperCase() ?? "?"}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.nickname ?? user?.email?.split("@")[0] ?? "Utente"}
            </p>
            <p className="text-xs text-muted truncate">Gestore</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
