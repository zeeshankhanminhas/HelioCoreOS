import { BootstrapClient } from "./bootstrap-client";

export const dynamic = "force-dynamic";

export default async function BootstrapPage({
  searchParams,
}: {
  searchParams: Promise<{ organisationName?: string; fullName?: string }>;
}) {
  const params = await searchParams;

  return (
    <BootstrapClient
      organisationName={params.organisationName ?? null}
      fullName={params.fullName ?? null}
    />
  );
}
