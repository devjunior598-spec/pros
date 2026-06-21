"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { motion } from "motion/react"
import {
  Search,
  ShieldCheck,
  Building2,
  Star,
  Users,
  Loader2,
  MapPin,
  User,
  X,
  ChevronRight,
} from "lucide-react"
import { PublicPageShell } from "@/components/public-page-shell"

interface LandlordProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  is_verified?: boolean
  profile_image_url?: string
  created_at: string
  property_count?: number
  avg_rating?: number
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
      <Icon className="h-4 w-4 text-blue-400" />
      <span className="font-bold text-white text-sm">{value}</span>
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
            <div className="h-3 w-1/3 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-white/10 mb-2" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
        <div className="mt-5 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-white/10" />
          <div className="h-8 w-32 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  )
}

// ─── Landlord Card ────────────────────────────────────────────────────────────
function LandlordCard({ landlord, index }: { landlord: LandlordProfile; index: number }) {
  const initials = landlord.name
    ? landlord.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??"

  const gradients = [
    "from-blue-600 to-indigo-700",
    "from-violet-600 to-purple-700",
    "from-emerald-600 to-teal-700",
    "from-rose-600 to-pink-700",
    "from-amber-600 to-orange-700",
    "from-cyan-600 to-sky-700",
  ]
  const gradient = gradients[index % gradients.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group relative rounded-2xl bg-gradient-to-b from-white/8 to-white/4 border border-white/10 hover:border-blue-500/40 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/20"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

      <div className="p-6">
        {/* Avatar + name row */}
        <div className="flex items-start gap-4 mb-4">
          {landlord.profile_image_url ? (
            <img
              src={landlord.profile_image_url}
              alt={landlord.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-blue-500/30 transition-all shrink-0"
            />
          ) : (
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 ring-2 ring-white/10 group-hover:ring-blue-500/30 transition-all`}>
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate text-base">{landlord.name}</h3>
              {landlord.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25 px-2 py-0.5 shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              {(landlord.property_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  {landlord.property_count} {(landlord.property_count ?? 0) === 1 ? "property" : "properties"}
                </span>
              )}
              {(landlord.avg_rating ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  {(landlord.avg_rating ?? 0).toFixed(1)}
                </span>
              )}
            </div>

            {landlord.phone && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {landlord.phone}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {landlord.bio ? (
          <p className="text-sm text-slate-400 line-clamp-2 mb-5 leading-relaxed">
            {landlord.bio}
          </p>
        ) : (
          <p className="text-sm text-slate-600 italic mb-5">No bio provided.</p>
        )}

        {/* CTA */}
        <Link
          href={`/landlords/${landlord.id}`}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/25 hover:border-blue-500/50 text-blue-300 text-sm font-medium py-2.5 transition-all duration-200 group/btn"
        >
          View Profile
          <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<LandlordProfile[]>([])
  const [filtered, setFiltered] = useState<LandlordProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLandlords = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all landlord profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, bio, is_verified, profile_image_url, created_at")
        .eq("role", "landlord")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!profiles) {
        setLandlords([])
        setFiltered([])
        setTotalCount(0)
        return
      }

      // Fetch property counts for each landlord
      const landlordIds = profiles.map((p) => p.id)
      const { data: propertyCounts } = await supabase
        .from("properties")
        .select("landlord_id")
        .in("landlord_id", landlordIds)

      const countMap: Record<string, number> = {}
      propertyCounts?.forEach(({ landlord_id }) => {
        countMap[landlord_id] = (countMap[landlord_id] || 0) + 1
      })

      const enriched: LandlordProfile[] = profiles.map((p) => ({
        ...p,
        property_count: countMap[p.id] || 0,
        avg_rating: undefined,
      }))

      setLandlords(enriched)
      setFiltered(enriched)
      setTotalCount(enriched.length)
    } catch (err) {
      console.error("Failed to fetch landlords:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLandlords()
  }, [fetchLandlords])

  // Apply filters
  useEffect(() => {
    let result = [...landlords]
    if (showVerifiedOnly) result = result.filter((l) => l.is_verified)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.bio?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [landlords, searchQuery, showVerifiedOnly])

  const verifiedCount = landlords.filter((l) => l.is_verified).length
  const clearFilters = () => {
    setSearchQuery("")
    setShowVerifiedOnly(false)
  }
  const hasFilters = searchQuery.trim() !== "" || showVerifiedOnly

  return (
    <PublicPageShell
      pageTitle="Verified Landlords"
      pageSubtitle="Discover trusted property owners across Nigeria. Browse profiles, view listings, and connect with verified landlords."
      badge="Landlord Directory"
    >
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <StatPill icon={Users} value={totalCount} label="registered landlords" />
          <StatPill icon={ShieldCheck} value={verifiedCount} label="verified" />
        </motion.div>

        {/* Search + filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landlords by name, location or bio…"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Verified toggle */}
          <button
            onClick={() => setShowVerifiedOnly((v) => !v)}
            className={`h-12 px-5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              showVerifiedOnly
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Verified Only
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm flex items-center gap-2 transition-all"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </motion.div>

        {/* Results count */}
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-500 mb-6"
          >
            {hasFilters
              ? `${filtered.length} of ${totalCount} landlords match your filters`
              : `Showing all ${totalCount} landlords`}
          </motion.p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No landlords found</h3>
            <p className="text-slate-500 text-sm mb-5">Try adjusting your search or clearing filters.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-600/30 transition-all"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((landlord, i) => (
              <LandlordCard key={landlord.id} landlord={landlord} index={i} />
            ))}
          </div>
        )}
      </section>
    </PublicPageShell>
  )
}
