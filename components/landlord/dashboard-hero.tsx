import * as React from "react"
import { ShieldCheck, Plus, ExternalLink } from "lucide-react"
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-prms-navy text-white p-6 sm:p-8 mb-6">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
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
            <Button className="bg-white text-prms-navy hover:bg-white/90 rounded-lg px-5 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 hover:text-white rounded-lg px-5 min-h-[44px] bg-transparent">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6">
        <div>
          <span className="text-white/60 text-xs font-medium">Monthly Revenue</span>
          <span className="block text-xl font-semibold text-white mt-0.5">₦{metrics.totalRevenue.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-white/60 text-xs font-medium">Properties</span>
          <span className="block text-xl font-semibold text-white mt-0.5">{metrics.properties}</span>
        </div>
        <div>
          <span className="text-white/60 text-xs font-medium">Active Tenants</span>
          <span className="block text-xl font-semibold text-white mt-0.5">{metrics.activeTenants}</span>
        </div>
        <div>
          <span className="text-white/60 text-xs font-medium">Occupancy Rate</span>
          <span className="block text-xl font-semibold text-white mt-0.5">{metrics.occupancyRate}%</span>
        </div>
      </div>
    </div>
  )
}
