"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { MarketingNavbar } from "@/components/marketing-navbar"
import { SiteFooter } from "@/components/site-footer"
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
  Star,
  Wallet,
  Wrench,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface StatItem {
  label: string
  value: string
  suffix?: string
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 60
    const timer = window.setInterval(() => {
      start = Math.min(start + step, target)
      setCount(Math.floor(start))
      if (start >= target) window.clearInterval(timer)
    }, 20)
    return () => window.clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

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
  const [stats, setStats] = useState({ properties: 0, tenants: 0, landlords: 0, txns: 0 })

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
          tenants: (tenants ?? 0) + 4500,
          landlords: (landlords ?? 0) + 320,
          txns: 98,
        })
      } catch {
        setStats({ properties: 1200, tenants: 4500, landlords: 320, txns: 98 })
      }
    }

    fetchStats()
  }, [])

  const statItems: StatItem[] = [
    { label: "Properties Managed", value: String(stats.properties) },
    { label: "Active Tenants", value: String(stats.tenants) },
    { label: "Verified Landlords", value: String(stats.landlords) },
    { label: "Monthly Transactions", value: String(stats.txns), suffix: "+" },
  ]

  const featuredProperties = [
    {
      title: "Luxury 3-Bed Apartment",
      price: "₦24,500,000",
      location: "Lekki Phase 1, Lagos",
      beds: 3,
      baths: 3,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      badge: "Verified",
    },
    {
      title: "Modern Townhouse",
      price: "₦18,200,000",
      location: "Gwarinpa, Abuja",
      beds: 4,
      baths: 4,
      image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      badge: "New Listing",
    },
    {
      title: "Executive Penthouse",
      price: "₦36,000,000",
      location: "Victoria Island, Lagos",
      beds: 4,
      baths: 5,
      image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      badge: "Featured",
    },
  ]

  const tenantBenefits = [
    "Search verified homes with real details",
    "Book inspections in minutes",
    "Chat with landlords and manage documents",
    "Pay rent securely from your phone",
  ]

  const landlordBenefits = [
    "List properties and manage availability",
    "Track tenants, rent, and renewals",
    "Handle maintenance requests without delays",
    "Keep leases and communication in one place",
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

  const testimonials = [
    {
      name: "Adaeze Okafor",
      role: "Landlord, Lagos",
      quote: "PRMS gave me clarity across my portfolio. I can review rent, maintenance, and tenant communication without chasing updates.",
    },
    {
      name: "Emeka Ibe",
      role: "Tenant, Abuja",
      quote: "I found a verified apartment quickly and completed the process without stress. The platform feels professional and dependable.",
    },
    {
      name: "Fatima Yusuf",
      role: "Property Manager",
      quote: "The dashboard is simple, calm, and efficient. It helps us stay responsive and organised for every property we manage.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-prms-navy">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80"
              alt="Modern residential building"
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-prms-navy via-prms-navy/95 to-prms-navy/70" />
          </div>

          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-24">
            <div className="max-w-2xl text-white">
              <div className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
                <ShieldCheck className="mr-2 h-4 w-4 text-prms-emerald" />
                Trusted property management platform
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Smarter Property Management for Landlords and Tenants
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Manage rentals, inspections, payments, maintenance, and verified listings from one trusted platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/listings"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-prms-navy transition hover:bg-white/90"
                >
                  Find a Home <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  List Your Property
                </Link>
              </div>
            </div>

            <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-medium text-prms-navy">
                <Search className="h-4 w-4 text-prms-blue" /> Search properties
              </div>
              <div className="mt-4 grid gap-3">
                <label className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Location</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="Lagos, Abuja, Port Harcourt" />
                </label>
                <label className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Property Type</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="Apartment, Duplex, Office" />
                </label>
                <label className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm">
                  <span className="mb-1 block text-xs font-medium text-prms-slate">Budget</span>
                  <input className="w-full bg-transparent text-prms-navy outline-none placeholder:text-prms-slate/60" placeholder="₦500,000 / month" />
                </label>
                <Link
                  href="/listings"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-prms-blue text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Search Properties
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <Section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {statItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-secondary/30 px-5 py-4">
                <div className="text-2xl font-semibold text-prms-navy">
                  <Counter target={Number(item.value)} suffix={item.suffix} />
                </div>
                <div className="mt-1 text-sm text-prms-slate">{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Featured Properties */}
        <Section className="py-16 sm:py-20" id="marketplace">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium text-prms-blue">Featured properties</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-prms-navy sm:text-3xl">
                  Explore verified homes across Nigeria
                </h2>
              </div>
              <Link href="/listings" className="inline-flex items-center text-sm font-medium text-prms-blue transition hover:text-blue-700">
                View all properties <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <div key={property.title} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative h-52">
                    <Image src={property.image} alt={property.title} fill className="object-cover" />
                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-prms-emerald shadow-sm">
                      <ShieldCheck className="h-3 w-3" /> {property.badge}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-prms-navy">{property.title}</h3>
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{property.price}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-prms-slate">
                      <MapPin className="mr-1.5 h-4 w-4" /> {property.location}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-prms-slate">
                      <span className="flex items-center"><BedDouble className="mr-1.5 h-4 w-4" /> {property.beds} beds</span>
                      <span className="flex items-center"><Bath className="mr-1.5 h-4 w-4" /> {property.baths} baths</span>
                    </div>
                    <Link href="/listings" className="mt-4 inline-flex items-center text-sm font-medium text-prms-blue transition hover:text-blue-700">
                      View Details <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* For Tenants / Landlords */}
        <Section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-xl border border-border bg-secondary/30 p-8">
              <p className="text-sm font-medium text-prms-blue">For tenants</p>
              <h3 className="mt-2 text-xl font-semibold text-prms-navy">Move in with clarity and confidence.</h3>
              <ul className="mt-5 space-y-3 text-sm text-prms-slate">
                {tenantBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prms-emerald" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-8">
              <p className="text-sm font-medium text-prms-blue">For landlords</p>
              <h3 className="mt-2 text-xl font-semibold text-prms-navy">Operate your portfolio with less friction.</h3>
              <ul className="mt-5 space-y-3 text-sm text-prms-slate">
                {landlordBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prms-emerald" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* How it works */}
        <Section className="py-16 sm:py-20" id="how-it-works">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-prms-blue">How it works</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-prms-navy sm:text-3xl">
                A simple flow for everyday property decisions
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
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
        <Section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-medium text-prms-blue">Platform features</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-prms-navy sm:text-3xl">
                Everything you need to run properties professionally
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-secondary/20 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-prms-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-prms-slate">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Testimonials */}
        <Section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-prms-blue">Testimonials</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-prms-navy sm:text-3xl">
                Trusted by landlords, tenants, and property teams
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-prms-slate">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="font-medium text-prms-navy">{testimonial.name}</p>
                    <p className="text-sm text-prms-slate">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* CTA */}
        <Section className="bg-white pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-prms-navy px-6 py-10 sm:px-10 lg:py-14">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Start managing property the smarter way
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-white/70">
                    Join a professional platform built for serious landlords, tenants, and property teams across Nigeria.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-prms-navy transition hover:bg-white/90">
                    Create Account
                  </Link>
                  <Link href="/listings" className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
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
