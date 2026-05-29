import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { BottomNav } from "./BottomNav";
import { ParticleBackground } from "../shared/ParticleBackground";
import { AuthGuard } from "./AuthGuard";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-[100dvh] bg-background text-foreground relative overflow-hidden flex selection:bg-primary/30">
        <ParticleBackground />
        <TopNavbar />
        <Sidebar />
        <main className="flex-1 md:ml-64 relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden pb-24 md:pb-0 pt-16">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}