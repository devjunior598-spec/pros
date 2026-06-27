import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 md:p-8">
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80" />

            <header className="absolute left-4 top-4 z-30 md:left-8 md:top-6">
                <Link
                    href="/"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-prms-navy shadow-sm transition hover:bg-secondary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </header>

            <div className="relative z-10 w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Logo size="lg" href="/" />
                    <span className="text-xs font-medium uppercase tracking-wider text-prms-slate">
                        Property Rental Management
                    </span>
                </div>

                {children}
            </div>
        </div>
    )
}
