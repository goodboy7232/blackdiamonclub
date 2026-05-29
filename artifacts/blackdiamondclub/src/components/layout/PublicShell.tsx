import { ReactNode } from "react";
import { Link } from "wouter";
import { ParticleBackground } from "../shared/ParticleBackground";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl h-16 flex items-center px-4 md:px-8 lg:px-12">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <img
              src="/assets/logo.png"
              alt="BlackDiamondClub"
              className="h-10 w-10 object-contain rounded-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-bold tracking-wider text-white group-hover:text-primary transition-colors">
              BLACK<span className="text-primary">DIAMOND</span>
            </span>
          </div>
        </Link>
      </div>
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
