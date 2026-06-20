import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-hidden transition-colors duration-300 font-sans">
            
            {/* Ambient glowing blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />

            {/* Back to Home Header Link */}
            <header className="absolute left-4 top-4 md:left-8 md:top-8 z-30">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Link>
            </header>

            <div className="w-full max-w-md space-y-6 relative z-10">
                
                {/* Logo and brand name above the auth card */}
                <div className="flex flex-col items-center text-center gap-2 mb-2">
                    <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <span className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-550 uppercase">
                        PRMS
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Property Rental & Management
                    </span>
                </div>

                {children}
            </div>
        </div>
    )
}
