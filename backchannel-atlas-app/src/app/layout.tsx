import type { Metadata } from "next";
import "./globals.css";
import { AtlasShell } from "@/components/AtlasShell";

export const metadata: Metadata = {
  title: "Backchannel Atlas",
  description: "Atlas mondial origin to destination to opportunity to plan: pays, cash, visa, gates, preuves et plans.",
  metadataBase: new URL("https://undrenalynelab.io/france-money-map/"),
  openGraph: {
    title: "Backchannel Atlas",
    description: "Profil, carte monde, scoring pays, preuves cash et plans sauvegardes.",
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
