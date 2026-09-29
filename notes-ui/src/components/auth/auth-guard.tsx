"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { fetchMe } from "@/features/auth/api";
import { Skeleton } from "@/components/ui/skeleton";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// Single gate for every protected route. Resolves auth once, shows a loader
// while resolving, and only renders children once the user is authenticated.
// On 401 the session is cleared and the user is redirected to /login.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [authFailed, setAuthFailed] = useState(false);

  // Safety net: ensure hydration completes even if persist rehydration
  // doesn't fire (e.g. first visit with no stored state).
  useEffect(() => {
    if (isHydrated) return;
    const timer = window.setTimeout(
      () => useAuthStore.getState().setHydrated(),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [isHydrated]);

  // Restore the profile when tokens exist but no user is loaded yet.
  useEffect(() => {
    if (!isHydrated || user || authFailed) return;
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (me) {
          useAuthStore.getState().setSession({ user: me, token });
        } else {
          useAuthStore.getState().logout();
          setAuthFailed(true);
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout();
          setAuthFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, user, authFailed]);

  const status: AuthStatus = (() => {
    if (!isHydrated) return "loading";
    if (user) return "authenticated";
    if (!token) return "unauthenticated";
    if (authFailed) return "unauthenticated";
    return "loading";
  })();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}