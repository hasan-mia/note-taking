"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, FileText } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setSession({ user: data.user, token: data.token });
      toast.success("Signed in successfully");
      router.replace("/dashboard/notes");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to your notes workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            size="xl"
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function LoginBrandPanel() {
  return (
    <div className="relative hidden w-full max-w-md flex-col justify-between overflow-hidden rounded-2xl bg-neutral-950 p-10 text-neutral-500 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-[oklch(0.488_0.243_264.376)]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-[oklch(0.488_0.243_264.376)]/20 blur-3xl"
      />
      <div className="relative flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <FileText className="size-6 text-[oklch(0.72_0.15_264.376)]" />
        </div>
        <span className="text-xl font-semibold">Notes UI</span>
      </div>
      <div className="relative space-y-6">
        <h2 className="text-3xl font-semibold leading-tight">
          Capture, organize, and find your notes.
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-2 text-sm">
            <FileText className="mt-0.5 size-5 shrink-0 text-[oklch(0.72_0.15_264.376)]" />
            <span>Personal notes with cursor-based pagination.</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <FileText className="mt-0.5 size-5 shrink-0 text-[oklch(0.72_0.15_264.376)]" />
            <span>Public posts and user management.</span>
          </li>
        </ul>
      </div>
      <p className="relative text-xs text-neutral-400">
        Minimal frontend for the Notes REST API.
      </p>
    </div>
  );
}