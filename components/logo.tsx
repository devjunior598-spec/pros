import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  href?: string
  iconOnly?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  dark?: boolean
}

export function Logo({
  href = "/",
  iconOnly = false,
  className,
  size = "md",
  dark = false,
}: LogoProps) {
  const imageSizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 44, height: 44 },
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
        "flex items-center gap-2.5 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg",
        className,
      )}
      aria-label="PRMS – Property Rental Management System"
    >
      <Image
        src="/prms-logo.png"
        alt="PRMS Logo"
        width={imageSizes[size].width}
        height={imageSizes[size].height}
        className="shrink-0 rounded-md object-contain"
        priority
      />

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-semibold tracking-tight",
              textSizes[size],
              dark ? "text-white" : "text-prms-navy",
            )}
          >
            PRMS
          </span>
          <span className={cn(
            "text-[10px] font-medium tracking-wide",
            dark ? "text-white/60" : "text-prms-slate",
          )}>
            Property Management
          </span>
        </div>
      )}
    </Link>
  )
}
