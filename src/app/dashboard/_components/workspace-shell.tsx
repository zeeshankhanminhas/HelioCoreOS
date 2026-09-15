"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const navigation = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Command centre" },
      { href: "/dashboard/tasks", label: "My work" },
      { href: "/dashboard/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/dashboard/opportunities", label: "Opportunities" },
      { href: "/dashboard/customers", label: "Customers" },
      { href: "/dashboard/sites", label: "Sites" },
    ],
  },
  {
    label: "Engineering",
    items: [
      { href: "/dashboard/engineering", label: "Engineering workspace" },
      { href: "/dashboard/engineering/load-profiles", label: "Load profiles" },
      { href: "/dashboard/engineering/calculators", label: "Calculators" },
      { href: "/dashboard/engineering/equipment", label: "Equipment library" },
      { href: "/dashboard/designs", label: "Designs" },
      { href: "/dashboard/drawings", label: "Drawings" },
      { href: "/dashboard/boms", label: "BOMs" },
    ],
  },
  {
    label: "Proposal & contract",
    items: [
      { href: "/dashboard/costing", label: "Costing" },
      { href: "/dashboard/proposals", label: "Proposals" },
      { href: "/dashboard/contracts", label: "Contracts" },
    ],
  },
  {
    label: "Project delivery",
    items: [
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/requisitions", label: "Purchase requisitions" },
      { href: "/dashboard/rfqs", label: "RFQs" },
      { href: "/dashboard/vendor-comparisons", label: "Vendor comparisons" },
      { href: "/dashboard/purchase-orders", label: "Purchase orders" },
      { href: "/dashboard/suppliers", label: "Suppliers" },
      { href: "/dashboard/shipments", label: "Shipments" },
      { href: "/dashboard/grn", label: "Delivery & GRN" },
      { href: "/dashboard/warehouses", label: "Warehouses" },
      { href: "/dashboard/site-stock", label: "Site stock" },
      { href: "/dashboard/material-movements", label: "Material movements" },
      { href: "/dashboard/construction", label: "Construction & installation" },
      { href: "/dashboard/quality", label: "HSE & quality" },
      { href: "/dashboard/commissioning", label: "Commissioning" },
      { href: "/dashboard/handover", label: "Handover" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/budgets", label: "Project budgets" },
      { href: "/dashboard/supplier-invoices", label: "Supplier invoices / AP" },
      { href: "/dashboard/customer-invoices", label: "Customer invoices / AR" },
      { href: "/dashboard/payments", label: "Payments" },
    ],
  },
  {
    label: "Asset operations",
    items: [
      { href: "/dashboard/assets", label: "Assets" },
      { href: "/dashboard/om", label: "O&M" },
      { href: "/dashboard/service-maintenance", label: "Service & maintenance" },
    ],
  },
  {
    label: "Insights & governance",
    items: [
      { href: "/dashboard/reports", label: "Reports & analytics" },
      { href: "/dashboard/documents", label: "Documents" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/team", label: "People & workforce" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

const routeLabels: Record<string, string> = {
  dashboard: "Command centre",
  tasks: "My work",
  approvals: "Approvals",
  opportunities: "Opportunities",
  customers: "Customers",
  sites: "Sites",
  proposals: "Proposals",
  contracts: "Contracts",
  projects: "Projects",
  engineering: "Engineering",
  equipment: "Equipment library",
  calculators: "Calculators",
  "load-profiles": "Load profiles",
  designs: "Designs",
  drawings: "Drawings",
  boms: "BOMs",
  requisitions: "Purchase requisitions",
  rfqs: "RFQs",
  "vendor-comparisons": "Vendor comparisons",
  "purchase-orders": "Purchase orders",
  suppliers: "Suppliers",
  shipments: "Shipments",
  grn: "Delivery & GRN",
  warehouses: "Warehouses",
  "site-stock": "Site stock",
  "material-movements": "Material movements",
  construction: "Construction & installation",
  quality: "HSE & quality",
  commissioning: "Commissioning",
  handover: "Handover",
  budgets: "Project budgets",
  costing: "Costing",
  "supplier-invoices": "Supplier invoices / AP",
  "customer-invoices": "Customer invoices / AR",
  payments: "Payments",
  assets: "Assets",
  om: "O&M",
  "service-maintenance": "Service & maintenance",
  documents: "Documents",
  reports: "Reports & analytics",
  team: "People & workforce",
  settings: "Settings",
  new: "Create",
  edit: "Edit",
};

const sectionLabels: Record<string, string> = {
  tasks: "Command",
  approvals: "Command",
  opportunities: "Commercial",
  customers: "Commercial",
  sites: "Commercial",
  engineering: "Engineering",
  designs: "Engineering",
  drawings: "Engineering",
  boms: "Engineering",
  costing: "Proposal & contract",
  proposals: "Proposal & contract",
  contracts: "Proposal & contract",
  projects: "Project delivery",
  requisitions: "Project delivery",
  rfqs: "Project delivery",
  "vendor-comparisons": "Project delivery",
  "purchase-orders": "Project delivery",
  suppliers: "Project delivery",
  shipments: "Project delivery",
  grn: "Project delivery",
  warehouses: "Project delivery",
  "site-stock": "Project delivery",
  "material-movements": "Project delivery",
  construction: "Project delivery",
  quality: "Project delivery",
  commissioning: "Project delivery",
  handover: "Project delivery",
  budgets: "Finance",
  "supplier-invoices": "Finance",
  "customer-invoices": "Finance",
  payments: "Finance",
  assets: "Asset operations",
  om: "Asset operations",
  "service-maintenance": "Asset operations",
  documents: "Insights & governance",
  reports: "Insights & governance",
  team: "Administration",
  settings: "Administration",
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
  if (pathname === "/dashboard") return [{ href: "/dashboard", label: "Command centre", current: true }];

  const segments = pathname.split("/").filter(Boolean).slice(1);
  const moduleName = segments[0];
  const crumbs: Crumb[] = [{ href: "/dashboard", label: "Command centre" }];
  const section = moduleName ? sectionLabels[moduleName] : undefined;
  const moduleLabel = moduleName ? readableSegment(moduleName) : undefined;

  if (section && section !== moduleLabel) crumbs.push({ href: "/dashboard", label: section });

  let path = "/dashboard";
  segments.forEach((segment) => {
    path += `/${segment}`;
    const label = readableSegment(segment);
    const previous = crumbs[crumbs.length - 1]?.label;
    if (label !== previous) crumbs.push({ href: path, label });
  });

  return crumbs.map((crumb, index) => ({ ...crumb, current: index === crumbs.length - 1 }));
}

function currentGroupLabel(pathname: string) {
  const moduleName = pathname.split("/").filter(Boolean)[1];
  if (!moduleName) return "Command";
  return sectionLabels[moduleName] ?? "Command";
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeGroup = currentGroupLabel(pathname);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Command: true,
    [activeGroup]: true,
  });

  return (
    <nav className="space-y-1" aria-label="Primary navigation">
      {navigation.map((group) => {
        const matches = group.items.filter((item) => item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
        const activeHref = [...matches].sort((a, b) => b.href.length - a.href.length)[0]?.href;
        const hasActive = Boolean(activeHref);
        const open = expanded[group.label] ?? hasActive;

        return (
          <section key={group.label} className="border-b border-[var(--sidebar-line)] last:border-b-0">
            <button
              type="button"
              onClick={() => setExpanded((state) => ({ ...state, [group.label]: !open }))}
              className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left ${focus}`}
              aria-expanded={open}
            >
              <span className={`text-[11px] font-semibold tracking-[0.01em] ${hasActive ? "text-[var(--foreground)]" : "text-[var(--sidebar-muted)]"}`}>{group.label}</span>
              <span aria-hidden="true" className="text-[12px] text-[var(--sidebar-muted)]">{open ? "−" : "+"}</span>
            </button>

            {open ? (
              <div className="pb-2">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`relative block border-l-2 px-3 py-2.5 text-[13px] leading-5 transition-colors ${focus} ${active ? "border-[var(--accent)] bg-[var(--sidebar-active)] font-semibold text-[var(--foreground)]" : "border-transparent text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
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
    <div className="flex min-h-11 items-center border-b border-[var(--line)] bg-[var(--background)] px-4 md:px-6 lg:px-7 xl:px-8">
      <nav aria-label="Breadcrumb" className="shell-scroll min-w-0 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.href}-${crumb.label}-${index}`} className="flex items-center gap-2">
              {index ? <span aria-hidden="true" className="text-[var(--text-tertiary)]">/</span> : null}
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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = useMemo(() => userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "HC", [userName]);
  const currentArea = currentGroupLabel(pathname);

  const identity = (
    <div className="border-t border-[var(--sidebar-line)] px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--foreground)]">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">{userName}</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{userRole}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={`text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)] ${focus}`}>Sign out</button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <div className="border-b border-[var(--sidebar-line)] px-4 py-4">
      <Link href="/dashboard" className={`block ${focus}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] font-bold tracking-[-0.025em] text-[var(--foreground)]">HelioCoreOS</span>
          <span className="border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--accent-text)]">EPC</span>
        </div>
      </Link>
      <p className="mt-2 truncate text-[11px] text-[var(--text-secondary)]">{organisationName}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--sidebar-line)] bg-[var(--sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {brand}
        <div className="shell-scroll flex-1 overflow-y-auto px-2 py-2"><Navigation /></div>
        {identity}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/25" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-[100dvh] w-[min(88vw,328px)] flex-col border-r border-[var(--sidebar-line)] bg-[var(--sidebar)] shadow-2xl">
            <div className="relative">
              {brand}
              <button
                onClick={() => setMobileOpen(false)}
                className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-[var(--line)] bg-[var(--background)] text-base text-[var(--foreground)] ${focus}`}
                aria-label="Close navigation"
              >
                ×
              </button>
            </div>
            <div className="shell-scroll flex-1 overflow-y-auto px-2 py-2"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
            {identity}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--background)] px-4 md:px-6 lg:px-7 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`inline-flex h-9 items-center border border-[var(--line-strong)] bg-[var(--background)] px-3 text-[11px] font-semibold lg:hidden ${focus}`}
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">{currentArea}</p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{organisationName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/tasks" className={`hidden border border-[var(--line)] px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] sm:inline-flex ${focus}`}>My work</Link>
            <Link href="/dashboard/approvals" className={`hidden border border-[var(--line)] px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] sm:inline-flex ${focus}`}>Approvals</Link>
            <span className="mx-1 hidden h-5 w-px bg-[var(--line)] sm:block" />
            <div className="flex h-8 w-8 items-center justify-center border border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--foreground)]" title={userName}>{initials}</div>
          </div>
        </header>

        <PageContext />
        <main className="px-4 py-5 md:px-6 md:py-6 lg:px-7 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
