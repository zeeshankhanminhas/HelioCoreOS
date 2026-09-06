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
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="app-panel">
        <div className="app-toolbar flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">Technical master data</p>
            <h1 className="app-title mt-1">Equipment library</h1>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Governed manufacturer data used by HelioCalc, detailed design, SLD and BOM.</p>
          </div>
          <Link href="/dashboard/engineering" className="inline-flex min-h-9 w-fit items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Back to engineering</Link>
        </div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Manufacturers", manufacturers?.length ?? 0],
            ["PV modules", modules?.length ?? 0],
            ["Inverters / PCS", inverters?.length ?? 0],
            ["Batteries / BESS", batteries?.length ?? 0],
            ["Approved / Draft", `${approvedCount} / ${draftCount}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-3">
              <p className="app-kicker">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {messages.error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.created ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Technical library record saved.</div> : null}
      {messages.updated ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Equipment profile updated and recorded in the audit trail.</div> : null}

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
