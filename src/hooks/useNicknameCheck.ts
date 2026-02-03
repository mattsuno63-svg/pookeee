"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { validateNickname } from "@/lib/utils";

const DEBOUNCE_MS = 400;

export type NicknameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useNicknameCheck(nickname: string, excludeUserId?: string | null) {
  const [status, setStatus] = useState<NicknameStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const check = useCallback(async () => {
    const trimmed = nickname.trim();
    const validation = validateNickname(trimmed);

    if (!validation.valid) {
      setStatus("invalid");
      return;
    }
    if (trimmed.length < 2) {
      setStatus("idle");
      return;
    }

    setStatus("checking");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const params = new URLSearchParams({ nickname: trimmed });
      if (excludeUserId) params.set("exclude", excludeUserId);
      const res = await fetch(`/api/user/nickname-check?${params}`, {
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("taken");
        return;
      }
      setStatus(data.available ? "available" : "taken");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setStatus("taken"); // fail closed
    }
  }, [nickname, excludeUserId]);

  useEffect(() => {
    const trimmed = nickname.trim();
    const validation = validateNickname(trimmed);

    if (validation.valid && trimmed.length >= 2) {
      timerRef.current = setTimeout(check, DEBOUNCE_MS);
    } else if (validation.valid && trimmed.length < 2) {
      setStatus("idle");
    } else if (!validation.valid && trimmed.length > 0) {
      setStatus("invalid");
    } else {
      setStatus("idle");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [nickname, check]);

  return status;
}
