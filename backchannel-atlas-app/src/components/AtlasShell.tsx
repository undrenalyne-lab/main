"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appPath } from "@/lib/format";

const navItems = [
  ["Dashboard", "/dashboard/"],
  ["Carte", "/map/"],
  ["Comparer", "/compare/"],
];

const actionItems = [
  ["Plans", "/plans/"],
  ["Compte", "/account/"],
];

const mobileItems = [
  ["Profil", "/onboarding/"],
  ["Carte", "/map/"],
  ["Dashboard", "/dashboard/"],
  ["Plans", "/plans/"],
];

export function AtlasShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalize = (path: string) => path.replace(/^\/france-money-map/, "").replace(/\/?$/, "/");
  const activePath = normalize(pathname || "/");
  const isActive = (href: string) => activePath === href;

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
              <Link className="nav-link" aria-current={isActive(href) ? "page" : undefined} key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions" aria-label="Actions compte et plans">
            {actionItems.map(([label, href]) => (
              <Link className="button ghost" aria-current={isActive(href) ? "page" : undefined} key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      {children}
      <nav className="nav-mobile" aria-label="Navigation mobile">
        {mobileItems.map(([label, href]) => (
          <Link className="nav-mobile__item" aria-current={isActive(href) ? "page" : undefined} key={href} href={href}>
            <span aria-hidden="true">{label.slice(0, 2).toUpperCase()}</span>
            {label}
          </Link>
        ))}
      </nav>
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
