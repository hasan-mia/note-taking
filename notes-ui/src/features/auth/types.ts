export type Role = "user" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface AuthRegisterResponse {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}