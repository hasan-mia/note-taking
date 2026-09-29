"use client";

import { RoleGate } from "@/components/auth/role-gate";
import { UsersList } from "@/features/users/components/users-list";
import { AdminOnly } from "@/components/auth/admin-only";

export default function UsersPage() {
  return (
    <RoleGate role="admin" fallback={<AdminOnly />}>
      <UsersList />
    </RoleGate>
  );
}
