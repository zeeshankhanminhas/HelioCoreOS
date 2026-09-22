import { LiveProjectEngineering } from "@/features/projects/live-project-engineering";

export default async function ProjectEngineeringPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <LiveProjectEngineering projectId={projectId} />;
}
