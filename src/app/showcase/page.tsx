import Link from "next/link";
import {
  Archive,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileChartColumn,
  FileText,
  FolderKanban,
  Grid3X3,
  HardHat,
  History,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Upload,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

const workflow = [
  ["Site data", "complete"],
  ["Survey", "complete"],
  ["System sizing", "complete"],
  ["PV layout", "current"],
  ["Electrical", "next"],
  ["BESS design", "next"],
  ["BOM", "next"],
  ["Design review", "next"],
  ["IFC", "next"],
] as const;

const navigation = [
  [LayoutDashboard, "Dashboard"],
  [FileChartColumn, "Pre-sales"],
  [FolderKanban, "Projects"],
  [Wrench, "Engineering", "active"],
  [PackageCheck, "Procurement"],
  [HardHat, "Construction"],
  [ClipboardCheck, "Commissioning"],
  [Zap, "Operations"],
  [Users, "Clients & contacts"],
  [BarChart3, "Reports"],
  [FileText, "Documents"],
  [Archive, "Equipment library"],
  [Settings, "Settings"],
] as const;

const checklist = [
  ["Layout respects usable area and setbacks", true],
  ["Row spacing and access roads verified", true],
  ["Shading analysis completed", true],
  ["Inverter and BESS locations confirmed", true],
  ["Export drawings and screenshots", false],
  ["Internal QA review", false],
] as const;

function AppButton({ children, primary = false }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      disabled
      title="Read-only product showcase"
      className={`inline-flex min-h-9 cursor-not-allowed items-center justify-center gap-2 rounded-[4px] px-3 text-[11px] font-semibold opacity-90 ${
        primary
          ? "bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(89,47,0,.16)]"
          : "border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function SolarSitePlan() {
  return (
    <div className="relative h-full min-h-[350px] overflow-hidden bg-[#a6a28f]">
      <svg viewBox="0 0 980 520" role="img" aria-label="PV layout model showing solar arrays across the Riverside manufacturing site" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="panels" width="19" height="11" patternUnits="userSpaceOnUse">
            <rect width="17" height="9" rx="1" fill="#233e52" stroke="#8197a4" strokeWidth=".65" />
            <path d="M8.5 0v9" stroke="#607e91" strokeWidth=".45" />
          </pattern>
          <pattern id="ground" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M0 4L46 0M0 17L46 13M0 30L46 26M0 43L46 39" stroke="#b7b29d" strokeWidth="2" opacity=".7" />
          </pattern>
          <filter id="soft-shadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".24" /></filter>
        </defs>
        <rect width="980" height="520" fill="#aba791" />
        <rect width="980" height="520" fill="url(#ground)" />
        <path d="M0 70L980 132V175L0 110Z" fill="#77786c" />
        <path d="M0 79L980 141" stroke="#ded9c8" strokeWidth="4" strokeDasharray="18 20" opacity=".8" />
        <path d="M78 132L918 188L868 494L37 425Z" fill="#c5c0aa" stroke="#e7e1cf" strokeWidth="10" />
        <path d="M326 152L756 178L737 273L307 243Z" fill="#deddd7" stroke="#f1efe9" strokeWidth="6" filter="url(#soft-shadow)" />
        <path d="M350 167L721 189L713 222L342 201Z" fill="#bcbdb9" />
        <g transform="rotate(4 490 330)" filter="url(#soft-shadow)">
          <rect x="92" y="252" width="744" height="41" rx="3" fill="url(#panels)" />
          <rect x="87" y="302" width="756" height="41" rx="3" fill="url(#panels)" />
          <rect x="83" y="352" width="762" height="41" rx="3" fill="url(#panels)" />
          <rect x="79" y="402" width="642" height="41" rx="3" fill="url(#panels)" />
        </g>
        <path d="M73 235L852 288M67 346L839 400" stroke="#eee9d9" strokeWidth="9" opacity=".9" />
        <g fill="#cf5b3c" stroke="#fff" strokeWidth="2">
          <rect x="747" y="409" width="30" height="52" rx="2" />
          <rect x="783" y="412" width="30" height="52" rx="2" />
        </g>
        <path d="M58 215L875 270L844 474L47 407Z" fill="none" stroke="#f7f2e4" strokeWidth="3" strokeDasharray="12 8" />
        <g fill="#718268"><circle cx="60" cy="168" r="16"/><circle cx="94" cy="181" r="12"/><circle cx="885" cy="221" r="18"/><circle cx="867" cy="367" r="14"/><circle cx="176" cy="464" r="17"/></g>
      </svg>

      <div className="absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-[#172027]/85 text-[9px] font-bold text-white shadow-lg">
        <span className="absolute top-1">N</span><ChevronDown className="mt-2 h-3.5 w-3.5 rotate-180 text-[var(--accent)]" />
      </div>
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-[4px] border border-white/30 bg-[#172027]/85 text-[10px] font-semibold text-white">
        <span className="bg-[var(--accent)] px-3 py-2">3D</span><span className="px-3 py-2">Top</span><span className="px-3 py-2">North</span>
      </div>
      <div className="absolute bottom-3 left-3 rounded-[4px] bg-[#172027]/90 p-3 text-[10px] text-white shadow-lg">
        {[["#4ea4d6","PV modules"],["#66b781","Inverter / skid"],["#ec745e","BESS container"],["#e483b1","Site boundary"]].map(([color,label]) => (
          <div key={label} className="flex items-center gap-2 py-0.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</div>
        ))}
      </div>
      <span className="absolute bottom-3 right-3 text-sm font-bold text-white drop-shadow">HelioCore Model</span>
    </div>
  );
}

function SectionHead({ children, action }: { children: React.ReactNode; action?: string }) {
  return <div className="flex min-h-10 items-center justify-between border-b border-[var(--line)] px-3"><h2 className="text-[12px] font-bold">{children}</h2>{action && <span className="text-[10px] font-semibold text-[var(--muted)]">{action}</span>}</div>;
}

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-[#eeede9] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-[1920px] bg-[var(--canvas)] shadow-[0_0_45px_rgba(28,27,24,.08)]">
        <aside className="hidden w-[224px] shrink-0 flex-col bg-[#162026] text-[#dfe5e6] lg:flex">
          <div className="flex h-[68px] items-center gap-3 border-b border-white/10 px-4">
            <Sun className="h-8 w-8 text-[#f18121]" strokeWidth={1.6} />
            <div><p className="text-[20px] font-bold tracking-[-.04em]">HelioCore <span className="text-[#f18121]">OS</span></p><p className="text-[10px] text-white/55">Solar EPC Operating System</p></div>
          </div>
          <nav aria-label="Product modules" className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(([Icon,label,state]) => (
              <div key={label} className={`flex min-h-10 items-center gap-3 rounded-[4px] px-3 text-[12px] ${state === "active" ? "bg-[#f4760b] font-semibold text-white" : "text-white/72"}`}>
                <Icon className="h-4 w-4" strokeWidth={1.7} /><span className="flex-1">{label}</span>{label === "Projects" && <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            ))}
          </nav>
          <div className="relative min-h-[178px] overflow-hidden border-t border-white/10 bg-[linear-gradient(165deg,#253840,#162026_45%,#11191d)] p-4">
            <Sun className="absolute -bottom-10 -right-7 h-36 w-36 text-[#f18121]/10" strokeWidth={.5} />
            <p className="absolute bottom-8 left-4 text-[12px] leading-5 text-white/85">Cleaner energy<br />Brighter possibilities</p>
            <span className="absolute bottom-4 left-4 h-[3px] w-6 bg-[#f18121]" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[56px] items-center gap-4 border-b border-[var(--line)] bg-white/75 px-4 backdrop-blur md:px-5">
            <PanelLeftClose className="h-5 w-5 text-[var(--muted)] lg:hidden" />
            <div className="flex h-9 w-full max-w-[475px] items-center gap-2 rounded-[4px] border border-[var(--line)] bg-white px-3 text-[12px] text-[var(--muted)]"><Search className="h-4 w-4" />Search projects, clients, documents…</div>
            <div className="ml-auto flex items-center gap-3"><Bell className="h-4 w-4" /><span className="hidden h-8 w-px bg-[var(--line)] sm:block" /><span className="grid h-8 w-8 place-items-center rounded-full bg-[#263039] text-[10px] font-bold text-white">ZM</span><div className="hidden md:block"><p className="text-[11px] font-semibold">Zeeshan Minhas</p><p className="text-[9px] text-[var(--muted)]">Business development</p></div><ChevronDown className="hidden h-4 w-4 md:block" /></div>
          </header>

          <div className="px-3 py-3 md:px-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] text-[var(--muted)]"><span>Projects</span><ChevronRight className="h-3 w-3" /><span>HC-2026-014</span></div>
                <h1 className="text-[23px] font-bold tracking-[-.035em]">Riverside Manufacturing Facility</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--muted)]">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Faisalabad, Pakistan</span><span className="text-[var(--line-strong)]">|</span><span>Industrial</span><span className="text-[var(--line-strong)]">|</span><span>Hybrid (PV + BESS)</span><span className="text-[var(--line-strong)]">|</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#f3a500]" />Design development</span><span className="rounded-[3px] bg-[#e4f1e8] px-2 py-1 font-bold text-[#27633c]">Rev. B</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2"><AppButton><Grid3X3 className="h-3.5 w-3.5" />Project overview</AppButton><AppButton><FileText className="h-3.5 w-3.5" />Open documents</AppButton><AppButton><History className="h-3.5 w-3.5" />Revision history</AppButton></div>
            </div>

            <ol aria-label="Project workflow" className="mt-4 grid min-w-[760px] grid-cols-9 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[#e8e9e8]">
              {workflow.map(([label,state],index) => (
                <li key={label} className={`flex min-h-10 items-center justify-center gap-2 border-r border-white/70 px-2 text-[10px] last:border-0 ${state === "current" ? "bg-[#ffd7b3] font-bold text-[#6b3000]" : ""}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold ${state === "complete" ? "bg-[#1b966c] text-white" : state === "current" ? "border-2 border-[#f4760b] bg-white text-[#8e3e00]" : "bg-[#aeb3b8] text-white"}`}>{state === "complete" ? <Check className="h-3 w-3" /> : index + 1}</span><span className="hidden xl:inline">{label}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 grid gap-3 2xl:grid-cols-[258px_minmax(560px,1fr)_298px]">
              <aside className="border border-[var(--line)] bg-[var(--background)]">
                <SectionHead action="Edit">Design basis &amp; constraints</SectionHead>
                <div className="space-y-4 p-3 text-[10px]">
                  {[
                    ["Site information", [["Site area","12.6 acres"],["Usable area","8.4 acres"],["Latitude","31.450° N"],["Longitude","73.135° E"],["Ground elevation","184 m"]]],
                    ["PV module", [["Module type","Jinko JKM-580N"],["Module power","580 Wp"],["Dimensions","2,278 × 1,134 mm"]]],
                    ["Mounting system", [["Type","Fixed tilt"],["Tilt angle","20°"],["Azimuth","180° (South)"],["Row spacing","5.8 m"],["Foundation","Ground mount"]]],
                  ].map(([heading,items]) => <section key={heading as string}><h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold"><SlidersHorizontal className="h-3.5 w-3.5" />{heading as string}</h3><dl className="space-y-1.5 pl-5">{(items as string[][]).map(([key,value]) => <div key={key} className="flex justify-between gap-3"><dt className="text-[var(--muted)]">{key}</dt><dd className="text-right font-medium tabular-nums">{value}</dd></div>)}</dl></section>)}
                  <section className="border-t border-[var(--line)] pt-3"><h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#9a5b08]"><ShieldCheck className="h-3.5 w-3.5" />Key constraints</h3><ul className="space-y-1.5 pl-5">{["5 m boundary setback","Drainage channel kept clear","Existing utilities corridor protected","Future expansion area reserved"].map((item,index)=><li key={item} className="flex items-center justify-between gap-2"><span>{item}</span><span className={`grid h-3.5 w-3.5 place-items-center rounded-full text-white ${index < 2 ? "bg-[#cf4339]" : "bg-[#1b966c]"}`}><Check className="h-2.5 w-2.5" /></span></li>)}</ul></section>
                </div>
              </aside>

              <section className="min-w-0 space-y-3">
                <article className="border border-[var(--line)] bg-[var(--background)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] p-3"><div><h2 className="text-[15px] font-bold">PV layout design</h2><p className="mt-0.5 text-[10px] text-[var(--muted)]">3D site model with PV array layout · SketchUp / Trimble</p></div><div className="flex gap-2"><AppButton><Upload className="h-3.5 w-3.5" />Upload revision</AppButton><AppButton><History className="h-3.5 w-3.5" />Compare</AppButton><AppButton><MoreHorizontal className="h-3.5 w-3.5" /></AppButton></div></div>
                  <div className="h-[390px]"><SolarSitePlan /></div>
                  <div className="grid grid-cols-6 gap-2 border-t border-[var(--line)] bg-[#f7f6f2] p-2">
                    {["3D view","Top view","East elevation","West elevation","Array detail","Shading analysis"].map((item,index)=><div key={item} className={`flex h-12 items-end rounded-[3px] border p-1.5 text-[9px] font-semibold ${index===0 ? "border-[var(--accent)] bg-[#fff4e9]" : "border-[var(--line)] bg-white"}`}><span>{item}</span></div>)}
                  </div>
                </article>
                <div className="grid gap-3 md:grid-cols-2">
                  <article className="border border-[var(--line)] bg-[var(--background)]"><SectionHead>Design extraction <span className="font-normal text-[var(--muted)]">(from model)</span></SectionHead><dl className="grid grid-cols-2 text-[10px]">{[["PV capacity","8,480 kWp"],["DC/AC ratio","1.41"],["Total modules","14,621"],["Row count","142"],["Total strings","604"],["Module tilt","20°"],["Inverter capacity","6,000 kW"],["Estimated yield","13,420 MWh/year"]].map(([k,v])=><div key={k} className="border-b border-r border-[var(--line)] p-3"><dt className="text-[var(--muted)]">{k}</dt><dd className="mt-1 text-[12px] font-bold tabular-nums">{v}</dd></div>)}</dl></article>
                  <article className="border border-[var(--line)] bg-[var(--background)]"><SectionHead action="Open document manager">Design artifacts</SectionHead><div className="divide-y divide-[var(--line)] text-[10px]">{[["PV layout model (SKP)","B","For review"],["Layout drawings (PDF)","B","For review"],["Shading analysis","A","Approved"],["Array spacing report","A","Approved"]].map(([doc,rev,status])=><div key={doc} className="grid grid-cols-[1fr_24px_70px] items-center gap-2 px-3 py-2.5"><span className="font-medium">{doc}</span><span>{rev}</span><span className={`rounded-[3px] px-1.5 py-1 text-center font-semibold ${status==="Approved" ? "bg-[#e4f1e8] text-[#27633c]" : "bg-[#fff1d8] text-[#915508]"}`}>{status}</span></div>)}</div></article>
                </div>
              </section>

              <aside className="space-y-3">
                <article className="border border-[var(--line)] bg-[var(--background)] p-3"><h2 className="text-[12px] font-bold">Current action</h2><div className="mt-3 flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-[var(--accent)] text-white"><ClipboardCheck className="h-5 w-5" /></span><div><p className="text-[12px] font-bold">Complete PV layout review</p><p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">Validate spacing, setbacks and shading analysis.</p></div></div><div className="mt-3"><AppButton primary>Submit layout for review</AppButton></div></article>
                <article className="border border-[var(--line)] bg-[var(--background)]"><SectionHead action="4 of 6 complete">Review checklist</SectionHead><div className="flex gap-1 px-3 pt-3">{checklist.map(([label,done])=><span key={label} className={`h-1 flex-1 rounded-full ${done ? "bg-[#178e68]" : "bg-[#d9dad7]"}`} />)}</div><ul className="p-3">{checklist.map(([label,done])=><li key={label} className="flex min-h-7 items-center gap-2 text-[10px]"><span className={`grid h-4 w-4 place-items-center rounded-full border ${done ? "border-[#178e68] bg-[#178e68] text-white" : "border-[#8c9293]"}`}>{done && <Check className="h-3 w-3" />}</span>{label}</li>)}</ul></article>
                <article className="border border-[var(--line)] bg-[var(--background)]"><SectionHead>Design authority</SectionHead><div className="space-y-2 p-3 text-[10px]">{[["Prepared by","A. Khan","12 Sep 2026"],["Reviewed by","M. Ali","—"],["Approved by","S. Rahman","—"]].map(([role,name,date])=><div key={role} className="grid grid-cols-[78px_1fr_auto] gap-2"><span className="text-[var(--muted)]">{role}</span><span className="font-medium">{name}</span><span>{date}</span></div>)}</div></article>
                <article className="border border-[var(--line)] bg-[var(--background)]"><SectionHead action="View all">Revision history</SectionHead><div className="divide-y divide-[var(--line)] p-3 text-[10px]">{[["Rev. B","For review","Updated array layout and inverter location"],["Rev. A","Approved","Initial design version"],["Rev. 0","Draft","Concept layout"]].map(([rev,status,note])=><div key={rev} className="py-2 first:pt-0"><div className="flex items-center gap-2"><b>{rev}</b><span className="rounded-[3px] bg-[#f2eee7] px-1.5 py-0.5">{status}</span><span className="ml-auto text-[var(--muted)]">12 Sep</span></div><p className="mt-1 text-[var(--muted)]">{note}</p></div>)}</div></article>
              </aside>
            </div>

            <section className="mt-3 border border-[var(--line)] bg-[var(--background)] p-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="min-w-[230px]"><h2 className="text-[12px] font-bold">Downstream dependencies</h2><p className="text-[9px] text-[var(--muted)]">This decision releases the following stages</p></div><div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">{[[Zap,"Electrical design"],[BarChart3,"Yield simulation"],[Boxes,"BOM & procurement"],[FileText,"Proposal & commercial"]].map(([Icon,label])=><div key={label as string} className="flex min-h-11 items-center gap-2 border border-[var(--line)] px-3 text-[10px] font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eaf2f9] text-[#327ab3]"><Icon className="h-4 w-4" /></span>{label as string}<ChevronRight className="ml-auto h-3 w-3 text-[#327ab3]" /></div>)}</div></div></section>
            <footer className="flex flex-wrap items-center justify-between gap-3 py-4 text-[9px] text-[var(--muted)]"><span>Read-only product showcase · Representative project data</span><Link href="/" className="font-semibold text-[var(--foreground)]">Return to HelioCoreOS</Link></footer>
          </div>
        </div>
      </div>
    </main>
  );
}
