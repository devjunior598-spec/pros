"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  showSavedOnly: boolean
) {
  return (
    searchQuery.trim() !== "" ||
    propertyType !== "all" ||
    priceRange !== "all" ||
    bedrooms !== "all" ||
    showSavedOnly
  )
}

// ─── Styled dark select wrapper ────────────────────────────────────────────────
function DarkSelect({
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
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-200/40 px-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white px-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
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
function ListingsContent() {
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<string>("all")
  const [bedrooms, setBedrooms] = useState<string>("all")
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
      try {
        let query = supabase
          .from("properties")
          .select("*")
          .eq("status", "available")

        if (searchQuery.trim()) {
          const q = searchQuery.trim()
          query = query.or(
            `city.ilike.%${q}%,area.ilike.%${q}%,title.ilike.%${q}%,zip_code.ilike.%${q}%`
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

        if (priceRange !== "all") {
          const [min, max] = priceRange.split("-").map(Number)
          if (max) {
            query = query.gte("price", min).lte("price", max)
          } else {
            query = query.gte("price", min)
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
      } catch (error: any) {
        if (
          error?.name === "AbortError" ||
          error?.message?.includes("aborted") ||
          error?.message?.includes("AbortError")
        )
          return
        console.error("Error fetching properties:", error?.message || error)
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [searchQuery, propertyType, priceRange, bedrooms, showSavedOnly, savedIds]
  )

  // Sync search params
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setSearchQuery(q)
  }, [searchParams])

  // Debounced fetch
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchProperties(controller.signal)
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchProperties])

  const resetFilters = () => {
    setSearchQuery("")
    setPropertyType("all")
    setPriceRange("all")
    setBedrooms("all")
    setShowSavedOnly(false)
  }

  const filtersActive = hasActiveFilters(
    searchQuery,
    propertyType,
    priceRange,
    bedrooms,
    showSavedOnly
  )

  return (
    <PublicPageShell
      pageTitle="Browse Properties"
      pageSubtitle="Discover verified rental properties across Nigeria."
      badge="🏠 Listings"
      showBanner={true}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">

        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            {/* Search input */}
            <div className="flex-1 relative">
              <label className="text-[10px] font-bold uppercase tracking-widest text-blue-200/40 px-1 block mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by location or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-blue-200/30 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/40 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter selects row */}
            <div className="flex flex-wrap items-end gap-3">
              <DarkSelect
                label="Property Type"
                value={propertyType}
                onChange={setPropertyType}
              >
                <option value="all">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
                <option value="Studio">Studio</option>
                <option value="Duplex">Duplex</option>
              </DarkSelect>

              <DarkSelect
                label="Price Range"
                value={priceRange}
                onChange={setPriceRange}
              >
                <option value="all">Any Price</option>
                <option value="0-500000">Under ₦500k</option>
                <option value="500000-1500000">₦500k – ₦1.5M</option>
                <option value="1500000-3000000">₦1.5M – ₦3M</option>
                <option value="3000000-5000000">₦3M – ₦5M</option>
                <option value="5000000-10000000">₦5M – ₦10M</option>
                <option value="10000000">Above ₦10M</option>
              </DarkSelect>

              <DarkSelect
                label="Bedrooms"
                value={bedrooms}
                onChange={setBedrooms}
              >
                <option value="all">Any Beds</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4+">4+ Beds</option>
              </DarkSelect>

              {/* Saved toggle */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-blue-200/40 px-1">
                  Saved
                </label>
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`h-10 px-4 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                    showSavedOnly
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                      : "bg-white/5 border-white/10 text-blue-200/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                  Saved ({savedIds.length})
                </button>
              </div>

              {/* Clear filters button */}
              {filtersActive && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-transparent px-1 select-none">
                    &nbsp;
                  </label>
                  <button
                    onClick={resetFilters}
                    className="h-10 px-4 rounded-xl text-sm font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active filters summary */}
          {filtersActive && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-blue-200/50 font-medium">
                Filters active
              </span>
              {!loading && (
                <span className="text-xs font-bold text-blue-400">
                  — {properties.length} propert{properties.length !== 1 ? "ies" : "y"} found
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Results count (no active filters) ──────────────────────────── */}
        {!loading && !filtersActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-blue-200/40 font-medium mb-6"
          >
            Showing{" "}
            <span className="text-white font-bold">{properties.length}</span>{" "}
            available propert{properties.length !== 1 ? "ies" : "y"}
          </motion.p>
        )}

        {/* ── Loading State ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl pointer-events-none" />
            </div>
            <p className="text-sm font-semibold text-blue-200/50">
              Loading properties...
            </p>
          </div>
        ) : properties.length === 0 ? (
          /* ── Empty State ─────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-5 max-w-md mx-auto text-center"
          >
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Home className="h-9 w-9 text-blue-200/30" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-xl pointer-events-none" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                No properties found
              </h3>
              <p className="text-sm text-blue-200/50 leading-relaxed">
                Try adjusting your filters or clearing your search. New
                listings are added daily.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30"
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
                <PropertyCard property={property} />
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
        <div className="min-h-screen bg-[#081A3A] flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl pointer-events-none" />
          </div>
          <p className="text-sm font-semibold text-blue-200/50">
            Loading Listings...
          </p>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  )
}
