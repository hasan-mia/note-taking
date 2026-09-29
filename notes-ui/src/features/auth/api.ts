import { apiClient } from "@/lib/api-client";
import type {
  AuthLoginResponse,
  AuthRegisterResponse,
  User,
} from "./types";

export async function login(
  email: string,
  password: string,
): Promise<AuthLoginResponse> {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data.data as AuthLoginResponse;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  interests?: string[];
}): Promise<AuthRegisterResponse> {
  const res = await apiClient.post("/auth/register", input);
  return res.data.data as AuthRegisterResponse;
}

export async function fetchMe(): Promise<User | null> {
  try {
    const res = await apiClient.get("/auth/me");
    return res.data.data as User;
  } catch {
    return null;
  }
}