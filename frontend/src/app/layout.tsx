import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/providers/simulation-provider";
import { AppShell } from "@/components/layout/app-shell";
import { SplashScreen } from "@/components/splash/splash-screen";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mars Greenhouse Command Center",
  description: "AI-powered greenhouse management for Mars surface missions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <SplashScreen />
        <SimulationProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </SimulationProvider>
      </body>
    </html>
  );
}
