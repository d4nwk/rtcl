// src/components/Toolbar.tsx
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import clsx from "clsx";

type ToolbarProps = {
  /** Show a back button on the left that navigates to backHref (default "/"). */
  showBack?: boolean;
  /** Destination for the back button (defaults to "/"). */
  backHref?: string;
  /** Hide the profile button on the right (useful on the Profile page itself). */
  hideProfile?: boolean;
  /** Optional extra className for the header wrapper. */
  className?: string;
};

export default function Toolbar({
  showBack = false,
  backHref = "/",
  hideProfile = false,
  className,
}: ToolbarProps) {
  const iconClass =
    "text-[color-mix(in_oklab,var(--rtcl-ink)_60%,#14b8a6_40%)] hover:opacity-80";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur",
        className
      )}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-h-[30px]">
          {showBack && (
            <Link href={backHref} aria-label="Back" className={iconClass}>
              <ArrowLeft size={26} strokeWidth={1.5} />
            </Link>
          )}

          {!hideProfile && (
            <Link href="/" className="inline-flex items-center" aria-label="Home">
              <span className="font-[400] tracking-tight">read</span>
              <img
                src="/logo.png"
                alt="rtcl"
                className="h-[30px] w-[30px] align-middle object-contain -mx-1 ml-0"
              />
              <span className="font-[400] tracking-tight">, ctrl language</span>
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!hideProfile && (
            <Link href="/profile" aria-label="Profile" className={iconClass}>
              <User size={26} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}