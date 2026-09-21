import { EngineeringPvLayout } from "../_components/engineering-pv-layout";
import { ModuleWorkspace } from "../_components/module-workspaces";

export default async function ScaffoldView({params}:{params:Promise<{slug:string[]}>}){
  const {slug}=await params;
  const key=slug.join("/");

  if(key==="engineering/pv-layout") return <EngineeringPvLayout/>;
  if(key==="projects/active") return <ModuleWorkspace moduleKey="projects" projectFilter="active"/>;
  if(key==="projects/completed") return <ModuleWorkspace moduleKey="projects" projectFilter="completed"/>;

  const moduleKey = slug[0];
  return <ModuleWorkspace moduleKey={moduleKey}/>;
}
