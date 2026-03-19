"use client";

import { Navbar } from "./navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 pt-20">{children}</main>
    </div>
  );
}
