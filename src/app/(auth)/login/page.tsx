"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    router.push(callbackUrl?.startsWith("/") ? callbackUrl : "/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-dark-slate/10 bg-app-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-foreground">IntelliTrack</h1>
      <p className="mt-1 text-sm text-foreground/60">Sign in to continue.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-dark-slate/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="driver1@demo.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-dark-slate/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="demo1234"
          />
        </label>

        {error && <p className="text-sm text-severity-severe">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
