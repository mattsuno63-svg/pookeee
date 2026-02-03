"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Owner } from "@/types/database";

const ADMIN_EMAIL = "baroccodigitale@gmail.com";

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  owner: Owner | null;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchUserData = useCallback(async (opts?: { silent?: boolean }) => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    if (!opts?.silent) setIsLoading(true);

    const TIMEOUT_MS = 5000; // Ridotto a 5 secondi per evitare attese lunghe
    const mkTimeout = () =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("User fetch timeout")), TIMEOUT_MS)
      );

    try {
      const { data: { user: authUser } } = await Promise.race([
        supabase.auth.getUser(),
        mkTimeout(),
      ]);

      if (!mountedRef.current) return;

      setUser(authUser);

      if (authUser) {
        const { data: profileData } = await Promise.race([
          supabase.from("profiles").select("*").eq("id", authUser.id).single(),
          mkTimeout(),
        ]);

        if (!mountedRef.current) return;
        setProfile(profileData ?? null);

        if (profileData?.role === "owner" || profileData?.role === "admin") {
          const { data: ownerData } = await Promise.race([
            supabase.from("owners").select("*").eq("id", authUser.id).single(),
            mkTimeout(),
          ]);

          if (!mountedRef.current) return;
          setOwner(ownerData ?? null);
        } else {
          setOwner(null);
        }
      } else {
        setProfile(null);
        setOwner(null);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if ((error as Error).message === "User fetch timeout") {
        console.warn("User fetch timed out (tab may have been backgrounded)");
      } else {
        console.error("Error fetching user data:", error);
      }
    } finally {
      fetchInProgressRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        try {
          if (event === "SIGNED_IN") {
            await fetchUserData();
          } else if (event === "TOKEN_REFRESHED") {
            await fetchUserData({ silent: true });
          } else if (event === "SIGNED_OUT") {
            if (mountedRef.current) {
              setUser(null);
              setProfile(null);
              setOwner(null);
            }
          }
        } catch (err) {
          if (!isAbortError(err)) console.error("Auth state change error:", err);
        }
      }
    );

    // Listener per visibilità: evita refetch inutili quando la tab ritorna in focus
    // Solo il TOKEN_REFRESHED farà refetch se necessario
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Non fare nulla - lascia che onAuthStateChange gestisca i refresh
        // Questo previene il doppio caricamento
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setProfile(null);
    setOwner(null);
    window.location.href = "/";
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchUserData();
  }, [fetchUserData]);

  const value: UserContextValue = {
    user,
    profile,
    owner,
    isLoading,
    isOwner: profile?.role === "owner",
    isAdmin: profile?.role === "admin" || user?.email === ADMIN_EMAIL,
    signOut,
    refresh,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}
