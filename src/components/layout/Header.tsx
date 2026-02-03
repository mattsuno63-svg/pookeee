"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";

const MOBILE_MENU_Z = 9999;

export function Header() {
  const pathname = usePathname();
  const { user, profile, owner, isOwner, isAdmin, isLoading, signOut } = useUser();
  const showNuovoTorneo = isOwner && owner?.application_status === "approved";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((open) => !open), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  const navLinks = [
    { href: "/#features", label: "Funzionalità" },
    { href: "/prezzi", label: "Prezzi" },
    { href: "/tornei", label: "Tornei" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "translate-y-0" : ""
      )}
    >
      <div className="mx-2.5 mt-2.5">
        <div
          className={cn(
            "max-w-[91.875rem] mx-auto px-3 md:px-5 transition-all duration-300",
            "rounded-[1.25rem] md:rounded-[2.5rem]",
            isScrolled ? "bg-background border border-border" : ""
          )}
        >
          <nav className="relative flex items-center justify-between min-h-[3.75rem] md:min-h-[5rem] gap-4 z-[60]">
            {/* Logo: sempre visibile, non si restringe */}
            <div className="flex items-center gap-4 md:gap-7 min-w-0 flex-shrink-0">
              <Link
                href="/"
                className="font-robert font-bold text-lg md:text-[1.6875rem] leading-[120%] whitespace-nowrap truncate"
              >
                TOURNEYHUB
              </Link>

              {!user && (
                <Link
                  href="/registrati/gestore"
                  className="hidden lg:inline-flex items-center justify-center bg-foreground text-background text-sm uppercase font-robert rounded-btn px-4 lg:px-6 py-2 lg:py-3 transition-transform duration-300 hover:scale-110"
                >
                  <span className="btn__label">
                    <span className="btn__main">Inizia</span>
                    <span className="btn__alt">Gratis!</span>
                  </span>
                </Link>
              )}
            </div>

            {/* Desktop: nav links + user (lg e oltre) */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-14">
              <ul className="flex items-center gap-8 xl:gap-14">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "relative font-robert text-base text-foreground leading-[130%]",
                        "after:content-[''] after:absolute after:left-0 after:bottom-0",
                        "after:w-0 after:h-0.5 after:bg-foreground",
                        "hover:after:w-full after:transition-all after:duration-300"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {!isLoading && (
                  <>
                    {user ? (
                      <>
                        {showNuovoTorneo && (
                          <li>
                            <Link
                              href="/dashboard/tornei/nuovo"
                              className="flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-background text-sm font-robert font-medium uppercase hover:bg-accent/90 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              Nuovo torneo
                            </Link>
                          </li>
                        )}
                        <li>
                          <NotificationBell userId={user.id} />
                        </li>
                        <li className="relative">
                          <button
                            type="button"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 font-robert text-base"
                          >
                            <Avatar
                              src={profile?.avatar_url ?? undefined}
                              fallback={profile?.nickname ?? user.email?.slice(0, 2).toUpperCase() ?? "?"}
                              size="sm"
                            />
                            <span>
                              {profile?.nickname ?? user.email?.split("@")[0]}
                            </span>
                            <svg
                              className={cn("w-4 h-4 transition-transform", showUserMenu && "rotate-180")}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showUserMenu && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                                aria-hidden
                              />
                              <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                                <Link
                                  href={isAdmin ? "/admin" : isOwner ? "/dashboard" : "/profilo"}
                                  className="block px-4 py-2 text-sm hover:bg-foreground/10"
                                  onClick={() => setShowUserMenu(false)}
                                >
                                  {isAdmin ? "Admin" : isOwner ? "Dashboard" : "Il mio profilo"}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    signOut();
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-foreground/10"
                                >
                                  Esci
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      </>
                    ) : (
                      <li className="flex items-center gap-3">
                        <Link
                          href="/login"
                          className={cn(
                            "relative inline-flex items-center justify-center font-robert font-medium uppercase",
                            "rounded-btn px-6 py-3 text-sm",
                            "border border-border text-foreground bg-transparent",
                            "transition-all duration-300 ease-out",
                            "hover:border-accent hover:text-accent hover:scale-105 active:scale-95",
                            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                          )}
                        >
                          Accedi
                        </Link>
                        <Link
                          href="/registrati"
                          className={cn(
                            "relative inline-flex items-center justify-center font-robert font-medium uppercase",
                            "rounded-btn px-6 py-3 text-sm",
                            "bg-accent text-background",
                            "transition-all duration-300 ease-out",
                            "hover:bg-accent/90 hover:scale-105 active:scale-95",
                            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                          )}
                        >
                          Registrati
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            {/* Mobile/tablet: solo hamburger */}
            <button
              type="button"
              className="relative w-[1.875rem] h-[1.125rem] lg:hidden flex-shrink-0 touch-manipulation"
              onClick={toggleMobileMenu}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={isMobileMenuOpen ? "Chiudi menu" : "Apri menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-dialog"
            >
              <span
                className={cn(
                  "absolute right-0 w-full h-0.5 bg-foreground transition-all duration-300",
                  isMobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                )}
              />
              <span
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 h-0.5 bg-foreground transition-all duration-300",
                  isMobileMenuOpen ? "w-0" : "w-full"
                )}
              />
              <span
                className={cn(
                  "absolute right-0 w-full h-0.5 bg-foreground transition-all duration-300",
                  isMobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                )}
              />
            </button>
          </nav>

          {/* Overlay menu: renderizzato in portal su body così z-index e click funzionano sempre */}
          {mounted &&
            createPortal(
              <div
                id="mobile-menu-dialog"
                role="dialog"
                aria-modal={isMobileMenuOpen}
                aria-hidden={!isMobileMenuOpen}
                style={{ zIndex: MOBILE_MENU_Z }}
                className={cn(
                  "fixed inset-0 lg:hidden",
                  "transition-[visibility,opacity] duration-300 ease-out",
                  isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
                )}
              >
                {/* Backdrop liquid glass: blur + trasparenza */}
                <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-[20px] supports-[backdrop-filter]:bg-white/5"
                  onClick={closeMobileMenu}
                  aria-hidden
                />
                {/* Pannello contenuto: vetro con bordo luminoso */}
                <div
                  className={cn(
                    "absolute inset-x-4 top-[5.5rem] bottom-12 rounded-[2rem] overflow-y-auto",
                    "bg-black/[0.4] backdrop-blur-2xl",
                    "border border-white/20 shadow-2xl",
                    "p-6",
                    "transition-transform duration-300 ease-out",
                    isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pulsante chiudi dentro il pannello */}
                  <button
                    type="button"
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 touch-manipulation z-10"
                    onClick={closeMobileMenu}
                    aria-label="Chiudi menu"
                  >
                    <span className="sr-only">Chiudi</span>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Layout Bento Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-2 max-w-2xl mx-auto">
                    {!isLoading && user ? (
                      <>
                        {/* Card grande: Navigazione principale */}
                        <Link
                          href="/tornei"
                          className="col-span-2 row-span-1 group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-robert font-bold text-xl text-white">Tornei</h3>
                                <p className="font-robert text-sm text-white/60">Esplora e partecipa</p>
                              </div>
                            </div>
                          </div>
                        </Link>

                        {/* Card media: Notifiche */}
                        <div className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                              <NotificationBell userId={user.id} />
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-white mb-1">Notifiche</h3>
                            <p className="font-robert text-xs text-white/50">I tuoi aggiornamenti</p>
                          </div>
                        </div>

                        {/* Card media: Prezzi */}
                        <Link
                          href="/prezzi"
                          className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-white mb-1">Prezzi</h3>
                            <p className="font-robert text-xs text-white/50">Piani e tariffe</p>
                          </div>
                        </Link>

                        {/* Card grande: Nuovo Torneo (se owner) */}
                        {showNuovoTorneo && (
                          <Link
                            href="/dashboard/tornei/nuovo"
                            className="col-span-2 row-span-1 group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-xl border border-accent/30 hover:border-accent/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            onClick={closeMobileMenu}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-accent/30 flex items-center justify-center">
                                  <svg className="w-7 h-7 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-robert font-bold text-xl text-background mb-1">Nuovo Torneo</h3>
                                  <p className="font-robert text-sm text-background/80">Crea un nuovo evento</p>
                                </div>
                              </div>
                              <svg className="w-6 h-6 text-background/60 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        )}

                        {/* Card profilo utente */}
                        <Link
                          href={isAdmin ? "/admin" : isOwner ? "/dashboard" : "/profilo"}
                          className="col-span-2 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10 flex items-center gap-4">
                            <div className="relative">
                              <Avatar
                                src={profile?.avatar_url ?? undefined}
                                fallback={profile?.nickname ?? user.email?.slice(0, 2).toUpperCase() ?? "?"}
                                size="md"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-robert font-semibold text-lg text-white truncate">
                                {profile?.nickname ?? user.email?.split("@")[0]}
                              </h3>
                              <p className="font-robert text-sm text-white/60 truncate">
                                {isAdmin ? "Amministratore" : isOwner ? "Gestore" : "Profilo"}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>

                        {/* Card logout */}
                        <button
                          type="button"
                          onClick={() => {
                            closeMobileMenu();
                            signOut();
                          }}
                          className="col-span-2 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-red-500/20 to-red-500/10 backdrop-blur-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center">
                              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="font-robert font-semibold text-lg text-red-400">Esci</h3>
                              <p className="font-robert text-sm text-red-400/60">Disconnetti account</p>
                            </div>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Card grande: Navigazione principale */}
                        <Link
                          href="/tornei"
                          className="col-span-2 row-span-1 group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-robert font-bold text-xl text-white">Tornei</h3>
                                <p className="font-robert text-sm text-white/60">Esplora e partecipa</p>
                              </div>
                            </div>
                          </div>
                        </Link>

                        {/* Card media: Funzionalità */}
                        <Link
                          href="/#features"
                          className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-white mb-1">Funzionalità</h3>
                            <p className="font-robert text-xs text-white/50">Scopri le features</p>
                          </div>
                        </Link>

                        {/* Card media: Prezzi */}
                        <Link
                          href="/prezzi"
                          className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-white mb-1">Prezzi</h3>
                            <p className="font-robert text-xs text-white/50">Piani e tariffe</p>
                          </div>
                        </Link>

                        {/* Card grande: Accedi */}
                        <Link
                          href="/login"
                          className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-white/[0.08] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-white mb-1">Accedi</h3>
                            <p className="font-robert text-xs text-white/50">Hai già un account?</p>
                          </div>
                        </Link>

                        {/* Card grande: Registrati */}
                        <Link
                          href="/registrati"
                          className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-xl border border-accent/30 hover:border-accent/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center mb-3">
                              <svg className="w-5 h-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <h3 className="font-robert font-semibold text-lg text-background mb-1">Registrati</h3>
                            <p className="font-robert text-xs text-background/80">Inizia subito</p>
                          </div>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </header>
  );
}
