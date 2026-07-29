import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "./_components/workspace-shell";

type ProfileWithOrganisation = {
  full_name: string | null;
  role: string | null;
  organisations: { name: string } | { name: string }[] | null;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("full_name, role, organisations(name)")
    .eq("id", user.id)
    .single();

  const profile = data as ProfileWithOrganisation | null;
  const organisation = Array.isArray(profile?.organisations)
    ? profile.organisations[0]
    : profile?.organisations;

  const userName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Executive";
  const userRole = profile?.role?.replaceAll("_", " ") || "executive";
  const organisationName = organisation?.name || "HelioCoreOS workspace";

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
