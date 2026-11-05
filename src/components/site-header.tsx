import Link from "next/link";
import { Wordmark } from "./wordmark";
import { MobileNav } from "./mobile-nav";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#facilities", label: "Facilities" },
  { href: "/#membership", label: "Membership" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-edge bg-ink/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Wordmark />
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.label} href={l.href} className="text-sm font-medium text-mist transition-colors hover:text-bone">
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="btn btn-primary !min-h-10 !px-5 !text-sm">Member Login</Link>
          </nav>
          <MobileNav links={navLinks} />
        </div>
      </header>
    </>
  );
}
