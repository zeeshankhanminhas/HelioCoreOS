"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/neon/client";

export function BootstrapClient({ organisationName, fullName }: { organisationName: string | null; fullName: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const client = createClient();
      const { error: bootstrapError } = await client.rpc("bootstrap_current_user", {
        organisation_name: organisationName,
        user_full_name: fullName,
      });

      if (cancelled) return;

      if (bootstrapError) {
        setError(bootstrapError.message || "Workspace setup failed.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fullName, organisationName, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg border border-[var(--line)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Governed workspace</p>
        <h1 className="mt-3 text-2xl font-semibold">Preparing HelioCoreOS</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {error ?? "Linking your Neon identity to the organisation and tenant security model."}
        </p>
        {error ? (
          <button className="mt-6 border border-[var(--foreground)] px-4 py-2 text-sm" onClick={() => router.replace(`/login?error=${encodeURIComponent(error)}`)}>
            Return to sign in
          </button>
        ) : null}
      </div>
    </main>
  );
}
