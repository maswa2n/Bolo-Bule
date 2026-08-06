import { AppShell } from "@/components/layout/AppShell";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
