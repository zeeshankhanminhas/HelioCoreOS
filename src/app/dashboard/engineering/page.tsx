import { DesignIntake } from "./_components/design-intake";

export default function EngineeringPage() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering core · V1</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-medium tracking-[-0.045em] md:text-5xl">System design intake</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">One shared engineering foundation for On-grid, Off-grid and Hybrid systems. Load profile is mandatory across all three, while system-specific rules branch after the common intake.</p>
          </div>
          <div className="border border-[var(--line)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Build focus:</span> intake → load model → equipment → calculations → validation → BOM
          </div>
        </div>
      </header>

      <div className="mt-7">
        <DesignIntake />
      </div>
    </div>
  );
}
