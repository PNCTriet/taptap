import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ExplorerProvider } from "@/context/explorer-context";
import { NavigationShell } from "@/components/navigation";

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TAPTAP — Tap. Explore. Collect.",
  description:
    "NFC-powered digital stamp collection passport by HOWLSLAB. Explore venues, tap checkpoints, and collect commemorative stamps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${fraunces.variable}`}>
      <body className="antialiased selection:bg-[#176B61] selection:text-white">
        <ExplorerProvider>
          <NavigationShell>{children}</NavigationShell>
        </ExplorerProvider>
      </body>
    </html>
  );
}
