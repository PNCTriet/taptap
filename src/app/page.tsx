import type { Metadata } from "next";
import { GatewayLanding } from "@/components/landing/gateway-landing";

export const metadata: Metadata = {
  title: "TAPTAP — Play or Business",
  description: "Choose the player path or the business path.",
};

export default function HomePage() {
  return <GatewayLanding />;
}
