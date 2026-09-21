import { Layers3 } from "lucide-react";

export function ViewPlaceholder({ title, path }: { title: string; path: string }) {
  return (
    <div className="p-5 lg:p-6">
      <div className="mb-3 text-[11px] text-[#68717a]">HelioCore OS / {path}</div>
      <h1 className="text-[24px] font-semibold tracking-[-0.03em]">{title}</h1>
      <div className="mt-5 min-h-[640px] border border-[#dfe2e5] bg-white">
        <div className="flex min-h-[640px] flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f3] text-[#6d767f]"><Layers3 size={22} /></div>
          <p className="mt-4 text-[14px] font-medium">{title} module scaffold</p>
          <p className="mt-1 max-w-md text-[12px] leading-5 text-[#707982]">This route is intentionally left as a clean canvas. The branch exists to establish the canonical HelioCore shell and Engineering visual language before expanding other modules.</p>
        </div>
      </div>
    </div>
  );
}
