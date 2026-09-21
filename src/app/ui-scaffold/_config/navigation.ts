import type { LucideIcon } from "lucide-react";
import { BarChart3, BriefcaseBusiness, Building2, ClipboardCheck, Construction, ContactRound, FileText, FolderKanban, Gauge, Library, Settings, ShoppingCart, Wrench } from "lucide-react";

export type NavChild = { label: string; href: string };
export type NavItem = { label: string; href: string; icon: LucideIcon; children?: NavChild[] };

export const scaffoldNavigation: NavItem[] = [
  { label: "Dashboard", href: "/ui-scaffold", icon: Gauge },
  { label: "Pre-Sales", href: "/ui-scaffold/pre-sales", icon: BriefcaseBusiness },
  { label: "Projects", href: "/ui-scaffold/projects", icon: FolderKanban, children: [
    { label: "All Projects", href: "/ui-scaffold/projects" },
    { label: "Active Projects", href: "/ui-scaffold/projects/active" },
    { label: "Completed Projects", href: "/ui-scaffold/projects/completed" },
  ]},
  { label: "Engineering", href: "/ui-scaffold/engineering/pv-layout", icon: Wrench },
  { label: "Procurement", href: "/ui-scaffold/procurement", icon: ShoppingCart },
  { label: "Construction", href: "/ui-scaffold/construction", icon: Construction },
  { label: "Commissioning", href: "/ui-scaffold/commissioning", icon: ClipboardCheck },
  { label: "Operations", href: "/ui-scaffold/operations", icon: Building2 },
  { label: "Clients & Contacts", href: "/ui-scaffold/clients", icon: ContactRound },
  { label: "Reports", href: "/ui-scaffold/reports", icon: BarChart3 },
  { label: "Documents", href: "/ui-scaffold/documents", icon: FileText },
  { label: "Equipment Library", href: "/ui-scaffold/equipment-library", icon: Library },
  { label: "Settings", href: "/ui-scaffold/settings", icon: Settings },
];

export const pageTitles: Record<string,string> = {
  "": "Dashboard",
  "pre-sales": "Pre-Sales",
  "projects": "Projects",
  "projects/active": "Active Projects",
  "projects/completed": "Completed Projects",
  "engineering/pv-layout": "Engineering · PV Layout",
  "procurement": "Procurement",
  "construction": "Construction",
  "commissioning": "Commissioning",
  "operations": "Operations",
  "clients": "Clients & Contacts",
  "reports": "Reports",
  "documents": "Documents",
  "equipment-library": "Equipment Library",
  "settings": "Settings",
};
