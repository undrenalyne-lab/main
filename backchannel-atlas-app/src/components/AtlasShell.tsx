import Link from "next/link";
import { appPath } from "@/lib/format";

const navItems = [
  ["Profil", "/onboarding/"],
  ["Dashboard", "/dashboard/"],
  ["Carte", "/map/"],
  ["Comparer", "/compare/"],
  ["Plans", "/plans/"],
  ["Compte", "/account/"],
];

export function AtlasShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="shell nav-row">
          <Link className="brand" href="/">
            <span className="brand-mark">BA</span>
            <span>
              Backchannel Atlas
              <small>profile · map · plan</small>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Navigation principale">
            {navItems.map(([label, href]) => (
              <Link className="nav-link" key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="shell site-footer">
        <p>
          Backchannel Atlas ne remplace pas une vérification officielle visa, emploi ou fiscalité. Les revenus sont
          des fourchettes indicatives, pas des promesses.
        </p>
        <a href={appPath("/account/")}>Exporter ou supprimer mes données</a>
      </footer>
    </>
  );
}
