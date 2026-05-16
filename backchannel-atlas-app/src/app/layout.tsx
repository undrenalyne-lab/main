import type { Metadata } from "next";
import "./globals.css";
import { AtlasShell } from "@/components/AtlasShell";

export const metadata: Metadata = {
  title: "Backchannel Atlas",
  description: "Moteur d'arbitrage pays, cash, visa, gates et plans 7/30/90.",
  metadataBase: new URL("https://undrenalynelab.io/france-money-map/"),
  openGraph: {
    title: "Backchannel Atlas",
    description: "Profil, carte monde, scoring pays, plans sauvegardés.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AtlasShell>{children}</AtlasShell>
      </body>
    </html>
  );
}
