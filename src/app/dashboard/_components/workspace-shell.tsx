"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Command", items: [{ href: "/dashboard", label: "Overview" }, { href: "/dashboard/tasks", label: "Tasks" }] },
  { label: "Commercial", items: [{ href: "/dashboard/opportunities", label: "Opportunities" }, { href: "/dashboard/customers", label: "Customers" }, { href: "/dashboard/sites", label: "Sites" }] },
  { label: "Delivery", items: [{ href: "/dashboard/projects", label: "Projects" }, { href: "/dashboard/engineering", label: "Engineering" }] },
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
  team: "Team & access",
  new: "Create",
  edit: "Edit",
};

const sectionLabels: Record<string, string> = {
  tasks: "Command",
  opportunities: "Commercial",
  customers: "Commercial",
  sites: "Commercial",
  projects: "Delivery",
  engineering: "Delivery",
  team: "Administration",
};

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

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
  const crumbs: Crumb[] = [{ href: "/dashboard", label: "Dashboard" }];

  if (moduleName && sectionLabels[moduleName]) crumbs.push({ href: `/dashboard/${moduleName}`, label: sectionLabels[moduleName] });

  let path = "";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    if (segment === "dashboard" || (index === 1 && sectionLabels[segment])) return;
    crumbs.push({ href: path, label: readableSegment(segment) });
  });

  return crumbs.map((crumb, index) => ({ ...crumb, current: index === crumbs.length - 1 }));
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-7" aria-label="Primary navigation">
      {navigation.map((group) => (
        <section key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`block border-l-2 px-3 py-2.5 text-sm transition-colors ${focus} ${active ? "border-[var(--accent)] bg-white/55 font-medium text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:bg-white/40 hover:text-[var(--foreground)]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function PageContext() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <div className="border-b border-[var(--line)] bg-[var(--background)] px-5 py-3 md:px-8 lg:px-10 xl:px-12">
      <nav aria-label="Breadcrumb" className="min-w-0 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-xs text-[var(--muted)]">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.href}-${index}`} className="flex items-center gap-2">
              {index ? <span aria-hidden="true">/</span> : null}
              {crumb.current ? (
                <span aria-current="page" className="font-semibold text-[var(--foreground)]">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className={`hover:text-[var(--foreground)] ${focus}`}>{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

export function WorkspaceShell({ children, userName, userRole, organisationName, signOutAction }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const identity = (
    <div className="border-t border-[var(--line)] px-6 py-5">
      <p className="truncate text-sm font-semibold">{userName}</p>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{organisationName}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{userRole}</span>
        <form action={signOutAction}><button type="submit" className={`text-xs font-medium text-[var(--muted)] ${focus}`}>Sign out</button></form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--line)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-[var(--line)] px-6 py-6">
          <Link href="/dashboard" className={`block text-xl font-semibold tracking-[-0.03em] ${focus}`}>HelioCoreOS</Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Solar EPC operating system</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6"><Navigation /></div>
        {identity}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/25" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(88vw,320px)] flex-col bg-[var(--background)] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--line)] px-6 py-6">
              <div><p className="text-xl font-semibold">HelioCoreOS</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">EPC workspace</p></div>
              <button onClick={() => setMobileOpen(false)} className={`px-2 py-1 text-sm text-[var(--muted)] ${focus}`}>Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-6"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
            {identity}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-[color:var(--background)]/95 px-5 backdrop-blur md:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className={`border border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] lg:hidden ${focus}`}>Menu</button>
            <div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{organisationName}</p></div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-[10px] font-semibold text-[var(--background)]">{userName.slice(0, 2).toUpperCase()}</div>
        </header>
        <PageContext />
        <main className="px-5 py-7 md:px-8 md:py-9 lg:px-10 xl:px-12">{children}</main>
      </div>
    </div>
  );
}
