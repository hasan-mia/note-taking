"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/features/auth/api";
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
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      register({
        name: name.trim(),
        email: email.trim(),
        password,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Account created. Please sign in.");
      router.replace("/login");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription>
          Register a new user account (role is fixed to <code>user</code>).
          Interests are optional.
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="interests">Interests (optional)</Label>
            <Input
              id="interests"
              placeholder="chess, reading, hiking"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated, up to 10. Used to group users by interest.
            </p>
          </div>
          <Button
            type="submit"
            size="xl"
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}