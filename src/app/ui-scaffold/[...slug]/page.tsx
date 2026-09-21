import { EngineeringPvLayout } from "../_components/engineering-pv-layout";
import { ViewPlaceholder } from "../_components/view-placeholder";
import { pageTitles } from "../_config/navigation";

export default async function ScaffoldView({params}:{params:Promise<{slug:string[]}>}){
  const {slug}=await params;
  const key=slug.join("/");
  if(key==="engineering/pv-layout") return <EngineeringPvLayout/>;
  return <ViewPlaceholder title={pageTitles[key] ?? "Module"} path={slug.map(x=>x.replaceAll("-"," ")).join(" / ")}/>;
}
