import { apiClient } from "@/lib/api-client";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "./types";

export type { User, CreateUserInput, UpdateUserInput };

export interface UserPage {
  data: User[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listUsers(
  cursor: string | null,
  limit = 10,
): Promise<UserPage> {
  const res = await apiClient.get("/users", {
    params: { limit, after: cursor || undefined },
  });
  return {
    data: res.data.data as User[],
    nextCursor: res.data.meta?.nextCursor ?? null,
    hasMore: res.data.meta?.hasMore ?? false,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await apiClient.post("/users", input);
  return res.data.data as User;
}

export async function getUser(id: string): Promise<User> {
  const res = await apiClient.get(`/users/${id}`);
  return res.data.data as User;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  const res = await apiClient.put(`/users/${id}`, input);
  return res.data.data as User;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
