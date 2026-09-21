"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Search, SunMedium } from "lucide-react";
import { scaffoldNavigation } from "../_config/navigation";

export function ScaffoldShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#17191d]">
      <aside className="fixed inset-y-0 left-0 hidden w-[218px] flex-col border-r border-[#2d3237] bg-[#151a1e] text-white lg:flex">
        <div className="border-b border-[#2b3034] px-4 py-3.5">
          <Link href="/ui-scaffold" className="flex items-center gap-2.5">
            <SunMedium className="text-[#f97316]" size={27} strokeWidth={1.8} />
            <div>
              <div className="text-[19px] font-semibold tracking-[-0.03em]">HelioCore <span className="text-[#f97316]">OS</span></div>
              <div className="mt-0.5 text-[10px] text-[#b2bac0]">Solar EPC Operating System</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {scaffoldNavigation.map((item) => {
            const active = item.href === "/ui-scaffold" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link href={item.href} className={`mx-2 flex min-h-9 items-center gap-2.5 rounded-[4px] px-3 text-[11px] ${active ? "bg-[#f97316] font-semibold text-white" : "text-[#d8dde1] hover:bg-[#23292e]"}`}>
                  <Icon size={16} strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                  {item.children ? <ChevronDown size={13} /> : null}
                </Link>
                {item.children ? (
                  <div className="ml-[30px] mt-1 border-l border-[#343a40] pl-4">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return <Link key={child.href} href={child.href} className={`block py-1.5 text-[11px] ${childActive ? "font-medium text-white" : "text-[#aeb6bc] hover:text-white"}`}>{child.label}</Link>;
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="relative overflow-hidden border-t border-[#2b3034] px-4 py-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_100%,rgba(249,115,22,0.16),transparent_46%)]" />
          <div className="relative">
            <p className="text-[12px] font-medium text-white">Cleaner Energy</p>
            <p className="text-[12px] text-white">Brighter Possibilities</p>
            <span className="mt-3 block h-[3px] w-6 bg-[#f97316]" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[218px]">
        <header className="sticky top-0 z-30 flex h-[52px] items-center border-b border-[#dfe2e5] bg-[#f7f8f8]/95 px-4 backdrop-blur">
          <label className="relative hidden w-[440px] md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68717a]" size={15} />
            <input className="h-8 w-full rounded-[3px] border border-[#d6dadd] bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-[#7f8790] focus:border-[#aeb5bb]" placeholder="Search projects, clients, documents..." />
          </label>
          <div className="ml-auto flex items-center gap-4">
            <button aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center text-[#2a3137]"><Bell size={17} /><span className="absolute right-1.5 top-1 h-4 min-w-4 rounded-full bg-[#f97316] px-1 text-center text-[9px] leading-4 text-white">3</span></button>
            <div className="h-7 w-px bg-[#d8dcdf]" />
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#242a2f] text-[10px] font-semibold text-white">ZM</div>
              <div className="hidden sm:block">
                <p className="text-[12px] font-medium">Zeeshan Minhas</p>
                <p className="text-[10px] text-[#6e7780]">Business Development</p>
              </div>
              <ChevronDown size={14} className="text-[#47515a]" />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
