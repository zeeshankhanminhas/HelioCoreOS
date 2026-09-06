"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Command", items: [{ href: "/dashboard", label: "Overview" }, { href: "/dashboard/tasks", label: "Tasks" }] },
  { label: "Pre-contract", items: [{ href: "/dashboard/opportunities", label: "Opportunities" }, { href: "/dashboard/customers", label: "Customers" }, { href: "/dashboard/sites", label: "Sites" }] },
  { label: "Engineering", items: [{ href: "/dashboard/engineering", label: "Engineering" }, { href: "/dashboard/engineering/equipment", label: "Equipment library" }] },
  { label: "Delivery", items: [{ href: "/dashboard/projects", label: "Projects" }] },
  { label: "Administration", items: [{ href: "/dashboard/team", label: "Team & access" }] },
];

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  opportunities: "Opportunities",
  customers: "Customers",
  sites: "Sites",
  projects: "Projects",
  engineering: "Engineering",
  equipment: "Equipment library",
  calculators: "Calculator",
  "load-profiles": "Load Profile",
  team: "Team & access",
  new: "Create",
  edit: "Edit",
};

const sectionLabels: Record<string, string> = {
  tasks: "Command",
  opportunities: "Pre-contract",
  customers: "Pre-contract",
  sites: "Pre-contract",
  engineering: "Engineering",
  projects: "Delivery",
  team: "Administration",
};

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2";

type WorkspaceShellProps = {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  organisationName: string;
  signOutAction: () => Promise<void>;
};

type Crumb = { href: string; label: string; current?: boolean };

function readableSegment(segment: string) {
  if (routeLabels[segment]) return routeLabels[segment];
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return "Record";
  return decodeURIComponent(segment).replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const moduleName = segments[1];
  const crumbs: Crumb[] = [{ href: "/dashboard", label: "Home" }];

  if (moduleName && sectionLabels[moduleName]) crumbs.push({ href: "/dashboard", label: sectionLabels[moduleName] });

  let path = "";
  segments.forEach((segment) => {
    path += `/${segment}`;
    if (segment === "dashboard") return;
    crumbs.push({ href: path, label: readableSegment(segment) });
  });

  return crumbs.map((crumb, index) => ({ ...crumb, current: index === crumbs.length - 1 }));
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5" aria-label="Primary navigation">
      {navigation.map((group) => {
        const matches = group.items.filter((item) => item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
        const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
        return (
          <section key={group.label}>
            <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block border-l-2 px-3 py-2 text-[13px] transition-colors ${focus} ${active ? "border-[var(--accent)] bg-white/8 font-semibold text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

function PageContext() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  return (
    <div className="flex min-h-10 items-center border-b border-[var(--line)] bg-white px-5 md:px-7 lg:px-8">
      <nav aria-label="Breadcrumb" className="min-w-0 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-[11px] text-[var(--muted)]">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.href}-${crumb.label}-${index}`} className="flex items-center gap-2">
              {index ? <span aria-hidden="true" className="text-[var(--line-strong)]">/</span> : null}
              {crumb.current ? <span aria-current="page" className="font-semibold text-[var(--foreground)]">{crumb.label}</span> : <Link href={crumb.href} className={`hover:text-[var(--foreground)] ${focus}`}>{crumb.label}</Link>}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

export function WorkspaceShell({ children, userName, userRole, organisationName, signOutAction }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = userName.slice(0, 2).toUpperCase();

  const identity = (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-[10px] font-bold text-slate-200">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-100">{userName}</p>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.12em] text-slate-500">{userRole}</p>
        </div>
        <form action={signOutAction}><button type="submit" className={`text-[10px] font-semibold text-slate-500 hover:text-slate-200 ${focus}`}>Exit</button></form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="hidden bg-[var(--sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-white/10 px-4 py-4">
          <Link href="/dashboard" className={`block ${focus}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold tracking-[-0.02em] text-white">HelioCoreOS</span>
              <span className="border border-amber-500/40 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-amber-400">EPC</span>
            </div>
          </Link>
          <p className="mt-2 truncate text-[10px] text-slate-500">{organisationName}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4"><Navigation /></div>
        {identity}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/35" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(86vw,300px)] flex-col bg-[var(--sidebar)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div><p className="text-sm font-bold text-white">HelioCoreOS</p><p className="mt-1 text-[10px] text-slate-500">{organisationName}</p></div>
              <button onClick={() => setMobileOpen(false)} className={`text-xs text-slate-400 ${focus}`}>Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
            {identity}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--line)] bg-white px-5 md:px-7 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className={`border border-[var(--line)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] lg:hidden ${focus}`}>Menu</button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-[var(--foreground)]">{organisationName}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.13em] text-[var(--muted)]">Engineering operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
            <span className="hidden sm:inline">Pre-contract → Engineering → Contract → Delivery</span>
            <span className="h-4 w-px bg-[var(--line)]" />
            <span className="font-semibold text-[var(--foreground)]">{initials}</span>
          </div>
        </header>
        <PageContext />
        <main className="px-4 py-5 md:px-6 md:py-6 lg:px-7 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
