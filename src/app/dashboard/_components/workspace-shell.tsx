"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Command", items: [
    { href: "/dashboard", label: "Executive overview", mark: "01" },
    { href: "/dashboard/tasks", label: "Action register", mark: "02" },
  ]},
  { label: "Commercial", items: [
    { href: "/dashboard/customers", label: "Customers", mark: "03" },
    { href: "/dashboard/sites", label: "Sites", mark: "04" },
    { href: "/dashboard/opportunities", label: "Opportunities", mark: "05" },
    { href: "/dashboard/projects", label: "Projects", mark: "06" },
  ]},
  { label: "Delivery", items: [
    { href: "/dashboard/engineering", label: "Engineering", mark: "07" },
    { href: "/dashboard/procurement", label: "Procurement", mark: "08" },
    { href: "/dashboard/installation", label: "Installation", mark: "09" },
    { href: "/dashboard/quality", label: "Quality", mark: "10" },
    { href: "/dashboard/commissioning", label: "Commissioning", mark: "11" },
    { href: "/dashboard/handover", label: "Handover", mark: "12" },
  ]},
  { label: "Control", items: [
    { href: "/dashboard/documents", label: "Documents", mark: "13" },
    { href: "/dashboard/reports", label: "Reports", mark: "14" },
    { href: "/dashboard/team", label: "Team & access", mark: "15" },
  ]},
];

type WorkspaceShellProps = { children: React.ReactNode; userName: string; userRole: string; organisationName: string; signOutAction: () => Promise<void>; };
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav className="space-y-7" aria-label="Primary navigation">{navigation.map(group => <section key={group.label}>
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{group.label}</p>
    <div className="space-y-1">{group.items.map(item => {
      const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex items-center justify-between border-l-2 px-3 py-2.5 text-sm transition-colors ${focus} ${active ? "border-[var(--accent)] bg-white/55 font-medium" : "border-transparent text-[var(--muted)] hover:bg-white/40 hover:text-[var(--foreground)]"}`}><span>{item.label}</span><span className={`text-[10px] tabular-nums ${active ? "text-[var(--accent)]" : "opacity-35"}`}>{item.mark}</span></Link>;
    })}</div>
  </section>)}</nav>;
}

export function WorkspaceShell({ children, userName, userRole, organisationName, signOutAction }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const identity = <div className="border-t border-[var(--line)] px-7 py-6"><p className="truncate text-sm font-semibold">{userName}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{organisationName}</p><div className="mt-4 flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{userRole}</span><form action={signOutAction}><button type="submit" className={`text-xs font-medium text-[var(--muted)] ${focus}`}>Sign out</button></form></div></div>;
  return <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="hidden border-r border-[var(--line)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"><div className="border-b border-[var(--line)] px-7 py-7"><Link href="/dashboard" className={`block text-xl font-semibold tracking-[-0.03em] ${focus}`}>HelioCoreOS</Link><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Solar EPC command system</p></div><div className="flex-1 overflow-y-auto px-4 py-6"><Navigation /></div>{identity}</aside>
    {mobileOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/25" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><aside className="relative flex h-full w-[min(88vw,340px)] flex-col bg-[var(--background)] shadow-2xl"><div className="flex items-start justify-between border-b border-[var(--line)] px-6 py-6"><div><p className="text-xl font-semibold">HelioCoreOS</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">EPC command</p></div><button onClick={() => setMobileOpen(false)} className={`px-2 py-1 text-sm text-[var(--muted)] ${focus}`}>Close</button></div><div className="flex-1 overflow-y-auto px-4 py-6"><Navigation onNavigate={() => setMobileOpen(false)} /></div>{identity}</aside></div> : null}
    <div className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color:var(--background)]/95 px-5 backdrop-blur md:px-8 lg:px-10"><div className="flex min-w-0 items-center gap-4"><button onClick={() => setMobileOpen(true)} className={`border border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] lg:hidden ${focus}`}>Menu</button><div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{organisationName}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Live workspace</p></div></div><div className="flex items-center gap-3"><Link href="/dashboard/opportunities" className={`hidden border border-[var(--line)] px-3 py-2 text-xs font-medium sm:block ${focus}`}>View opportunities</Link><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">{userName.slice(0,2).toUpperCase()}</div></div></header><main className="px-5 py-7 md:px-8 md:py-9 lg:px-10 xl:px-12">{children}</main></div>
  </div>;
}
