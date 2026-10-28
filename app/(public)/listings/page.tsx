"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/types"
import { motion } from "motion/react"
import {
  Search,
  Loader2,
  X,
  SlidersHorizontal,
  Home,
  LayoutList,
} from "lucide-react"
import { PublicPageShell } from "@/components/public-page-shell"

// ─── Helper: check if any filter is active ────────────────────────────────────
function hasActiveFilters(
  searchQuery: string,
  propertyType: string,
  priceRange: string,
  bedrooms: string,
  bathrooms: string,
  availableNow: boolean,
  showSavedOnly: boolean
) {
  return (
    searchQuery.trim() !== "" ||
    propertyType !== "all" ||
    priceRange !== "all" ||
    bedrooms !== "all" ||
    bathrooms !== "all" ||
    availableNow ||
    showSavedOnly
  )
}

// ─── Styled select wrapper ────────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[130px]">
      <label className="px-1 text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {children}
      </select>
    </div>
  )
}

// ─── Listings Content (needs Suspense for useSearchParams) ────────────────────
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return "An unexpected error occurred."
}

function ListingsContent() {
  const searchParams = useSearchParams()
  const purpose = searchParams.get("purpose") === "sale" ? "sale" : "rent"

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<string>("all")
  const [bedrooms, setBedrooms] = useState<string>("all")
  const [bathrooms, setBathrooms] = useState<string>("all")
  const [availableNow, setAvailableNow] = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])

  // ── Load saved properties from localStorage ──────────────────────────────
  const loadSavedList = useCallback(() => {
    const saved = localStorage.getItem("saved_properties")
    if (saved) {
      setSavedIds(JSON.parse(saved) as string[])
    } else {
      setSavedIds([])
    }
  }, [])

  useEffect(() => {
    loadSavedList()
    window.addEventListener("saved_properties_changed", loadSavedList)
    return () => {
      window.removeEventListener("saved_properties_changed", loadSavedList)
    }
  }, [loadSavedList])

  // ── Supabase fetch ───────────────────────────────────────────────────────
  const fetchProperties = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setLoadError("")
      try {
        let query = supabase
          .from("properties")
          .select("*")
          .eq("country", "United States")
          .eq("status", "available")
          .eq("publication_status", "published")
          .in("listing_purpose", purpose === "sale" ? ["sale", "both"] : ["rent", "both"])

        if (searchQuery.trim()) {
          const q = searchQuery.trim().slice(0, 100).replace(/[^a-zA-Z0-9\s-]/g, "")
          query = query.or(
            `city.ilike.%${q}%,state.ilike.%${q}%,area.ilike.%${q}%,title.ilike.%${q}%,zip_code.ilike.%${q}%`
          )
        }

        if (propertyType !== "all") {
          query = query.eq("type", propertyType)
        }

        if (bedrooms !== "all") {
          if (bedrooms === "4+") {
            query = query.gte("bedrooms", 4)
          } else {
            query = query.eq("bedrooms", parseInt(bedrooms))
          }
        }

        if (bathrooms !== "all") {
          if (bathrooms === "3+") {
            query = query.gte("bathrooms", 3)
          } else {
            query = query.eq("bathrooms", parseInt(bathrooms))
          }
        }

        if (availableNow) {
          query = query.eq("status", "available")
          .eq("publication_status", "published")
        }

        if (priceRange !== "all") {
          const [min, max] = priceRange.split("-").map(Number)
          if (max) {
            query = query.gte(purpose === "sale" ? "sale_price" : "price", min).lte(purpose === "sale" ? "sale_price" : "price", max)
          } else {
            query = query.gte(purpose === "sale" ? "sale_price" : "price", min)
          }
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        })

        if (error) throw error

        if (!signal?.aborted) {
          let list = data || []
          if (showSavedOnly) {
            list = list.filter((p) => savedIds.includes(p.id))
          }
          setProperties(list)
        }
      } catch (error: unknown) {
        const message = getErrorMessage(error)
        if (
          message === "AbortError" ||
          message.toLowerCase().includes("aborted") ||
          message.includes("AbortError")
        )
          return
        console.error("Error fetching properties:", message)
        if (!signal?.aborted) {
          setProperties([])
          setLoadError("Could not load listings. Please try again.")
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [searchQuery, propertyType, priceRange, bedrooms, bathrooms, availableNow, showSavedOnly, savedIds, purpose]
  )

  // Sync search params
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setSearchQuery(q)
  }, [searchParams])

  useEffect(() => {
    setPriceRange("all")
    setPropertyType("all")
  }, [purpose])

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties()
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [fetchProperties])

  const resetFilters = () => {
    setSearchQuery("")
    setPropertyType("all")
    setPriceRange("all")
    setBedrooms("all")
    setBathrooms("all")
    setAvailableNow(false)
    setShowSavedOnly(false)
  }

  const filtersActive = hasActiveFilters(
    searchQuery,
    propertyType,
    priceRange,
    bedrooms,
    bathrooms,
    availableNow,
    showSavedOnly
  )

  return (
    <PublicPageShell
      pageTitle={purpose === "sale" ? "Buy a Property" : "Find a Rental"}
      pageSubtitle={purpose === "sale" ? "Explore U.S. homes and land for sale, then contact the owner to arrange a viewing." : "Browse rental homes across the United States by city, state, and ZIP code."}
      badge="Property Marketplace"
      showBanner={true}
    >
      <div className="mx-auto max-w-7xl px-4 pb-20 md:px-8">

        <div className="mb-6 flex gap-2 rounded-xl border border-border bg-white p-1.5 shadow-sm" aria-label="Listing purpose">
          <Link href="/listings?purpose=rent" className={`flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${purpose === "rent" ? "bg-prms-blue text-white" : "text-prms-slate hover:bg-secondary"}`}>Rent</Link>
          <Link href="/listings?purpose=sale" className={`flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${purpose === "sale" ? "bg-prms-blue text-white" : "text-prms-slate hover:bg-secondary"}`}>Buy</Link>
        </div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 rounded-xl border border-border bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4">

            <div className="w-full">
              <label className="mb-1 block px-1 text-xs font-medium text-slate-600">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search by location or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-10 text-sm text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
              <FilterSelect
                label="Property Type"
                value={propertyType}
                onChange={(value) => { setPropertyType(value); if (value === "Land") { setBedrooms("all"); setBathrooms("all") } }}
              >
                <option value="all">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
                <option value="Studio">Studio</option>
                <option value="Duplex">Duplex</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Single-Family Home">Single-Family Home</option>
                {purpose === "sale" && <option value="Land">Land</option>}
              </FilterSelect>

              <FilterSelect
                label="Price Range"
                value={priceRange}
                onChange={setPriceRange}
              >
                <option value="all">Any Price</option>
                {purpose === "sale" ? <>
                  <option value="0-200000">Under $200,000</option>
                  <option value="200000-400000">$200,000 – $400,000</option>
                  <option value="400000-600000">$400,000 – $600,000</option>
                  <option value="600000-1000000">$600,000 – $1,000,000</option>
                  <option value="1000000">Above $1,000,000</option>
                </> : <>
                  <option value="0-1000">Under $1,000</option>
                  <option value="1000-2000">$1,000 – $2,000</option>
                  <option value="2000-3000">$2,000 – $3,000</option>
                  <option value="3000-5000">$3,000 – $5,000</option>
                  <option value="5000-10000">$5,000 – $10,000</option>
                  <option value="10000">Above $10,000</option>
                </>}
              </FilterSelect>

              {propertyType !== "Land" && <FilterSelect
                label="Bedrooms"
                value={bedrooms}
                onChange={setBedrooms}
              >
                <option value="all">Any Beds</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4+">4+ Beds</option>
              </FilterSelect>}

              {propertyType !== "Land" && <FilterSelect
                label="Bathrooms"
                value={bathrooms}
                onChange={setBathrooms}
              >
                <option value="all">Any Baths</option>
                <option value="1">1 Bath</option>
                <option value="2">2 Baths</option>
                <option value="3+">3+ Baths</option>
              </FilterSelect>}

              {/* Saved toggle */}
              <div className="flex flex-col gap-1">
                <label className="px-1 text-xs font-medium text-slate-600">Saved</label>
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all ${
                    showSavedOnly
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-secondary/30 text-slate-600 hover:bg-secondary"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                  Saved ({savedIds.length})
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="px-1 text-xs font-medium text-slate-600">Extras</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAvailableNow(!availableNow)} className={`h-10 rounded-lg border px-3 text-sm font-medium transition-all ${availableNow ? "border-primary bg-primary text-white" : "border-border bg-secondary/30 text-slate-600 hover:bg-secondary"}`}>
                    Available Now
                  </button>
                </div>
              </div>

              {filtersActive && (
                <div className="flex flex-col gap-1">
                  <label className="select-none px-1 text-xs text-transparent">&nbsp;</label>
                  <button
                    onClick={resetFilters}
                    className="flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {filtersActive && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-slate-600">Filters active</span>
              {!loading && (
                <span className="text-xs font-semibold text-primary">
                  — {properties.length} propert{properties.length !== 1 ? "ies" : "y"} found
                </span>
              )}
            </div>
          )}
        </motion.div>

        {!loading && !filtersActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-sm font-medium text-slate-600"
          >
            Showing{" "}
            <span className="font-semibold text-foreground">{properties.length}</span>{" "}
            available propert{properties.length !== 1 ? "ies" : "y"}
          </motion.p>
        )}

        {loadError && !loading && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError} <button className="ml-2 font-semibold underline" onClick={() => void fetchProperties()}>Retry</button></div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-600">Loading properties...</p>
          </div>
        ) : loadError ? null : properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto flex max-w-md flex-col items-center justify-center gap-5 py-32 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-secondary/50">
              <Home className="h-9 w-9 text-slate-600/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">No properties found</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Try adjusting your filters or clearing your search. New listings are added daily.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          /* ── Properties Grid ─────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {properties.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4) }}
              >
                <PropertyCard property={property} purpose={purpose} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PublicPageShell>
  )
}

// ─── Default Export with Suspense ─────────────────────────────────────────────
export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl pointer-events-none" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Loading Listings...
          </p>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  )
}
