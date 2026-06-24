import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  /** href to wrap the logo in — defaults to "/" */
  href?: string
  /** Show only the icon mark (for collapsed sidebars) */
  iconOnly?: boolean
  /** Extra classes on the root wrapper */
  className?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Dark background — renders text/icon in white */
  dark?: boolean
}

export function Logo({
  href = "/",
  iconOnly = false,
  className,
  size = "md",
  dark = false,
}: LogoProps) {
  const iconSizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-[12px]",
    lg: "h-11 w-11 text-[14px]",
  }
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
        className,
      )}
      aria-label="PRMS – Property Rental Management System"
    >
      {/* Icon mark */}
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 font-black text-white shrink-0",
          iconSizes[size],
        )}
      >
        P
      </div>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className={cn(
            "font-black tracking-tight leading-none",
            textSizes[size],
            dark ? "text-white" : "text-foreground",
          )}
        >
          PRMS
        </span>
      )}
    </Link>
  )
}
