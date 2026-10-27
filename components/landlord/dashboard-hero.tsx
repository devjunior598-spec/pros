import * as React from "react"
import { ShieldCheck, Plus, ExternalLink, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardHeroProps {
  name?: string
  isVerified?: boolean
  metrics: {
    totalRevenue: number
    properties: number
    activeTenants: number
    occupancyRate: number
  }
}

export function DashboardHero({ name = "Landlord", isVerified, metrics }: DashboardHeroProps) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-prms-navy p-6 text-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)] sm:p-8">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-prms-blue/35 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-prms-emerald/20 blur-3xl" />
      <div className="absolute inset-0 opacity-15 prms-dot-grid" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-prms-gold" /> Portfolio overview
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
              Welcome back, {name}
            </h1>
            <p className="text-white/70 text-sm sm:text-base max-w-xl">
              Here&apos;s what&apos;s happening with your properties today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isVerified ? (
              <Badge className="bg-prms-emerald/20 text-emerald-100 border-emerald-500/30 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-prms-emerald" />
                Verified Landlord
              </Badge>
            ) : (
              <Link href="/verification">
                <Badge className="bg-amber-500/20 text-amber-100 border-amber-500/30 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/30 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Get Verified
                </Badge>
              </Link>
            )}
          </div>
        </div>

          <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/landlord/properties/new">
            <Button className="min-h-[44px] rounded-xl bg-white px-5 text-prms-navy shadow-lg shadow-black/15 hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="outline" className="min-h-[44px] rounded-xl border-white/25 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/60">Monthly Revenue</span>
          <span className="mt-0.5 block text-xl font-semibold text-white">${metrics.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/60">Properties</span>
          <span className="mt-0.5 block text-xl font-semibold text-white">{metrics.properties}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/60">Active Tenants</span>
          <span className="mt-0.5 block text-xl font-semibold text-white">{metrics.activeTenants}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/60">Occupancy Rate</span>
          <span className="mt-0.5 block text-xl font-semibold text-white">{metrics.occupancyRate}%</span>
        </div>
      </div>
    </div>
  )
}
