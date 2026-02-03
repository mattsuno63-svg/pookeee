import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date in Italian locale
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  });
}

/**
 * Format time in Italian locale
 */
export function formatTime(date: Date | string): string {
  if (typeof date === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(date)) {
    const [h, m] = date.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Reserved words that cannot be used as slugs
 */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "register",
  "registrati",
  "dashboard",
  "store",
  "negozio",
  "profile",
  "profilo",
  "settings",
  "impostazioni",
  "torneo",
  "tornei",
  "giocatore",
  "giocatori",
  "null",
  "undefined",
  "test",
  "demo",
  "pricing",
  "prezzi",
];

/**
 * Check if a slug is reserved
 */
export function isSlugReserved(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validate store name
 */
export function validateStoreName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: "Il nome deve avere almeno 3 caratteri" };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: "Il nome non può superare i 50 caratteri" };
  }
  
  if (/^[0-9]+$/.test(trimmed)) {
    return { valid: false, error: "Il nome non può contenere solo numeri" };
  }
  
  if (/[<>"';\\\/]/.test(trimmed)) {
    return { valid: false, error: "Il nome contiene caratteri non validi" };
  }
  
  const slug = generateSlug(trimmed);
  if (isSlugReserved(slug)) {
    return { valid: false, error: "Questo nome non è disponibile" };
  }
  
  return { valid: true };
}

/** Nickname riservati (case-insensitive) */
export const RESERVED_NICKNAMES = [
  "admin", "administrator", "mod", "moderator", "support", "help", "info",
  "tourneyhub", "tourney", "sistema", "system", "null", "undefined", "test",
  "demo", "official", "ufficiale", "root", "guest", "anon", "anonymous",
];

export function isNicknameReserved(nickname: string): boolean {
  return RESERVED_NICKNAMES.includes(nickname.trim().toLowerCase());
}

/**
 * Validate nickname (formato e riservati)
 */
export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  const trimmed = nickname.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: "Il nickname deve avere almeno 3 caratteri" };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: "Il nickname non può superare i 20 caratteri" };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: "Il nickname può contenere solo lettere, numeri e underscore" };
  }

  if (isNicknameReserved(trimmed)) {
    return { valid: false, error: "Questo nickname non è disponibile" };
  }
  
  return { valid: true };
}

/**
 * Validazione password: lunghezza, maiuscola, numero
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "La password deve avere almeno 8 caratteri" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Aggiungi almeno una lettera maiuscola" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Aggiungi almeno una lettera minuscola" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Aggiungi almeno un numero" };
  }
  return { valid: true };
}

/**
 * Format currency in EUR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Calculate time until a date
 */
export function timeUntil(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  
  if (diff < 0) return "Scaduto";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** URL Google Maps da indirizzo (no API) */
export function getGoogleMapsUrl(address?: string | null, city?: string | null, postalCode?: string | null): string {
  const parts = [address, postalCode, city].filter(Boolean);
  if (parts.length === 0) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

/** Distanza in km tra due punti (formula di Haversine) */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** URL WhatsApp da numero o link (es. +39 06 1234567 o https://wa.me/39...) */
export function getWhatsAppUrl(phoneOrUrl?: string | null, message?: string): string {
  if (!phoneOrUrl) return "https://wa.me";
  const trimmed = phoneOrUrl.trim();
  if (trimmed.startsWith("http")) return message?.trim() ? `${trimmed}?text=${encodeURIComponent(message.trim())}` : trimmed;
  const num = trimmed.replace(/\D/g, "");
  const base = `https://wa.me/${num.startsWith("39") ? num : "39" + num}`;
  if (message?.trim()) return `${base}?text=${encodeURIComponent(message.trim())}`;
  return base;
}
