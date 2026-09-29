export type Role = "user" | "admin";

/** User shape returned by the API (no password, `_id` as the identifier). */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
  interests?: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  interests?: string[];
}
