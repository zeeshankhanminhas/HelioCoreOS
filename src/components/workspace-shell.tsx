"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Overview", mark: "01" },
      { href: "/dashboard/tasks", label: "Tasks", mark: "02" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/opportunities", label: "Opportunities", mark: "03" },
      { href: "/dashboard/customers", label: "Customers", mark: "04" },
      { href: "/dashboard/sites", label: "Sites", mark: "05" },
    ],
  },
  {
    label: "Delivery",
    items: [{ href: "/dashboard/projects", label: "Projects", mark: "06" }],
  },
  {
    label: "Administration",
    items: [{ href: "/dashboard/team", label: "Team & access", mark: "07" }],
  },
];

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  opportunities: "Opportunities",
  customers: "Customers",
  sites: "Sites",
  projects: "Projects",
  team: "Team & access",
  new: "Create",
};

// These labels are navigation domains only. They organise modules but are not routes or modules themselves.
const domainLabels: Record<string, string> = {
  tasks: "Command",
  opportunities: "Sales",
  customers: "Sales",
  sites: "Sales",
  projects: "Delivery",
  team: "Administration",
};

const contextualActions: Record<string, { href: string; label: string }> = {
  "/dashboard/opportunities": { href: "/dashboard/opportunities/new", label: "Create opportunity" },
  "/dashboard/customers": { href: "/dashboard/customers/new", label: "Create customer" },
  "/dashboard/sites": { href: "/dashboard/sites/new", label: "Create site" },
  "/dashboard/projects": { href: "/dashboard/projects/new", label: "Create project" },
};

type WorkspaceShellProps = {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  organisationName: string;
  signOutAction: () => Promise<void>;
};

type Crumb = { href?: string; label: string; current?: boolean; kind?: "route" | "domain" };

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

function readableSegment(segment: string) {
  if (routeLabels[segment]) return routeLabels[segment];
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return "Record";
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const moduleName = segments[1];
  const crumbs: Crumb[] = [{ href: "/dashboard", label: "Dashboard", kind: "route" }];

  if (moduleName && domainLabels[moduleName]) {
    crumbs.push({ label: domainLabels[moduleName], kind: "domain" });
  }

  let path = "";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    if (segment === "dashboard" || (index === 1 && domainLabels[segment])) return;
    crumbs.push({ href: path, label: readableSegment(segment), kind: "route" });
  });

  const lastRouteIndex = crumbs.map((crumb) => crumb.kind).lastIndexOf("route");
  return crumbs.map((crumb, index) => ({ ...crumb, current: index === lastRouteIndex }));
}

function getParentPath(pathname: string) {
  if (pathname === "/dashboard") return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 2) return "/dashboard";
  return `/${segments.slice(0, -1).join("/")}`;
}

function getContextAction(pathname: string) {
  if (contextualActions[pathname]) return contextualActions[pathname];
  if (pathname.startsWith("/dashboard/opportunities/")) {
    return { href: "/dashboard/opportunities", label: "Back to opportunities" };
  }
  if (pathname.startsWith("/dashboard/customers/")) {
    return { href: "/dashboard/customers", label: "Back to customers" };
  }
  if (pathname.startsWith("/dashboard/sites/")) {
    return { href: "/dashboard/sites", label: "Back to sites" };
  }
  if (pathname.startsWith("/dashboard/projects/")) {
    return { href: "/dashboard/projects", label: "Back to projects" };
  }
  return null;
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-7" aria-label="Primary navigation">
      {navigation.map((group) => (
        <section key={group.label} aria-labelledby={`nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}>
          <p
            id={`nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center justify-between border-l-2 px-3 py-2.5 text-sm transition-colors ${focus} ${
                    active
                      ? "border-[var(--accent)] bg-white/55 font-medium"
                      : "border-transparent text-[var(--muted)] hover:bg-white/40 hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[10px] tabular-nums ${active ? "text-[var(--accent)]" : "opacity-35"}`}>
                    {item.mark}
                  </span>
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
  const parentPath = getParentPath(pathname);
  const action = getContextAction(pathname);

  return (
    <div className="border-b border-[var(--line)] bg-[var(--background)] px-5 py-3 md:px-8 lg:px-10 xl:px-12">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb" className="min-w-0 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 text-xs text-[var(--muted)]">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {index ? <span aria-hidden="true">/</span> : null}
                {crumb.kind === "domain" ? (
                  <span aria-label={`${crumb.label} navigation group`} className="uppercase tracking-[0.12em] text-[var(--muted)]">
                    {crumb.label}
                  </span>
                ) : crumb.current ? (
                  <span aria-current="page" className="font-semibold text-[var(--foreground)]">
                    {crumb.label}
                  </span>
                ) : crumb.href ? (
                  <Link href={crumb.href} className={`hover:text-[var(--foreground)] ${focus}`}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {parentPath && !action ? (
            <Link href={parentPath} className={`border border-[var(--line)] px-3 py-2 text-xs font-semibold ${focus}`}>
              Back
            </Link>
          ) : null}
          {action ? (
            <Link href={action.href} className={`border border-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent)] ${focus}`}>
              {action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children, userName, userRole, organisationName, signOutAction }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const identity = (
    <div className="border-t border-[var(--line)] px-7 py-6">
      <p className="truncate text-sm font-semibold">{userName}</p>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{organisationName}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{userRole}</span>
        <form action={signOutAction}>
          <button type="submit" className={`text-xs font-medium text-[var(--muted)] ${focus}`}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--line)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-[var(--line)] px-7 py-7">
          <Link href="/dashboard" className={`block text-xl font-semibold tracking-[-0.03em] ${focus}`}>
            HelioCoreOS
          </Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Solar EPC command system
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Navigation />
        </div>
        {identity}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/25" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(88vw,340px)] flex-col bg-[var(--background)] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--line)] px-6 py-6">
              <div>
                <p className="text-xl font-semibold">HelioCoreOS</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">EPC command</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className={`px-2 py-1 text-sm text-[var(--muted)] ${focus}`}>
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <Navigation onNavigate={() => setMobileOpen(false)} />
            </div>
            {identity}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color:var(--background)]/95 px-5 backdrop-blur md:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className={`border border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] lg:hidden ${focus}`}
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{organisationName}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Live workspace</p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
            {userName.slice(0, 2).toUpperCase()}
          </div>
        </header>
        <PageContext />
        <main className="px-5 py-7 md:px-8 md:py-9 lg:px-10 xl:px-12">{children}</main>
      </div>
    </div>
  );
}
