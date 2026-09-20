import Link from "next/link";

const stages = [
  { label: "Opportunity", state: "complete" },
  { label: "Site survey", state: "complete" },
  { label: "System sizing", state: "complete" },
  { label: "PV layout", state: "current" },
  { label: "Electrical", state: "next" },
  { label: "BESS", state: "next" },
  { label: "BOM", state: "next" },
  { label: "IFC release", state: "next" },
] as const;

const handoffs = [
  ["Commercial", "Opportunity qualified", "18 Sep · 09:42", "Complete"],
  ["Survey", "Site evidence accepted", "18 Sep · 14:16", "Complete"],
  ["Engineering", "PV layout under review", "Today · 11:30", "In review"],
  ["Procurement", "Awaiting approved BOM", "Blocked", "Waiting"],
] as const;

const metrics = [
  ["DC capacity", "612.0", "kWp"],
  ["Module count", "1,080", "modules"],
  ["DC/AC ratio", "1.18", "ratio"],
  ["Annual yield", "934", "MWh"],
] as const;

function StatusMark({ state }: { state: "complete" | "current" | "next" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${
        state === "complete"
          ? "border-[var(--status-success)] bg-[var(--status-success)] text-white"
          : state === "current"
            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
            : "border-[var(--line-strong)] bg-[var(--background)] text-[var(--text-tertiary)]"
      }`}
    >
      {state === "complete" ? "✓" : state === "current" ? "4" : "·"}
    </span>
  );
}

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:var(--canvas)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-6 px-5 md:px-8">
          <div className="flex items-center gap-5">
            <Link href="/" className="font-semibold tracking-[-0.025em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
              HelioCoreOS
            </Link>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:inline">Workflow showcase</span>
          </div>
          <nav aria-label="Showcase sections" className="hidden items-center gap-5 text-xs text-[var(--muted)] md:flex">
            <a href="#overview" className="hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">Overview</a>
            <a href="#engineering" className="hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">Engineering</a>
            <a href="#handoff" className="hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">Handoff</a>
          </nav>
          <Link href="/login" className="inline-flex min-h-10 items-center border border-[var(--foreground)] px-4 text-xs font-semibold hover:bg-[var(--foreground)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
            Open workspace
          </Link>
        </div>
      </header>

      <section id="overview" className="mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line)] pb-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <p className="app-kicker text-[var(--accent)]">Project HC-2407 · Riverside Foods</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.05em] md:text-6xl">One governed path from site evidence to an approved engineering package.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">HelioCoreOS replaces disconnected spreadsheets, drawings and approvals with a visible operating sequence. Every handoff has an owner, evidence and a controlled next action.</p>
          </div>
          <aside className="border-l-2 border-[var(--accent)] pl-5">
            <p className="app-kicker">Current decision</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.025em]">Review PV layout revision R03</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Confirm roof setbacks and string allocation before electrical design can begin.</p>
          </aside>
        </div>

        <div className="mt-8 overflow-x-auto border-y border-[var(--line)] bg-[var(--background)]">
          <ol className="grid min-w-[1040px] grid-cols-8">
            {stages.map((stage, index) => (
              <li key={stage.label} className="relative border-r border-[var(--line)] px-4 py-4 last:border-r-0">
                <div className="flex items-center gap-3">
                  <StatusMark state={stage.state} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{String(index + 1).padStart(2, "0")}</p>
                    <p className={`mt-0.5 text-xs font-semibold ${stage.state === "current" ? "text-[var(--accent-text)]" : ""}`}>{stage.label}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="engineering" className="mx-auto grid max-w-[1600px] gap-6 px-5 pb-12 md:px-8 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <aside className="app-panel self-start">
          <div className="app-toolbar px-4 py-3">
            <p className="app-kicker">Design basis</p>
            <p className="mt-1 text-sm font-semibold">Locked project inputs</p>
          </div>
          <dl className="divide-y divide-[var(--line)] px-4">
            {[
              ["Location", "Doncaster, UK"],
              ["System", "Grid-tied rooftop PV"],
              ["Utility limit", "520 kW AC"],
              ["Module", "Jinko 567 Wp"],
              ["Inverter", "Sungrow SG125CX"],
              ["Design standard", "BS 7671 · IEC 62548"],
            ].map(([label, value]) => (
              <div key={label} className="py-3.5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="space-y-6">
          <article className="app-panel overflow-hidden">
            <div className="app-toolbar flex min-h-14 items-center justify-between gap-4 px-4">
              <div>
                <p className="app-kicker">PV layout · Revision R03</p>
                <p className="mt-1 text-sm font-semibold">Roof zone allocation</p>
              </div>
              <span className="border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-text)]">For review</span>
            </div>
            <div className="relative min-h-[390px] overflow-hidden bg-[#d8d4ca] p-6 md:p-9">
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(var(--line-strong) 1px, transparent 1px), linear-gradient(90deg, var(--line-strong) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="relative mx-auto grid max-w-4xl grid-cols-12 gap-2 border-8 border-[#57544e] bg-[#eeece6] p-5 shadow-[0_12px_35px_rgba(29,28,25,0.12)] [transform:perspective(900px)_rotateX(5deg)_rotateZ(-1.5deg)]">
                {Array.from({ length: 72 }).map((_, index) => (
                  <div key={index} className={`aspect-[1.7/1] border border-[#7790a1] bg-[#334b5d] ${index % 17 === 0 || index % 23 === 0 ? "opacity-20" : ""}`} />
                ))}
              </div>
              <div className="relative mt-8 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                <span className="bg-[var(--background)] px-3 py-2">Setback verified</span>
                <span className="bg-[var(--background)] px-3 py-2">Access path retained</span>
                <span className="bg-[var(--background)] px-3 py-2">2 shading exceptions</span>
              </div>
            </div>
          </article>

          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value, unit]) => (
              <article key={label} className="bg-[var(--background)] p-4">
                <p className="app-kicker">{label}</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{value} <span className="text-xs font-medium text-[var(--muted)]">{unit}</span></p>
              </article>
            ))}
          </div>
        </div>

        <aside className="app-panel self-start xl:sticky xl:top-24">
          <div className="app-toolbar px-4 py-3">
            <p className="app-kicker">Design authority</p>
            <p className="mt-1 text-sm font-semibold">Complete PV layout review</p>
          </div>
          <div className="p-4">
            <div className="border-l-2 border-[var(--status-warning)] bg-[var(--surface-subtle)] px-4 py-3">
              <p className="text-xs font-semibold">2 items require confirmation</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Northern roof setback and string 08 shading exception.</p>
            </div>
            <fieldset className="mt-5 space-y-1">
              <legend className="app-kicker mb-2">Review checklist</legend>
              {["Survey geometry reconciled", "Module zones verified", "Access paths retained", "Exceptions documented"].map((item, index) => (
                <label key={item} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-[var(--line)] text-sm">
                  <input type="checkbox" disabled defaultChecked={index < 3} className="h-4 w-4 accent-[var(--accent)]" />
                  <span>{item}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" disabled title="Read-only showcase" className="mt-5 cursor-not-allowed opacity-55 min-h-11 w-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Submit layout for review</button>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Submission records revision R03 and notifies the assigned design authority.</p>
          </div>
        </aside>
      </section>

      <section id="handoff" className="border-y border-[var(--line)] bg-[var(--background)]">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-12 md:px-8 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="app-kicker text-[var(--accent)]">Controlled handoff</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">Procurement sees a decision, not a folder of files.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">The approved engineering package becomes the source for BOM release. Revision, evidence, exceptions and authority travel with the handoff.</p>
          </div>
          <div className="border border-[var(--line)]">
            <div className="app-toolbar grid grid-cols-[1fr_1.4fr_120px_90px] gap-3 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span>Owner</span><span>Outcome</span><span>When</span><span className="text-right">State</span>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {handoffs.map(([owner, outcome, when, state]) => (
                <div key={owner} className="grid grid-cols-1 gap-1 px-4 py-4 text-sm sm:grid-cols-[1fr_1.4fr_120px_90px] sm:items-center sm:gap-3">
                  <span className="font-semibold">{owner}</span>
                  <span>{outcome}</span>
                  <span className="text-xs tabular-nums text-[var(--muted)]">{when}</span>
                  <span className={`text-xs font-semibold sm:text-right ${state === "Waiting" ? "text-[var(--status-warning)]" : state === "In review" ? "text-[var(--accent-text)]" : "text-[var(--status-success)]"}`}>{state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-8 text-xs text-[var(--muted)] md:flex-row md:items-center md:justify-between md:px-8">
        <p>Designed as a governed Solar EPC operating system—not a generic dashboard.</p>
        <Link href="/" className="font-semibold text-[var(--foreground)] hover:text-[var(--accent-text)]">Return to HelioCoreOS</Link>
      </footer>
    </main>
  );
}
