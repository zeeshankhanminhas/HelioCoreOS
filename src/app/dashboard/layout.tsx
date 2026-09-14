import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { auth } from "@/lib/auth/server";
import { WorkspaceShell } from "./_components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const userName = user.name?.trim() || user.email?.split("@")[0] || "Executive";
  const userRole = typeof user.role === "string" && user.role.trim() ? user.role.replaceAll("_", " ") : "member";
  const organisationName = "HelioCoreOS workspace";

  return (
    <WorkspaceShell
      userName={userName}
      userRole={userRole}
      organisationName={organisationName}
      signOutAction={signOut}
    >
      {children}
    </WorkspaceShell>
  );
}
