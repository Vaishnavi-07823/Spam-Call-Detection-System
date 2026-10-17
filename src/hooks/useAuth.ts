/**
 * Auth hook — manages user session state via Supabase auth and demo guest access.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const GUEST_STORAGE_KEY = "trueshield_guest_user";

const MOCK_GUEST_USER: User = {
  id: "guest-evaluator-id",
  app_metadata: {},
  user_metadata: { full_name: "Evaluator / Demo Officer" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "evaluator@trueshield.ai",
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if guest user session exists in localStorage
    if (typeof window !== "undefined") {
      const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          setUser(parsed);
          setLoading(false);
        } catch {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          }
          setSession(session);
          setUser(session.user);
        } else {
          const isGuest = typeof window !== "undefined" && !!localStorage.getItem(GUEST_STORAGE_KEY);
          if (!isGuest) {
            setSession(null);
            setUser(null);
          }
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }
        setSession(session);
        setUser(session.user);
      } else {
        const isGuest = typeof window !== "undefined" && !!localStorage.getItem(GUEST_STORAGE_KEY);
        if (!isGuest) {
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAsGuest = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(MOCK_GUEST_USER));
    }
    setUser(MOCK_GUEST_USER);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
  }, []);

  return { user, session, loading, signOut, signInAsGuest };
}
