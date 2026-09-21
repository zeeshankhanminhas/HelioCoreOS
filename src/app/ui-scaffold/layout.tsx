import { ScaffoldShell } from "./_components/scaffold-shell";

export default function UiScaffoldLayout({ children }: { children: React.ReactNode }) {
  return <ScaffoldShell>{children}</ScaffoldShell>;
}
