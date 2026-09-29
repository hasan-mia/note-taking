import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

interface AuthState {
  /** JWT returned by POST /api/auth/login. */
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  setSession: (session: { token: string; user: User }) => void;
  logout: () => void;
  /** Roles are fixed: 'user' and 'admin'. */
  isAdmin: () => boolean;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isHydrated: false,
      setSession: (session) => set({ token: session.token, user: session.user }),
      logout: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === "admin",
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "notes-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
