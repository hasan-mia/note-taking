"use client";

import { RoleGate } from "@/components/auth/role-gate";
import { AdminOnly } from "@/components/auth/admin-only";
import { InterestsList } from "@/features/interests/components/interests-list";

export default function InterestsPage() {
  return (
    <RoleGate role="admin" fallback={<AdminOnly />}>
      <InterestsList />
    </RoleGate>
  );
}
