"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/types"
import Link from "next/link"
import { 
  Search, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Home, 
  Wrench, 
  ChevronRight, 
  Star,
  Sparkles,
  Calculator,
  Percent,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Users,
  MapPin,
  HelpCircle,
  Building2,
  Building,
  ArrowUpRight,
  TrendingDown
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import CurvedLoop from "@/components/ui/curved-loop"
import CircularText from "@/components/ui/circular-text"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion, AnimatePresence } from "motion/react"

export default function IndexPage() {
  const router = useRouter()
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchTab, setSearchTab] = useState<"rent" | "provider">("rent")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [searchPrice, setSearchPrice] = useState("")
  const [searchType, setSearchType] = useState("")

  // Calculator state
  const [calcTab, setCalcTab] = useState<"landlord" | "tenant">("landlord")
  const [propertyValue, setPropertyValue] = useState<number>(35000000) // 35M Naira
  const [monthlyRent, setMonthlyRent] = useState<number>(200000) // 200k Naira
  const [monthlyIncome, setMonthlyIncome] = useState<number>(600000) // 600k Naira
  const [expectedRent, setExpectedRent] = useState<number>(150000) // 150k Naira

  // Showcase state
  const [showcaseTab, setShowcaseTab] = useState<"landlord" | "tenant" | "provider">("tenant")

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available')
          .limit(3)
          .order('created_at', { ascending: false })

        if (error) throw error
        setFeaturedProperties(data || [])
      } catch (error: any) {
        console.error("Error fetching featured properties:", error?.message || error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTab === "rent") {
      let params = []
      if (searchQuery.trim()) params.push(`q=${encodeURIComponent(searchQuery.trim())}`)
      if (searchLocation.trim()) params.push(`location=${encodeURIComponent(searchLocation.trim())}`)
      if (searchType) params.push(`type=${encodeURIComponent(searchType)}`)
      if (searchPrice) params.push(`price=${encodeURIComponent(searchPrice)}`)
      
      const queryString = params.length > 0 ? `?${params.join("&")}` : ""
      router.push(`/listings${queryString}`)
    } else {
      router.push(`/providers?q=${encodeURIComponent(searchQuery.trim())}&location=${encodeURIComponent(searchLocation.trim())}`)
    }
  }

  // Calculator computations
  const annualRentIncome = monthlyRent * 12
  const grossYield = propertyValue > 0 ? (annualRentIncome / propertyValue) * 100 : 0
  
  const recommendedRentLimit = monthlyIncome * 0.3
  const rentToIncomeRatio = monthlyIncome > 0 ? (expectedRent / monthlyIncome) * 100 : 0
  const isRentAffordable = expectedRent <= recommendedRentLimit

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
      
      {/* 1. IMMERSIVE HERO SECTION WITH BACKDROP GLOW */}
      <section className="relative w-full pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-slate-900 text-white">
        
        {/* Subtle dynamic backdrop blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Dynamic stamp/badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 tracking-wide">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-400" />
                Next-Gen Property Rental Platform
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                Rent, Manage & Maintain with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                  Absolute Ease.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed">
                Connect trust-verified landlords, quality tenants, and vetted handymen inside Nigeria's ultimate property technology ecosystem.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-600/30">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/listings">
                  <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800">
                    Explore Listings
                  </Button>
                </Link>
              </div>

              {/* Real-time users proof */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800/80 max-w-md">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-semibold text-slate-200">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Over 5,000+ Users
                  </div>
                  Verified Rent Wallet & Tenant Profiles
                </div>
              </div>

            </div>

            {/* Right Hero Content - Interactive Dashboard Preview Card */}
            <div className="lg:col-span-5 relative">
              
              {/* Circular text loop in background */}
              <div className="absolute -right-6 -top-12 z-0 hidden sm:flex opacity-30 text-indigo-400">
                <CircularText
                  text="HOUSEDO • INTEGRITY • VERIFIED • ESCROW • "
                  spinDuration={30}
                  className="text-[9px] font-bold uppercase tracking-wider"
                />
              </div>

              <div className="relative z-10 w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-md">
                
                {/* Floating Micro-badge */}
                <div className="absolute -top-4 -left-4 rounded-xl bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 shadow-lg tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Escrow Secure
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Tenant Wallet Balance</h3>
                    <p className="text-xs text-slate-400">Real-time digital ledger</p>
                  </div>
                  <span className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-400 font-mono">
                    NGN ₦
                  </span>
                </div>

                <div className="py-6 space-y-4">
                  <div>
                    <span className="text-2xl font-black text-slate-100">₦1,240,500.00</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
                      <TrendingUp className="h-3 w-3" /> +12.4% yield this month
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Utility bills processed</span>
                      <span className="text-slate-200 font-semibold">98.2% auto-pay</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-[80%] rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Tenancies</h4>
                  <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">Lekki Haven Apt 4</p>
                        <p className="text-[10px] text-slate-500">Tenant: Amara K.</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                      Paid
                    </span>
                  </div>
                  
                  <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">AC Repair Requested</p>
                        <p className="text-[10px] text-slate-500">Provider: Junior Tech</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[9px] font-semibold text-yellow-400">
                      Assigned
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. DYNAMIC TABBED SEARCH & FILTER BAR */}
      <div className="container relative z-20 -mt-10 px-4 mx-auto font-sans">
        <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900 dark:text-slate-100">
          
          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => { setSearchTab("rent"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                searchTab === "rent"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
              }`}
            >
              <Home className="h-4 w-4" />
              Rent a Property
            </button>
            <button
              type="button"
              onClick={() => { setSearchTab("provider"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                searchTab === "provider"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
              }`}
            >
              <Wrench className="h-4 w-4" />
              Find Handyman / Provider
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {searchTab === "rent" ? (
              <>
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Keywords</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                      placeholder="E.g., Lekki Penthouse, pool..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    <Input
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                      placeholder="City or state..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 gap-2 font-sans">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Type</label>
                    <select
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="">Any</option>
                      <option value="apartment">Apartment</option>
                      <option value="duplex">Duplex</option>
                      <option value="flat">Flat</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Max Budget</label>
                    <select
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100"
                      value={searchPrice}
                      onChange={(e) => setSearchPrice(e.target.value)}
                    >
                      <option value="">Any</option>
                      <option value="1000000">₦1M</option>
                      <option value="3000000">₦3M</option>
                      <option value="5000000">₦5M</option>
                      <option value="10000000">₦10M+</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">What service do you need?</label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                      placeholder="Plumber, Electrician, AC Repair, Cleaning..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    <Input
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                      placeholder="City or district..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-md shadow-blue-600/10">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Curved loop brand marquee */}
      <section className="w-full py-10 overflow-hidden bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400">
        <CurvedLoop
          marqueeText="VERIFIED LANDLORDS ✦ SECURE TENANCY ✦ ACCREDITED PROVIDERS ✦ INSTANT PAYOUTS ✦ NO AGENT FEE SCAMS ✦"
          speed={1.2}
          curveAmount={50}
          containerClassName="min-h-[100px]"
          className="text-slate-900 dark:text-white uppercase font-extrabold tracking-wider text-xs"
        />
      </section>

      {/* 3. PLATFORM STATS GRID */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="text-center pt-6 lg:pt-0">
              <span className="block text-4xl font-extrabold text-blue-600">₦200M+</span>
              <span className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">Escrow Rent Processed</span>
            </div>
            <div className="text-center pt-6 lg:pt-0">
              <span className="block text-4xl font-extrabold text-slate-800 dark:text-slate-100">1,500+</span>
              <span className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">Verified Listings</span>
            </div>
            <div className="text-center pt-6 lg:pt-0">
              <span className="block text-4xl font-extrabold text-slate-800 dark:text-slate-100">99.8%</span>
              <span className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">Dispute-Free Tenancy</span>
            </div>
            <div className="text-center pt-6 lg:pt-0">
              <span className="block text-4xl font-extrabold text-emerald-500">24 Hours</span>
              <span className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">Average Fix Dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC SHOWCASE TAB SECTION */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Designed For the Entire Rental Ecosystem
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Choose your profile and experience how PRMS automates rent, management, and repairs.
            </p>

            {/* Custom Interactive Tab Buttons */}
            <div className="flex justify-center gap-2 mt-8 max-w-md mx-auto p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowcaseTab("tenant")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  showcaseTab === "tenant"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                For Tenants
              </button>
              <button
                type="button"
                onClick={() => setShowcaseTab("landlord")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  showcaseTab === "landlord"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                For Landlords
              </button>
              <button
                type="button"
                onClick={() => setShowcaseTab("provider")}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  showcaseTab === "provider"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                For Providers
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="grid lg:grid-cols-2 gap-12 items-center bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-900 dark:text-slate-100">
            
            {/* Left Content Description */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {showcaseTab === "tenant" && (
                  <motion.div
                    key="tenant"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <Home className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Scam-Free Rental Journey</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Say goodbye to fake agents and locked down cash. PRMS verifies listings and holds rental deposits securely, ensuring a seamless onboarding.
                    </p>
                    <ul className="space-y-3 font-semibold text-sm">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                        Direct landlords chat — no middleman scams.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                        Built-in secure digital wallet for flexible payments.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                        Tap-to-request maintenance from accredited experts.
                      </li>
                    </ul>
                    <Link href="/listings" className="inline-block pt-2">
                      <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6">
                        Browse Homes Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}

                {showcaseTab === "landlord" && (
                  <motion.div
                    key="landlord"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Automate Yields & Properties</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Optimize your cashflow. Collect rents directly via automated bank-connected wallets, verify tenants dynamically, and resolve upkeep requests instantly.
                    </p>
                    <ul className="space-y-3 font-semibold text-sm">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        KYC-Verified tenant checks & credit scores.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        Automate ledger book-keeping & instant payouts.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        Fast maintenance dispatch center with repair bidding.
                      </li>
                    </ul>
                    <Link href="/signup" className="inline-block pt-2">
                      <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6">
                        Setup Your Properties <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}

                {showcaseTab === "provider" && (
                  <motion.div
                    key="provider"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Grow Your Handyman Business</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Receive local job leads from active landlords. Bid on tasks, perform high-rated work, and unlock instant, guaranteed payouts.
                    </p>
                    <ul className="space-y-3 font-semibold text-sm">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Steady stream of plumbing, electrical & cleaning requests.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Escrow-guaranteed payouts — never chase payments again.
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Transparent ratings to build reputation and credibility.
                      </li>
                    </ul>
                    <Link href="/provider-signup" className="inline-block pt-2">
                      <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6">
                        Join Service Directory <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Graphic Mockup */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col justify-center items-center min-h-[300px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
              
              <AnimatePresence mode="wait">
                {showcaseTab === "tenant" && (
                  <motion.div
                    key="tenant-mock"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-sm space-y-4 relative z-10"
                  >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400">Lease Agreement status</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Verifying</span>
                      </div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-100">3 Bedroom Apartment</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3 text-red-500" /> Phase 1, Lekki</p>
                      
                      <div className="mt-4 pt-3 border-t border-slate-105 dark:border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-400">Total rent value</p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200">₦3,200,000 /yr</p>
                        </div>
                        <Button size="sm" className="h-8 text-xs bg-indigo-600 text-white rounded-lg">Sign Doc</Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showcaseTab === "landlord" && (
                  <motion.div
                    key="landlord-mock"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-sm space-y-4 relative z-10"
                  >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Occupancy Rate</span>
                        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">94% Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-[10px] text-slate-400">Properties</p>
                          <p className="text-lg font-black text-slate-800 dark:text-slate-100">12</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-[10px] text-slate-400">Total Revenue</p>
                          <p className="text-lg font-black text-blue-600">₦18.4M</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showcaseTab === "provider" && (
                  <motion.div
                    key="provider-mock"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-sm space-y-4 relative z-10"
                  >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Incoming Bids</span>
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-805 dark:text-slate-100">Burst pipe fixing</p>
                          <p className="text-[10px] text-slate-400">Lekki Gardens • 2.1km away</p>
                        </div>
                        <span className="font-bold text-emerald-500">₦45,000</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE YIELD & RENT CALCULATOR */}
      <section className="py-24 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-4">
              <Calculator className="h-3.5 w-3.5" />
              Calculators
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Know Your Numbers</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
              Simulate investment yields or calculate your rent affordability with our interactive tools.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
            
            {/* Calculator Control Area */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Tab Toggle */}
              <div className="flex gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm">
                <button
                  type="button"
                  onClick={() => setCalcTab("landlord")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    calcTab === "landlord"
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Landlord Yield (ROI)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcTab("tenant")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    calcTab === "tenant"
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tenant Affordability
                </button>
              </div>

              {calcTab === "landlord" ? (
                <div className="space-y-6">
                  {/* Property Value Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-500">Property Value</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">₦{propertyValue.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="5000000"
                      max="150000000"
                      step="1000000"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₦5M</span>
                      <span>₦150M</span>
                    </div>
                  </div>

                  {/* Monthly Rent Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-500">Estimated Monthly Rent</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">₦{monthlyRent.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="2000000"
                      step="10000"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₦50k</span>
                      <span>₦2M</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Monthly Income Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-500">Monthly Net Income</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">₦{monthlyIncome.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="100000"
                      max="3000000"
                      step="20000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₦100k</span>
                      <span>₦3M</span>
                    </div>
                  </div>

                  {/* Expected Rent Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-500">Target Monthly Rent</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">₦{expectedRent.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="30000"
                      max="1000000"
                      step="5000"
                      value={expectedRent}
                      onChange={(e) => setExpectedRent(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₦30k</span>
                      <span>₦1M</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Calculator Display Output */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[220px] text-slate-900 dark:text-slate-100">
              {calcTab === "landlord" ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Percent className="h-4 w-4 text-blue-500" /> Expected Gross ROI
                    </div>
                    
                    <div>
                      <span className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white">
                        {grossYield.toFixed(2)}%
                      </span>
                      <span className="text-xs font-bold text-slate-400 block mt-1">Estimated annual return</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Annual rent:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">₦{annualRentIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/signup" className="mt-4">
                    <Button className="w-full bg-slate-950 dark:bg-slate-50 text-white dark:text-slate-900 font-bold hover:opacity-90">
                      List & Start Earning
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Wallet className="h-4 w-4 text-blue-500" /> Recommended Rent Limit
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        isRentAffordable 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" 
                          : "bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse"
                      }`}>
                        {isRentAffordable ? "Affordable" : "Over Budget"}
                      </span>
                    </div>

                    <div>
                      <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white">
                        ₦{recommendedRentLimit.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-1">Recommended max rent/month (30% rule)</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rent-to-income:</span>
                        <span className={`font-bold ${rentToIncomeRatio > 30 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                          {rentToIncomeRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href="/listings" className="mt-4">
                    <Button className="w-full bg-slate-950 dark:bg-slate-50 text-white dark:text-slate-900 font-bold hover:opacity-90">
                      Search Affordable Homes
                    </Button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 6. REDESIGNED FEATURED LISTINGS GRID */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Latest Verified Listings</h2>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl">
                Explore handpicked properties vetted for ownership integrity. Fully ready to move in.
              </p>
            </div>
            <Link href="/listings">
              <Button variant="outline" className="rounded-full px-6 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                Explore All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
              <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-500">No properties available yet.</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Properties listed on our platform are thoroughly vetted before they show up publicly.</p>
            </div>
          )}
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-205 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-550 dark:text-slate-400">
              <HelpCircle className="h-4 w-4" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
              Everything you need to know about secure rentals, wallet accounts, and maintenance processes.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-1" className="border border-slate-200 dark:border-slate-800 rounded-2xl px-5 bg-slate-50/50 dark:bg-slate-950/40">
              <AccordionTrigger className="font-bold hover:no-underline text-left text-slate-850 dark:text-slate-200 py-5">
                Is rent payment secured in escrow?
              </AccordionTrigger>
              <AccordionContent className="text-slate-500 dark:text-slate-400 leading-relaxed pb-5 text-sm">
                Yes! When a tenant makes a rent payment, the funds are safely processed into our verified wallet system. For key services and lease deposits, payouts are securely held in escrow until lease agreements are digitally signed and finalized by both parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border border-slate-200 dark:border-slate-800 rounded-2xl px-5 bg-slate-50/50 dark:bg-slate-950/40">
              <AccordionTrigger className="font-bold hover:no-underline text-left text-slate-855 dark:text-slate-200 py-5">
                How does landlord KYC work?
              </AccordionTrigger>
              <AccordionContent className="text-slate-500 dark:text-slate-400 leading-relaxed pb-5 text-sm">
                To guarantee scam-free listings, all landlords must supply official government identification alongside verify-proven property ownership deeds (C of O) before listing. Vetted landlords receive a verified profile badge.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border border-slate-200 dark:border-slate-800 rounded-2xl px-5 bg-slate-50/50 dark:bg-slate-950/40">
              <AccordionTrigger className="font-bold hover:no-underline text-left text-slate-855 dark:text-slate-200 py-5">
                How do handymen join the platform?
              </AccordionTrigger>
              <AccordionContent className="text-slate-500 dark:text-slate-400 leading-relaxed pb-5 text-sm">
                Service providers apply by submitting business registration details or professional certifications. Once verified, they join our marketplace and receive real-time, geolocated repair requests from landlords and tenants.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border border-slate-200 dark:border-slate-800 rounded-2xl px-5 bg-slate-50/50 dark:bg-slate-950/40">
              <AccordionTrigger className="font-bold hover:no-underline text-left text-slate-855 dark:text-slate-200 py-5">
                Are there automated bills reminders?
              </AccordionTrigger>
              <AccordionContent className="text-slate-500 dark:text-slate-400 leading-relaxed pb-5 text-sm">
                Absolutely. Tenants can easily set up automated wallet triggers to auto-pay monthly building fees, power tokens, or water supply bills directly to the estate ledger.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 8. DYNAMIC CALL TO ACTION BANNER */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-3xl" />
        
        <div className="container relative z-10 px-4 mx-auto text-center space-y-6 max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Experience the Future of Renting?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join the property network that values verification, speed, and safety. Create an account in under 3 minutes.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20">
                Register as User
              </Button>
            </Link>
            <Link href="/provider-signup" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 rounded-xl border-slate-800 text-slate-200 hover:bg-slate-900 text-base">
                Register as Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
