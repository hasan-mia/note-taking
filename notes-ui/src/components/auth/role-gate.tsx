import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/store";

interface RoleGateProps {
  role: "admin";
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the authenticated user holds the required role.
 * Otherwise renders `fallback`. Roles are FIXED: 'user' and 'admin'.
 */
export function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const userRole = useAuthStore((s) => s.user?.role);
  const allowed = userRole === role;
  return <>{allowed ? children : fallback}</>;
}