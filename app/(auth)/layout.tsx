import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#081A3A] p-4 md:p-8 overflow-hidden font-sans">

            {/* Ambient glowing orbs */}
            <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

            {/* Back to Home */}
            <header className="absolute left-4 top-4 md:left-8 md:top-6 z-30">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur text-sm font-medium text-blue-200/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </header>

            {/* Content */}
            <div className="w-full max-w-md space-y-6 relative z-10">

                {/* Logo */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-600/30 mb-1">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <span className="font-black text-2xl tracking-tight text-white">PRMS</span>
                    <span className="text-[11px] text-blue-300/60 font-semibold uppercase tracking-widest">
                        Property Rental Management
                    </span>
                </div>

                {children}
            </div>
        </div>
    )
}
