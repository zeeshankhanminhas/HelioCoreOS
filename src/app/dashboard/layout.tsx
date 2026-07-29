import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/sites", label: "Sites" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/documents", label: "Documents" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organisations(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="border-b border-[var(--line)] px-6 py-6 md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-start justify-between md:block">
          <div>
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
              HelioCoreOS
            </Link>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              Solar EPC command
            </p>
          </div>
          <form action={signOut} className="md:hidden">
            <button className="text-sm text-[var(--muted)]" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <nav className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-1" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-transparent px-3 py-2 text-sm transition hover:border-[var(--line)] hover:bg-white/30"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 hidden border-t border-[var(--line)] pt-5 md:block">
          <p className="text-sm font-medium">{profile?.full_name ?? user.email}</p>
          <p className="mt-1 text-xs capitalize text-[var(--muted)]">
            {profile?.role?.replaceAll("_", " ") ?? "Executive"}
          </p>
          <form action={signOut} className="mt-5">
            <button className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-6 py-8 md:px-10 lg:px-14">{children}</main>
    </div>
  );
}
