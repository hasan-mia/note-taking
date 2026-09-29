import { FileText } from "lucide-react";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-4xl items-center justify-center gap-8">
        <RegisterBrandPanel />
        <RegisterForm />
      </div>
    </main>
  );
}

function RegisterBrandPanel() {
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
          Start your personal notes workspace.
        </h2>
        <p className="text-sm text-neutral-400">
          Create an account to start writing notes. Admin users are created
          separately by an administrator.
        </p>
      </div>
    </div>
  );
}