import Link from "next/link"
import { Building2 } from "lucide-react"
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
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }
  const iconInnerSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
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
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-prms-navy shrink-0",
          iconSizes[size],
        )}
      >
        <Building2 className={cn("text-white", iconInnerSizes[size])} />
      </div>

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
