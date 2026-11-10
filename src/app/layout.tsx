import type { Metadata } from "next";
// Self-hosted fonts (no Google Fonts fetch at build time; it failed intermittently on Vercel).
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "@fontsource/nunito-sans/800.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ExplorerProvider } from "@/context/explorer-context";
import { NavigationShell } from "@/components/navigation";

export const metadata: Metadata = {
  title: "TAPTAP — Tap. Explore. Collect.",
  description:
    "NFC-powered digital stamp collection passport and live GPS trail map at Saigon Zoo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#176B61] selection:text-white">
        <ExplorerProvider>
          <NavigationShell>{children}</NavigationShell>
        </ExplorerProvider>
      </body>
    </html>
  );
}
