import Link from "next/link"
import { cn } from "@/lib/utils"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-white text-gray-300"
            >
                Home
            </Link>
            <Link
                href="/listings"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
                Listings
            </Link>
            <Link
                href="/about"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
                About
            </Link>
            <Link
                href="/features"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
                Features
            </Link>
            <Link
                href="/contact"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
                Contact
            </Link>
        </nav>
    )
}
