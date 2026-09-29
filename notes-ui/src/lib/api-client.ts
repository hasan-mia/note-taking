import axios from "axios";
import { useAuthStore } from "@/features/auth/store";
import { getApiErrorMessage } from "@/lib/api-error";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // This API has no refresh endpoint. Clear the session and let the
      // AuthGuard redirect to /login.
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(
      new Error(getApiErrorMessage(error, "Something went wrong")),
    );
  },
);