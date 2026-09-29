import { apiClient } from "@/lib/api-client";

export interface InterestGroup {
  _id: string;
  count: number;
  users: { _id: string; name: string }[];
}

export async function groupUsersByInterests(
  interest?: string,
): Promise<InterestGroup[]> {
  const res = await apiClient.get("/users/grouped-by-interests", {
    params: { interest: interest || undefined },
  });
  return res.data.data as InterestGroup[];
}