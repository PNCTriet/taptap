import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro, Fraunces, JetBrains_Mono, Nunito_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${nunitoSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${baloo.variable} ${beVietnam.variable}`}
    >
      <body className="antialiased selection:bg-[#176B61] selection:text-white">
        <ExplorerProvider>
          <NavigationShell>{children}</NavigationShell>
        </ExplorerProvider>
      </body>
    </html>
  );
}
