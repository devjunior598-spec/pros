"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { MarketingNavbar } from "@/components/marketing-navbar"
import { SiteFooter } from "@/components/site-footer"
import { formatCurrency } from "@/lib/utils"
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Wrench,
} from "lucide-react"

function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Array<{ id: string; title: string; price: number; address: string | null; city: string | null; bedrooms: number | null; bathrooms: number | null; images: string[] | null; image_url: string | null }>>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/public/home", { cache: "no-store" })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Unable to load homepage data")
        setFeaturedProperties(result.featuredProperties)
      } catch {
        setFeaturedProperties([])
      }
    }

    fetchStats()
  }, [])

  const tenantBenefits = [
    "Browse rental listings by city, state, or ZIP code",
    "Request an inspection from a listing",
    "Keep applications and documents organized",
    "Track lease and rent activity in one place",
  ]

  const landlordBenefits = [
    "Manage properties and availability",
    "Keep tenant and lease records together",
    "Track maintenance requests",
    "Review rent activity and upcoming renewals",
  ]

  const steps = [
    { title: "Search", description: "Browse verified listings by location, type, and budget." },
    { title: "Book inspection", description: "Schedule a visit and review property details with confidence." },
    { title: "Apply or list", description: "Apply for your next home or publish your property in minutes." },
    { title: "Manage online", description: "Track payments, maintenance, and communication from one dashboard." },
  ]

  const features = [
    { icon: <Wallet className="h-5 w-5" />, title: "Rent tracking", description: "Keep rent schedules, invoices, and payment history organized." },
    { icon: <Wrench className="h-5 w-5" />, title: "Maintenance requests", description: "Log issues and follow progress from request to completion." },
    { icon: <FileText className="h-5 w-5" />, title: "Lease agreements", description: "Create, review, and sign lease documents digitally." },
    { icon: <MessageSquare className="h-5 w-5" />, title: "Secure messaging", description: "Stay in touch with tenants, landlords, and service providers." },
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Verification system", description: "Build trust with verified identities and property records." },
    { icon: <Building2 className="h-5 w-5" />, title: "Inspection booking", description: "Coordinate visits and keep a clear history of property activity." },
  ]


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-prms-navy">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80"
              alt="Modern residential building"
              fill
              className="object-cover opacity-35 saturate-75"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080d1b] via-prms-navy/95 to-prms-navy/65" />
          </div>
          <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-prms-blue/25 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-prms-emerald/20 blur-3xl" />
          <div className="absolute inset-0 opacity-20 prms-dot-grid" />

          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-28">
            <div className="max-w-2xl text-white">
              <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 shadow-lg shadow-black/10 backdrop-blur">
                <ShieldCheck className="mr-2 h-4 w-4 text-prms-emerald" />
                U.S. rental operations, made clearer
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                Feel at home with <span className="text-blue-200">better rental management.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                A polished workspace for listings, applications, leases, rent activity, and maintenance — made for the way U.S. teams work.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/listings"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-prms-navy shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-white/90"
                >
                  Find a Home <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  List Your Property
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 fill-prms-gold text-prms-gold" /> Designed for easier decisions</span>
                <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-prms-emerald" /> Clear from search to move-in</span>
              </div>
            </div>

            <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-prms-navy">
                <span className="flex items-center gap-2"><Search className="h-4 w-4 text-prms-blue" /> Search U.S. rentals</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-prms-blue">Start exploring</span>
              </div>
              <div className="mt-5 grid gap-3">
                <label className="rounded-xl border border-border bg-secondary/55 px-3.5 py-3 text-sm transition focus-within:border-prms-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Location</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="Austin, TX or ZIP code" />
                </label>
                <label className="rounded-xl border border-border bg-secondary/55 px-3.5 py-3 text-sm transition focus-within:border-prms-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Property Type</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="Apartment, house, townhome" />
                </label>
                <label className="rounded-xl border border-border bg-secondary/55 px-3.5 py-3 text-sm transition focus-within:border-prms-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Budget</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="$2,500 / month" />
                </label>
                <Link
                  href="/listings"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-prms-blue text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Browse U.S. rentals
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-b-2xl border border-white/70 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] sm:grid-cols-3">
            {[
              [ShieldCheck, "Thoughtfully verified", "Clearer property information"],
              [Building2, "One calm workspace", "Everyday rental operations"],
              [MessageSquare, "Better communication", "Stay connected at every step"],
            ].map(([Icon, title, description], index) => {
              const TrustIcon = Icon as typeof ShieldCheck
              return (
                <div key={String(title)} className={`flex items-center gap-3 px-5 py-4 ${index < 2 ? "border-b border-border sm:border-b-0 sm:border-r" : ""}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-prms-blue"><TrustIcon className="h-4 w-4" /></div>
                  <div><p className="text-sm font-semibold text-prms-navy">{title as string}</p><p className="text-xs text-prms-slate">{description as string}</p></div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Featured Properties */}
        <Section className="py-20 sm:py-24" id="marketplace">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-prms-blue">Featured properties</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-prms-navy sm:text-4xl">
                  Find a place that fits your next move
                </h2>
              </div>
              <Link href="/listings" className="inline-flex items-center text-sm font-medium text-prms-blue transition hover:text-blue-700">
                View all properties <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {featuredProperties.length === 0 ? <div className="prms-surface prms-dot-grid px-6 py-14 text-center"><Building2 className="mx-auto h-9 w-9 text-prms-blue" /><p className="mt-4 text-base font-semibold text-prms-navy">New homes will appear here soon.</p><p className="mx-auto mt-2 max-w-md text-sm text-prms-slate">Once a landlord publishes a verified property, it will be ready for renters to discover.</p></div> : <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <div key={property.id} className="group overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_14px_36px_-26px_rgba(15,23,42,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-25px_rgba(15,23,42,0.42)]">
                  <div className="relative h-56 overflow-hidden">
                    <Image src={property.images?.[0] || property.image_url || "/hero-bg.png"} alt={property.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-prms-navy/55 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-prms-emerald shadow-sm backdrop-blur">
                      <ShieldCheck className="h-3 w-3" /> Available
                    </div>
                    <span className="absolute bottom-4 right-4 rounded-xl bg-white/95 px-3 py-1.5 text-sm font-bold text-prms-navy shadow-lg backdrop-blur">{formatCurrency(Number(property.price || 0))}<span className="ml-1 text-xs font-medium text-prms-slate">/mo</span></span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold tracking-tight text-prms-navy">{property.title}</h3>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-prms-blue">Featured</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-prms-slate">
                      <MapPin className="mr-1.5 h-4 w-4" /> {[property.address, property.city].filter(Boolean).join(", ") || "Location pending"}
                    </div>
                    <div className="mt-4 flex items-center gap-5 border-y border-border py-3 text-sm text-prms-slate">
                      <span className="flex items-center"><BedDouble className="mr-1.5 h-4 w-4 text-prms-blue" /> {property.bedrooms || 0} beds</span>
                      <span className="flex items-center"><Bath className="mr-1.5 h-4 w-4 text-prms-blue" /> {property.bathrooms || 0} baths</span>
                    </div>
                    <Link href={`/listings/${property.id}`} className="mt-4 inline-flex items-center text-sm font-semibold text-prms-blue transition hover:gap-2 hover:text-blue-700">
                      Explore this home <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        </Section>

        {/* For Tenants / Landlords */}
        <Section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-8 sm:p-10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/40 blur-2xl" />
              <div className="relative"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-prms-blue">For tenants</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-prms-navy">Move in with clarity and confidence.</h3>
              <ul className="mt-5 space-y-3 text-sm text-prms-slate">
                {tenantBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prms-emerald" /> {item}
                  </li>
                ))}
              </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-8 sm:p-10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl" />
              <div className="relative"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">For landlords</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-prms-navy">Operate your portfolio with less friction.</h3>
              <ul className="mt-5 space-y-3 text-sm text-prms-slate">
                {landlordBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prms-emerald" /> {item}
                  </li>
                ))}
              </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* How it works */}
        <Section className="py-20 sm:py-24" id="how-it-works">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-prms-blue">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-prms-navy sm:text-4xl">
                A simple flow for everyday property decisions
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="group rounded-3xl border border-border bg-white p-6 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.5)] transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition group-hover:bg-primary group-hover:text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-prms-navy">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-prms-slate">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Features */}
        <Section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-prms-blue">Platform features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-prms-navy sm:text-4xl">
                Everything you need to run properties professionally
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="group rounded-3xl border border-border bg-secondary/25 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_16px_36px_-25px_rgba(15,23,42,0.45)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-prms-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-prms-slate">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* CTA */}
        <Section className="bg-white pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-prms-navy px-6 py-10 sm:px-10 lg:py-14">
              <div className="absolute -right-14 -top-24 h-72 w-72 rounded-full bg-prms-blue/35 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-prms-emerald/20 blur-3xl" />
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">Ready when you are</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Start managing property the smarter way
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-white/70">
                    Tools for U.S. landlords, tenants, and property teams to stay organized.
                  </p>
                </div>
                <div className="relative flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-prms-navy transition hover:-translate-y-0.5 hover:bg-white/90">
                    Create Account
                  </Link>
                  <Link href="/listings" className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                    Browse Properties
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <SiteFooter />

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-white/95 px-3 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur md:hidden pb-safe">
        <div className="flex gap-2">
          <Link href="/listings" className="flex-1 min-h-[44px] rounded-lg border border-border py-2.5 text-center text-sm font-medium text-prms-navy">
            Find a Home
          </Link>
          <Link href="/signup" className="flex-1 min-h-[44px] rounded-lg bg-prms-blue py-2.5 text-center text-sm font-semibold text-white">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
