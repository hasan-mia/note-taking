import type { LucideIcon } from "lucide-react";
import {
  FileText,
  MessageSquare,
  Users,
  Tag,
} from "lucide-react";
import type { Role } from "@/features/auth/types";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
  roles?: Role[];
};

export const dashboardNav: NavigationItem[] = [
  { title: "Notes", href: "/dashboard/notes", icon: FileText, match: "prefix" },
  { title: "Posts", href: "/dashboard/posts", icon: MessageSquare, match: "prefix" },
  { title: "Users", href: "/dashboard/users", icon: Users, match: "prefix", roles: ["admin"] },
  { title: "Interests", href: "/dashboard/interests", icon: Tag, match: "prefix", roles: ["admin"] },
];