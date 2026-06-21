"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Building2, Menu, X, ChevronRight } from "lucide-react"

const NAV_LINKS = [
    { label: "Home",        href: "/" },
    { label: "Properties",  href: "/listings" },
    { label: "Marketplace", href: "/#marketplace" },
    { label: "Contact",     href: "/contact" },
]

interface PublicPageShellProps {
    children: React.ReactNode
    /** Page title shown in the hero banner below the navbar */
    pageTitle?: string
    /** Subtitle shown below the page title */
    pageSubtitle?: string
    /** Badge text shown above the page title */
    badge?: string
    /** Whether to show a mini hero banner — default true */
    showBanner?: boolean
}

export function PublicPageShell({
    children,
    pageTitle,
    pageSubtitle,
    badge,
    showBanner = true,
}: PublicPageShellProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <div className="min-h-screen bg-[#081A3A] text-white font-sans overflow-x-hidden">
            {/* ── Sticky Navbar ────────────────────────────────────────────── */}
            <motion.header
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-[#081A3A]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl"
                        : "bg-[#081A3A]/60 backdrop-blur-md"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-black text-white text-xl tracking-tight">PRMS</span>
                    </Link>

                    {/* Desktop links */}
                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(l => (
                            <Link
                                key={l.label}
                                href={l.href}
                                className={`text-sm font-medium transition-colors ${
                                    pathname === l.href
                                        ? "text-white"
                                        : "text-blue-100/70 hover:text-white"
                                }`}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login">
                            <button className="px-4 py-2 text-sm font-semibold text-blue-100 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all">
                                Login
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-[#081A3A]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                        >
                            <div className="px-4 py-4 flex flex-col gap-3">
                                {NAV_LINKS.map(l => (
                                    <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                                        className="text-blue-100/80 hover:text-white font-medium py-2 border-b border-white/5 flex items-center justify-between">
                                        {l.label} <ChevronRight className="h-4 w-4 opacity-40" />
                                    </Link>
                                ))}
                                <div className="flex gap-3 pt-2">
                                    <Link href="/login" className="flex-1">
                                        <button className="w-full py-2.5 text-sm font-semibold text-white border border-white/20 rounded-xl">Login</button>
                                    </Link>
                                    <Link href="/signup" className="flex-1">
                                        <button className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl">Get Started</button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* ── Page hero banner ─────────────────────────────────────────── */}
            {showBanner && pageTitle && (
                <div className="relative pt-16 md:pt-20 overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-96 h-48 bg-blue-600/15 rounded-full blur-3xl" />
                        <div className="absolute top-0 right-1/4 w-64 h-32 bg-violet-600/10 rounded-full blur-3xl" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#081A3A)]" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
                        {badge && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-5"
                            >
                                {badge}
                            </motion.div>
                        )}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4"
                        >
                            {pageTitle}
                        </motion.h1>
                        {pageSubtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-blue-100/60 max-w-2xl mx-auto leading-relaxed"
                            >
                                {pageSubtitle}
                            </motion.p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Page content ─────────────────────────────────────────────── */}
            <div className={showBanner && pageTitle ? "" : "pt-16 md:pt-20"}>
                {children}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="border-t border-white/10 bg-[#060F22] pt-14 pb-8 mt-16">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 mb-10">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-black text-white text-xl tracking-tight">PRMS</span>
                            </div>
                            <p className="text-sm text-blue-200/50 leading-relaxed max-w-xs">
                                The most trusted platform for property management in Nigeria. Built for landlords and tenants who value efficiency and transparency.
                            </p>
                        </div>
                        {[
                            { heading: "Company",   links: [{ label: "About",    href: "/about" }, { label: "Features", href: "/features" }, { label: "Contact", href: "/contact" }] },
                            { heading: "Resources", links: [{ label: "Listings", href: "/listings" }, { label: "FAQ",  href: "/faq" }] },
                            { heading: "Legal",     links: [{ label: "Terms",    href: "/terms" }, { label: "Privacy", href: "/privacy" }] },
                        ].map(col => (
                            <div key={col.heading}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-200/50 mb-4">{col.heading}</h4>
                                <ul className="space-y-2.5">
                                    {col.links.map(l => (
                                        <li key={l.label}>
                                            <Link href={l.href} className="text-sm text-blue-100/60 hover:text-white transition-colors">
                                                {l.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-200/40">
                        <span>© {new Date().getFullYear()} PRMS. Owned by JUNIOR PROPERTY TECHNOLOGIES.</span>
                        <span>Built with ❤ for Nigerian property owners.</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
