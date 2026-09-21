import { AlertTriangle, ArrowRight, Building2, Check, CheckCircle2, Circle, FileText, Layers3, MapPin, MoreHorizontal, RotateCcw, Upload, Users, Wrench } from "lucide-react";

const stages = ["Site Data","Survey","System Sizing","PV Layout","Electrical Design","BESS Design","BOM","Design Review","IFC"];

export function EngineeringPvLayout() {
  return (
    <div className="p-3.5 lg:p-4">
      <div className="mb-1.5 text-[10px] text-[#68717a]">Projects <span className="mx-2">›</span> HC-2026-014</div>

      <section className="mb-2.5 flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.035em]">Riverside Manufacturing Facility</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-[#58616b]">
            <span className="flex items-center gap-1.5"><MapPin size={13}/> Faisalabad, Pakistan</span><span className="text-[#b6bcc1]">|</span>
            <span className="flex items-center gap-1.5"><Building2 size={13}/> Industrial</span><span className="text-[#b6bcc1]">|</span>
            <span>Hybrid (PV + BESS)</span><span className="text-[#b6bcc1]">|</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f0a400]"/> Design Development</span><span className="text-[#b6bcc1]">|</span>
            <span className="font-semibold text-[#273139]">Rev. B</span><span className="text-[#b6bcc1]">|</span>
            <span>Last updated 12 Sep 2026</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TopAction icon={<Layers3 size={13}/>} label="Project Overview"/>
          <TopAction icon={<FileText size={13}/>} label="Open Documents"/>
          <TopAction icon={<RotateCcw size={13}/>} label="Revision History"/>
          <div className="flex min-w-[154px] items-center gap-2 border border-[#d9dde0] bg-white p-1.5">
            <div className="h-10 w-14 bg-[linear-gradient(135deg,#65737d,#d7d0bd)]" />
            <div><p className="text-[12px] font-semibold">8.5 MWp PV</p><p className="text-[11px] font-semibold">2 MWh BESS</p></div>
          </div>
        </div>
      </section>

      <StageBar />

      <div className="mt-3 grid gap-2.5 xl:grid-cols-[244px_minmax(0,1fr)_292px]">
        <aside className="border border-[#dde1e4] bg-white">
          <PanelTitle title="Design Basis & Constraints" action="Edit"/>
          <DataSection icon={<Building2 size={14}/>} title="Site Information" rows={[["Site Area","12.6 acres"],["Usable Area","8.4 acres"],["Latitude","31.450° N"],["Longitude","73.135° E"],["Ground Elevation","184 m"]]}/>
          <DataSection icon={<Layers3 size={14}/>} title="PV Module" rows={[["Module Type","Jinko JKM-580N"],["Module Power","580 Wp"],["Dimensions","2,278 × 1,134 mm"]]}/>
          <DataSection icon={<Wrench size={14}/>} title="Mounting System" rows={[["Type","Fixed Tilt"],["Tilt Angle","20°"],["Azimuth","180° (South)"],["Row Spacing","5.8 m"],["Foundation","Ground Mount"]]}/>
          <div className="border-t border-[#e6e8ea] p-3">
            <h3 className="flex items-center gap-2 text-[12px] font-semibold"><AlertTriangle size={14} className="text-[#f0a400]"/>Key Constraints</h3>
            <ul className="mt-1.5 space-y-1.25 text-[10px] text-[#55606a]">
              <Constraint label="Setback from boundary" value="5 m" state="neutral"/><Constraint label="Keep clear of drainage channel" state="bad"/><Constraint label="Avoid existing utilities corridor" state="bad"/><Constraint label="Max height (local)" state="good"/><Constraint label="Reserved area for future expansion" state="good"/>
            </ul>
          </div>
          <DataSection icon={<Wrench size={14}/>} title="Design Standards" rows={[["PV Design","IEC 62548"],["Electrical","IEC 60364"],["Structural","Eurocode / Local"],["Grid Compliance","NEPRA / DISCO"]]}/>
        </aside>

        <main className="min-w-0 space-y-2.5">
          <section className="border border-[#dde1e4] bg-white">
            <div className="flex flex-col gap-2 border-b border-[#e2e5e7] px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-[14px] font-semibold">PV Layout Design</h2><p className="mt-0.5 text-[10px] text-[#68717a]">3D site model with PV array layout (SketchUp / Trimble)</p></div>
              <div className="flex flex-wrap gap-1"><TopAction icon={<Layers3 size={12}/>} label="Open Source Model"/><TopAction icon={<Upload size={12}/>} label="Upload Revision"/><TopAction icon={<RotateCcw size={12}/>} label="Compare Revisions"/><button className="h-8 w-8 border border-[#d9dde0] bg-white"><MoreHorizontal size={14} className="mx-auto"/></button></div>
            </div>
            <PvCanvas />
            <div className="grid grid-cols-6 gap-1.5 border-t border-[#e5e8ea] p-2">
              {["3D View","Top View","East Elevation","West Elevation","Array Detail","Shading Analysis"].map((label,index)=><div key={label} className={`overflow-hidden border bg-white ${index===0?"border-[#f97316]":"border-[#dfe3e6]"}`}><div className={`h-11 ${index===5?"bg-[linear-gradient(135deg,#185abd,#f1cc36,#d94131)]":"bg-[linear-gradient(145deg,#80907f,#d2ccba)]"}`}/><p className="px-2 py-1.5 text-[9px]">{label}</p></div>)}
            </div>
          </section>

          <div className="grid gap-2.5 lg:grid-cols-[1fr_1.08fr]">
            <section className="border border-[#dde1e4] bg-white"><PanelTitle title="Design Extraction" muted="(from model)"/><div className="grid grid-cols-2"><Metric label="PV Capacity" value="8,480 kWp"/><Metric label="DC/AC Ratio" value="1.41"/><Metric label="Total Modules" value="14,621"/><Metric label="Row Count" value="142"/><Metric label="Total Strings" value="604"/><Metric label="Module Tilt" value="20°"/><Metric label="Inverter Capacity" value="6,000 kW"/><Metric label="Estimated Yield" value="13,420 MWh/year"/></div></section>
            <section className="border border-[#dde1e4] bg-white"><PanelTitle title="Design Artifacts" action="Open in Document Manager"/><div className="overflow-x-auto"><table className="w-full text-left text-[9px]"><thead className="bg-[#f4f5f5] text-[#555f68]"><tr>{["Document","Rev.","Status","Updated","By"].map(h=><th className="px-2 py-2 font-semibold" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#e7e9eb]">{[["PV Layout Model (SKP)","B","For Review","12 Sep 2026","A. Khan"],["Layout Drawings (PDF)","B","For Review","12 Sep 2026","A. Khan"],["Shading Analysis","A","Approved","10 Sep 2026","M. Ali"],["Array Spacing Report","A","Approved","10 Sep 2026","M. Ali"]].map((r,i)=><tr key={i}>{r.map((v,j)=><td className="px-2 py-2" key={j}>{j===2?<Status label={v}/>:v}</td>)}</tr>)}</tbody></table></div></section>
          </div>
        </main>

        <aside className="space-y-2.5">
          <section className="border border-[#dde1e4] bg-white"><PanelTitle title="Current Action"/><div className="p-3"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f97316] text-white"><CheckCircle2 size={19}/></div><div><h3 className="text-[13px] font-semibold">Complete PV Layout Review</h3><p className="mt-1 text-[10px] leading-4 text-[#65707a]">Validate layout, spacing, setbacks and shading analysis. Ensure compliance with design criteria.</p></div></div><button className="mt-3 flex h-9 w-full items-center justify-center gap-2 bg-[#f36c00] text-[11px] font-semibold text-white">Submit Layout for Review <ArrowRight size={13}/></button></div></section>
          <section className="border border-[#dde1e4] bg-white"><div className="flex items-center justify-between border-b border-[#e3e6e8] px-3 py-2"><h3 className="text-[12px] font-semibold">Review Checklist</h3><span className="text-[10px] text-[#626d76]">4 of 6 complete</span></div><div className="grid grid-cols-6 gap-1 px-3 pt-2">{[0,1,2,3].map(i=><span key={i} className="h-1.5 rounded-full bg-[#198f63]"/>)}{[4,5].map(i=><span key={i} className="h-1.5 rounded-full bg-[#d9dfe2]"/>)}</div><ul className="space-y-2 p-3 text-[10px]">{["Layout covers usable area and respects setbacks","Row spacing and access roads verified","Shading analysis completed","Inverter and BESS locations confirmed"].map(x=><li className="flex gap-2" key={x}><CheckCircle2 size={14} className="text-[#159366]"/>{x}</li>)}{["Export drawings and screenshots","Internal QA review"].map(x=><li className="flex gap-2" key={x}><Circle size={14} className="text-[#7a858f]"/>{x}</li>)}</ul></section>
          <section className="border border-[#dde1e4] bg-white"><PanelTitle title="Design Authority"/><div className="space-y-2 p-3 text-[9px]"><Authority role="Prepared by" person="A. Khan (PV Engineer)" date="12 Sep 2026"/><Authority role="Reviewed by" person="M. Ali (Lead Engineer)" date="—"/><Authority role="Approved by" person="S. Rahman (Technical Director)" date="—"/></div></section>
          <section className="border border-[#dde1e4] bg-white"><div className="flex items-center justify-between border-b border-[#e3e6e8] px-3 py-2"><h3 className="text-[12px] font-semibold">Revision History</h3><span className="text-[9px] text-[#2d6ebd]">View All</span></div><div className="divide-y divide-[#e8eaec]">{[["Rev. B","For Review","12 Sep 2026","A. Khan","Updated array layout, inverter location"],["Rev. A","Approved","10 Sep 2026","M. Ali","Initial design version"],["Rev. 0","Draft","08 Sep 2026","A. Khan","Concept layout"]].map((r,i)=><div className="p-3 text-[9px]" key={i}><div className="flex items-center gap-2"><strong className="text-[10px]">{r[0]}</strong><Status label={r[1]}/><span className="ml-auto text-[#68717a]">{r[2]}</span><span className="text-[#68717a]">{r[3]}</span></div><p className="mt-1 text-[#727c84]">{r[4]}</p></div>)}</div></section>
        </aside>
      </div>

      <section className="mt-3 flex flex-col gap-2.5 border border-[#dde1e4] bg-white p-3 xl:flex-row xl:items-center">
        <div className="min-w-[225px]"><h3 className="text-[12px] font-semibold">Downstream Dependencies</h3><p className="mt-1 text-[9px] text-[#717b84]">This PV layout feeds into the following stages</p></div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {["Electrical Design","Yield Simulation","BOM & Procurement","Proposal & Commercial"].map((x,i)=><div key={x} className="flex min-w-[145px] flex-1 items-center gap-2 border border-[#e0e4e6] px-3 py-2 text-[9px]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef4ff] text-[#2e6fd3]">{i+1}</span>{x}</div>)}
        </div>
        <div className="max-w-[250px] border border-[#d7e4f7] bg-[#f3f8ff] p-2 text-[9px] leading-4 text-[#596775]">Any changes to the PV layout will impact electrical design, yield estimates and the BOM.</div>
      </section>
    </div>
  );
}

function TopAction({icon,label}:{icon:React.ReactNode,label:string}){return <button className="flex h-7 items-center gap-1.5 border border-[#d9dde0] bg-white px-2.5 text-[9px] font-medium">{icon}{label}</button>}
function PanelTitle({title,action,muted}:{title:string,action?:string,muted?:string}){return <div className="flex min-h-8 items-center justify-between border-b border-[#e3e6e8] px-3 py-1.5"><h2 className="text-[12px] font-semibold">{title} {muted?<span className="font-normal text-[#7a838b]">{muted}</span>:null}</h2>{action?<button className="text-[9px] font-medium text-[#44515b]">{action}</button>:null}</div>}
function DataSection({icon,title,rows}:{icon:React.ReactNode,title:string,rows:string[][]}){return <section className="border-b border-[#e7e9eb] px-3 py-2.5"><h3 className="flex items-center gap-2 text-[11px] font-semibold">{icon}{title}</h3><dl className="mt-2 space-y-1.5">{rows.map(([a,b])=><div className="flex justify-between gap-3 text-[9px]" key={a}><dt className="text-[#616c75]">{a}</dt><dd className="text-right font-medium text-[#45505a]">{b}</dd></div>)}</dl></section>}
function Constraint({label,value,state}:{label:string,value?:string,state:"good"|"bad"|"neutral"}){return <li className="flex items-center gap-2"><span className="flex-1">{label}</span>{value?<span>{value}</span>:null}{state==="good"?<CheckCircle2 size={12} className="text-[#139467]"/>:state==="bad"?<span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#e8342d] text-[8px] text-white">×</span>:null}</li>}
function Metric({label,value}:{label:string,value:string}){return <div className="border-b border-r border-[#e6e9ea] px-3 py-2"><p className="text-[9px] text-[#68717a]">{label}</p><p className="mt-1 text-[12px] font-semibold tabular-nums">{value}</p></div>}
function Status({label}:{label:string}){const cls=label==="Approved"?"bg-[#dff4e9] text-[#16744f]":label==="For Review"?"bg-[#fff0d8] text-[#a96000]":"bg-[#eef0f2] text-[#69737c]";return <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-medium ${cls}`}>{label}</span>}
function Authority({role,person,date}:{role:string,person:string,date:string}){return <div className="grid grid-cols-[70px_1fr_auto] items-center gap-2"><span className="flex items-center gap-1 text-[#69737c]"><Users size={12}/>{role}</span><span>{person}</span><span className="text-[#69737c]">{date}</span></div>}

function StageBar(){
  return <div className="grid overflow-hidden border border-[#e0e3e5] bg-[#f1f2f1] lg:grid-cols-9">
    {stages.map((stage,index)=>{const done=index<3,current=index===3;return <div key={stage} className={`relative flex min-h-8 items-center gap-1.5 border-r border-white/80 px-2.5 text-[9px] last:border-r-0 ${current?"bg-[#ffc58f] font-semibold":"bg-[#f1f2f1]"}`}><span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-semibold ${done?"bg-[#14996d] text-white":current?"border-2 border-[#f97316] bg-white":"bg-[#bfc5ca] text-white"}`}>{done?<Check size={12}/>:index+1}</span><span>{stage}</span></div>})}
  </div>
}

function PvCanvas(){
  return <div className="relative m-1.5 min-h-[365px] overflow-hidden bg-[linear-gradient(145deg,#8fa07d_0%,#b1a888_23%,#72876e_23%,#a7a68f_52%,#77816d_52%,#a9a189_100%)]">
    <div className="absolute inset-[8%_8%_9%_9%] rotate-[-1deg] border-2 border-[#f0a11a] bg-[#6f805f]/45">
      <div className="absolute inset-[6%_6%_8%_6%] grid content-center gap-[3px]">{Array.from({length:18}).map((_,r)=><div key={r} className="grid grid-cols-18 gap-[2px]">{Array.from({length:18}).map((__,c)=><span key={c} className="block h-[7px] border border-[#516e89] bg-[#243e57]"/>)}</div>)}</div>
      <div className="absolute left-[13%] top-[5%] h-[88%] w-[4%] bg-[#d7cdb4]/75"/><div className="absolute right-[17%] top-[10%] h-[76%] w-[4%] bg-[#d7cdb4]/70"/><div className="absolute bottom-[14%] left-[22%] right-[8%] h-[4%] bg-[#d7cdb4]/65"/>
    </div>
    <div className="absolute left-3 top-3 flex flex-col border border-white/50 bg-[#1e2524]/85 text-white">{["↖","＋","−","⌖"].map(x=><button className="h-8 w-8 border-b border-white/15 text-[11px] last:border-0" key={x}>{x}</button>)}</div>
    <div className="absolute right-3 top-3 bg-[#202625]/90 text-[9px] text-white">{["2D","3D","Top","North","Render"].map((x,i)=><div className={`border-b border-white/15 px-3 py-2 text-center last:border-0 ${i===1?"bg-[#f97316]":""}`} key={x}>{x}</div>)}</div>
    <div className="absolute bottom-3 left-3 bg-[#202625]/88 px-3 py-2 text-[8px] leading-4 text-white"><div><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4c91dc]"/>PV Modules</div><div><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#57a876]"/>Inverter / Skid</div><div><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#dd6d52]"/>BESS Container</div><div><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#f0a11a]"/>Site Boundary</div><div><b className="mr-2 inline-block h-[2px] w-2 bg-white"/>Access Road</div></div>
    <div className="absolute bottom-3 right-3 text-[14px] font-semibold text-white/90">Trimble</div>
  </div>
}
