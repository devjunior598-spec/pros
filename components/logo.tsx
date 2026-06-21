import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
    /** href to wrap the logo in — defaults to "/" */
    href?: string
    /** Show only the icon mark (for collapsed sidebars etc.) */
    iconOnly?: boolean
    /** Extra classes on the root wrapper */
    className?: string
    /** Height of the image in px — width scales proportionally */
    height?: number
    /** Invert colours for dark backgrounds */
    invert?: boolean
}

export function Logo({
    href = "/",
    iconOnly = false,
    className,
    height = 36,
    invert = false,
}: LogoProps) {
    const img = (
        <Image
            src="/prms-logo.png"
            alt="PRMS – Property Rental Management System"
            width={iconOnly ? height : Math.round(height * 3.2)}
            height={height}
            className={cn(
                "object-contain object-left select-none",
                invert && "invert brightness-200",
                iconOnly && "object-center"
            )}
            priority
        />
    )

    return (
        <Link
            href={href}
            className={cn("flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded", className)}
            aria-label="PRMS home"
        >
            {img}
        </Link>
    )
}
