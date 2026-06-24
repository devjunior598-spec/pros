"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "motion/react"
import { Logo } from "@/components/logo"
import {
  ShieldCheck, Home, Wrench, BarChart3, BrainCircuit, CreditCard,
  ArrowRight, Star, Users, Building2, CheckCircle2, Zap, Globe,
  Smartphone, Lock, TrendingUp, MapPin, ChevronDown, Menu, X,
  Paintbrush, Bolt, Droplets, Shield, Sparkles, Play,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StatItem { label: string; value: string; suffix?: string }
interface Feature  { icon: React.ReactNode; title: string; desc: string; color: string }
interface Provider { icon: React.ReactNode; name: string; desc: string; color: string }

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      setCount(Math.floor(start))
      if (start >= target) clearInterval(timer)
    }, 20)
    return () => clearInterval(timer)
  }, [inView, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Floating particle ─────────────────────────────────────────────────────────
function Particle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-blue-400/20 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  )
}

// ─── Glassmorphism card ────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md ${className}`}>
      {children}
    </div>
  )
}

// ─── Section wrapper with fade-in ─────────────────────────────────────────────
function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const links = [
    { label: "Home",        href: "/" },
    { label: "Properties",  href: "/listings" },
    { label: "Landlords",   href: "/landlords" },
    { label: "Marketplace", href: "#marketplace" },
    { label: "Contact",     href: "/contact" },
  ]

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#081A3A]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Logo href="/" dark />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-blue-100/80 hover:text-white transition-colors"
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

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile menu - full-screen slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#081A3A] border-r border-white/10 z-50 md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <Logo href="/" dark />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                {links.map(l => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base text-blue-100/80 hover:text-white font-medium border-b border-white/5 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Bottom CTA buttons */}
              <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-3">
                <Link href="/login">
                  <button className="w-full min-h-[48px] py-2.5 text-sm font-semibold text-white border border-white/20 rounded-xl hover:border-white/40 transition-colors">Login</button>
                </Link>
                <Link href="/signup">
                  <button className="w-full min-h-[48px] py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors">Get Started</button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  const [stats, setStats] = useState({ properties: 0, tenants: 0, landlords: 0, txns: 0 })
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; delay: number }[]>([])
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ count: props }, { count: tenants }, { count: landlords }] = await Promise.all([
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
        ])
        setStats({
          properties: (props ?? 0) + 1200,
          tenants:    (tenants ?? 0) + 4500,
          landlords:  (landlords ?? 0) + 320,
          txns:       98,
        })
      } catch { /* use defaults */ }
    }
    fetchStats()
  }, [])

  // Generate particles client-side only to avoid SSR/hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 12,
        delay: i * 0.3,
      }))
    )
  }, [])

  const features: Feature[] = [
    { icon: <ShieldCheck className="h-6 w-6" />, title: "Verified Landlords",        desc: "Every landlord undergoes KYC verification. Trust starts here.",              color: "from-blue-500 to-blue-700" },
    { icon: <Users className="h-6 w-6" />,       title: "Smart Tenant Screening",    desc: "Data-driven screening helps landlords find the perfect tenant.",             color: "from-violet-500 to-violet-700" },
    { icon: <CreditCard className="h-6 w-6" />,  title: "Online Rent Collection",    desc: "Automated invoicing and payment tracking — no more missed rent.",           color: "from-emerald-500 to-emerald-700" },
    { icon: <Wrench className="h-6 w-6" />,      title: "Maintenance Tracking",      desc: "Submit and track repair requests from any device, in real time.",           color: "from-orange-500 to-orange-700" },
    { icon: <BarChart3 className="h-6 w-6" />,   title: "Property Analytics",        desc: "Deep insights on occupancy, revenue, and portfolio performance.",           color: "from-pink-500 to-pink-700" },
    { icon: <BrainCircuit className="h-6 w-6" />,title: "AI Property Assistant",     desc: "Ask anything about your portfolio and get instant AI-powered answers.",     color: "from-cyan-500 to-cyan-700" },
  ]

  const providers: Provider[] = [
    { icon: <Bolt className="h-5 w-5" />,       name: "Electricians",  desc: "Certified electrical installation & repairs", color: "text-yellow-400 bg-yellow-400/10" },
    { icon: <Droplets className="h-5 w-5" />,   name: "Plumbers",      desc: "Fast-response pipe and water system fixes",   color: "text-blue-400 bg-blue-400/10" },
    { icon: <Home className="h-5 w-5" />,       name: "Cleaners",      desc: "Professional cleaning for move-in/move-out",  color: "text-green-400 bg-green-400/10" },
    { icon: <Paintbrush className="h-5 w-5" />, name: "Painters",      desc: "Interior & exterior painting services",       color: "text-pink-400 bg-pink-400/10" },
    { icon: <Shield className="h-5 w-5" />,     name: "Security",      desc: "Vetted guards and CCTV installation teams",   color: "text-red-400 bg-red-400/10" },
    { icon: <Wrench className="h-5 w-5" />,     name: "Handymen",      desc: "General repairs and property maintenance",    color: "text-orange-400 bg-orange-400/10" },
  ]

  const statItems: StatItem[] = [
    { label: "Properties Managed",    value: String(stats.properties) },
    { label: "Active Tenants",        value: String(stats.tenants) },
    { label: "Verified Landlords",    value: String(stats.landlords) },
    { label: "Monthly Transactions",  value: String(stats.txns),  suffix: "M+" },
  ]

  const testimonials = [
    { name: "Adaeze Okonkwo",  role: "Landlord, Lagos",        body: "PRMS transformed how I manage my 6 properties. Rent collection is seamless and I always know the status of every unit.", stars: 5 },
    { name: "Emeka Eze",       role: "Tenant, Abuja",          body: "Found a verified apartment in 48 hours. The landlord was KYC-verified and the process was completely transparent.", stars: 5 },
    { name: "Fatima Al-Hassan", role: "Property Developer",    body: "The analytics dashboard alone is worth it. I can track ROI across my entire portfolio from one screen.", stars: 5 },
  ]

  return (
    <div className="min-h-screen bg-[#081A3A] text-white overflow-x-hidden font-sans">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.png" alt="" fill className="object-cover opacity-60" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081A3A]/40 via-[#081A3A]/20 to-[#081A3A]" />
        </div>

        {/* Ambient orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        </div>

        {/* Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {particles.map((p, i) => <Particle key={i} {...p} />)}
        </div>

        {/* Hero content */}
        <motion.div
          style={{ y: heroY }}
          className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center pt-20 pb-12 sm:pt-24 sm:pb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Nigeria&apos;s #1 Property Rental Management System
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            Ready to Experience the{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Future of Renting?
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-base sm:text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Join the property network that values verification, speed, and safety.
            Create an account in under 3 minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(59,130,246,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all"
              >
                Register as User <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/signup?role=landlord">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white font-bold text-base backdrop-blur-sm transition-all"
              >
                <Building2 className="h-4 w-4" /> Join as Landlord
              </motion.button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-3 sm:gap-6 mt-12 text-xs sm:text-sm text-blue-200/60"
          >
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-[#081A3A] bg-gradient-to-br from-blue-400 to-violet-500" />
              ))}
            </div>
            <span><strong className="text-white">4,500+</strong> tenants trust PRMS</span>
            <span className="hidden sm:flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1">4.9/5</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/40"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <Section className="py-16 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {statItems.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1">
                <Counter target={Number(s.value)} suffix={s.suffix} />
              </div>
              <div className="text-sm text-blue-200/60 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <Section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-4">
              <Zap className="h-3 w-3" /> Platform Features
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-4">
              Everything you need to manage{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                property at scale
              </span>
            </h2>
            <p className="text-blue-100/60 max-w-xl mx-auto text-lg">
              Built for Nigerian property owners and tenants who demand efficiency, transparency and trust.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-sm p-6 transition-all duration-300 cursor-default"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-blue-100/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <Section className="py-24 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-4">
              <Play className="h-3 w-3 fill-current" /> How It Works
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">3 minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
            {[
              { step: "01", icon: <Users className="h-5 w-5" />,      title: "Create Account",     desc: "Sign up in 3 minutes. Choose your role — tenant, landlord, or service provider." },
              { step: "02", icon: <ShieldCheck className="h-5 w-5" />, title: "Verify & Connect",  desc: "Complete KYC verification. Get matched with verified properties or tenants." },
              { step: "03", icon: <TrendingUp className="h-5 w-5" />,  title: "Manage & Grow",     desc: "Collect rent, track maintenance, view analytics and scale your portfolio." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-blue-800/30 border border-blue-500/30 mb-6 mx-auto">
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white">
                    {s.step}
                  </div>
                  <div className="text-blue-400">{s.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-blue-100/60 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── MARKETPLACE ───────────────────────────────────────────────────────── */}
      <Section id="marketplace" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold mb-4">
              <Globe className="h-3 w-3" /> Service Marketplace
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-4">
              Trusted service providers,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">on demand</span>
            </h2>
            <p className="text-blue-100/60 max-w-xl mx-auto text-lg">
              Every service provider on PRMS is vetted, rated, and insured. Book in seconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] p-6 flex items-start gap-4 transition-all cursor-default"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${p.color}`}>
                  {p.icon}
                </div>
                <div>
                  <div className="font-bold text-white mb-1">{p.name}</div>
                  <div className="text-sm text-blue-100/60">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.04 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold text-sm transition-all"
              >
                Browse All Providers <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <Section className="py-24 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-4">
              Loved by{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                thousands
              </span>
            </h2>
            <p className="text-blue-100/60 text-lg">Real stories from real PRMS users across Nigeria.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all"
              >
                <div className="flex mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed mb-6">&quot;{t.body}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-blue-200/60">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── WHY PRMS ────────────────────────────────────────────────────────── */}
      <Section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6">
                <Lock className="h-3 w-3" /> Built for Trust
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-6">
                Why PRMS beats every
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> alternative</span>
              </h2>
              <p className="text-blue-100/60 text-lg mb-8 leading-relaxed">
                Most platforms just list properties. PRMS manages the entire relationship — from verified onboarding to monthly rent collection and beyond.
              </p>
              <div className="space-y-4">
                {[
                  "KYC-verified landlords and tenants",
                  "End-to-end rent payment tracking",
                  "Real-time maintenance request system",
                  "AI-powered property recommendations",
                  "Compliant with Nigerian property laws",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                    <span className="text-blue-100/80 text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10 flex gap-4">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
                  >
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Feature highlight cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Smartphone className="h-5 w-5 text-blue-400" />, label: "Mobile First",      val: "iOS & Android ready" },
                { icon: <Globe className="h-5 w-5 text-emerald-400" />,   label: "Nigeria-wide",      val: "All 36 states covered" },
                { icon: <Lock className="h-5 w-5 text-violet-400" />,     label: "Bank-grade Security",val: "256-bit encryption" },
                { icon: <Zap className="h-5 w-5 text-yellow-400" />,      label: "Instant Payouts",   val: "Same-day processing" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="mb-3">{c.icon}</div>
                  <div className="text-sm font-bold text-white mb-1">{c.label}</div>
                  <div className="text-xs text-blue-200/60">{c.val}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <Section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div
            whileInView={{ scale: 1 }}
            initial={{ scale: 0.97 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-6 sm:p-10 md:p-16 text-center shadow-2xl shadow-blue-600/20"
          >
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-6">
                <Sparkles className="h-3 w-3" /> Limited Early Access
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                Start managing smarter today
              </h2>
              <p className="text-blue-100/80 text-lg max-w-xl mx-auto mb-8">
                Join thousands of landlords and tenants already using PRMS. Setup takes under 3 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.3)" }}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 font-black rounded-2xl text-base shadow-xl hover:bg-blue-50 transition-all"
                  >
                    Create Free Account
                  </motion.button>
                </Link>
                <Link href="/listings">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white font-bold rounded-2xl text-base hover:bg-white/10 transition-all"
                  >
                    Browse Properties
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#060F22] pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-12">
            {/* Brand */}
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
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                <span className="text-xs text-blue-200/50 ml-2">4.9 · 2,400+ reviews</span>
              </div>
            </div>

            {/* Links */}
            {[
              { heading: "Company",   links: [{ label: "About",      href: "/about" }, { label: "Features", href: "/features" }, { label: "Contact", href: "/contact" }] },
              { heading: "Resources", links: [{ label: "Listings",   href: "/listings" }, { label: "FAQ",   href: "/faq" }, { label: "Landlords", href: "/landlords" }] },
              { heading: "Legal",     links: [{ label: "Terms",      href: "/terms" }, { label: "Privacy",  href: "/privacy" }] },
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
