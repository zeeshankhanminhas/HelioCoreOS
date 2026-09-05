import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EquipmentWorkspace } from "./equipment-workspace";

type Props = {
  searchParams: Promise<{ tab?: string; error?: string; created?: string; updated?: string }>;
};

type TabId = "manufacturers" | "modules" | "inverters" | "batteries" | "compatibility";
const tabIds: TabId[] = ["manufacturers", "modules", "inverters", "batteries", "compatibility"];

export default async function EquipmentLibraryPage({ searchParams }: Props) {
  const messages = await searchParams;
  const activeTab: TabId = tabIds.includes(messages.tab as TabId) ? messages.tab as TabId : "manufacturers";
  const supabase = await createClient();

  const [{ data: manufacturers }, { data: modules }, { data: inverters }, { data: batteries }, { data: compatibility }] = await Promise.all([
    supabase.from("equipment_manufacturers").select("*").order("name"),
    supabase.from("pv_modules").select("*").order("created_at", { ascending: false }),
    supabase.from("inverters").select("*").order("created_at", { ascending: false }),
    supabase.from("batteries").select("*").order("created_at", { ascending: false }),
    supabase.from("inverter_battery_compatibility").select("*").order("updated_at", { ascending: false }),
  ]);

  const approvedCount = [...(modules ?? []), ...(inverters ?? []), ...(batteries ?? [])].filter((item) => item.status === "approved").length;
  const draftCount = [...(modules ?? []), ...(inverters ?? []), ...(batteries ?? [])].filter((item) => item.status === "draft").length;

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering · Technical master data</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Equipment Library</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">Governed manufacturer specifications used by PV, inverter and BESS sizing. Technical profiles can be corrected and maintained here; edits to approved electrical data require re-approval.</p>
          </div>
          <Link href="/dashboard/engineering" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering intake</Link>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.created ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Technical library record saved.</div> : null}
      {messages.updated ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Equipment profile updated and recorded in the audit trail.</div> : null}

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Manufacturers", manufacturers?.length ?? 0],
          ["PV modules", modules?.length ?? 0],
          ["Inverters", inverters?.length ?? 0],
          ["Batteries", batteries?.length ?? 0],
          ["Approved / Draft", `${approvedCount} / ${draftCount}`],
        ].map(([label, value]) => (
          <article key={label} className="bg-[var(--background)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
            <p className="mt-4 text-2xl font-medium tabular-nums">{value}</p>
          </article>
        ))}
      </section>

      <EquipmentWorkspace
        initialTab={activeTab}
        manufacturers={manufacturers ?? []}
        modules={modules ?? []}
        inverters={inverters ?? []}
        batteries={batteries ?? []}
        compatibility={compatibility ?? []}
      />
    </div>
  );
}
