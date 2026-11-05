import Link from "next/link";

/** Logo: Undergrad (if public/fonts has the file) with red neon glow. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="VELOCITY home" className={`logo-glow font-logo text-2xl tracking-wider sm:text-3xl ${className}`}>
      VELOCITY
    </Link>
  );
}
