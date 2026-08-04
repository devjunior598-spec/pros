"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Building2, ChevronDown, ChevronRight, Eye, Loader2, Pencil, Plus, TrendingUp, Users, Wrench } from "lucide-react"
import type { Property, PropertyUnit, UnitLease, UnitTenant } from "@/types"
import type { LucideIcon } from "lucide-react"

type UnitWithRelations = PropertyUnit & {
  unit_tenants?: (UnitTenant & { tenant?: { name?: string; email?: string; phone?: string } })[]
  leases?: UnitLease[]
}

type PortfolioProperty = Property & { property_units?: UnitWithRelations[] }

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })

function monthlyRent(unit: UnitWithRelations) {
  if (unit.payment_frequency === "yearly") return unit.rent / 12
  if (unit.payment_frequency === "monthly") return unit.rent
  if (unit.payment_frequency === "quarterly") return unit.rent / 3
  if (unit.payment_frequency === "biannually") return unit.rent / 6
  if (unit.payment_frequency === "weekly") return unit.rent * 4.345
  return unit.rent * 30.44
}

export function MultiUnitPortfolio({ landlordId }: { landlordId: string }) {
  const [properties, setProperties] = useState<PortfolioProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const { data, error: queryError } = await supabase
      .from("properties")
      .select(`*, property_units(*, unit_tenants(*, tenant:profiles!tenant_id(name,email,phone)), leases(*))`)
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false })

    if (queryError) setError(queryError.message)
    else setProperties((data ?? []) as unknown as PortfolioProperty[])
    setLoading(false)
  }, [landlordId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const totals = useMemo(() => {
    const units = properties.flatMap((property) => property.property_units ?? [])
    return {
      properties: properties.length,
      units: units.length,
      occupied: units.filter((unit) => unit.availability === "occupied").length,
      monthly: units.reduce((sum, unit) => sum + monthlyRent(unit), 0),
    }
  }, [properties])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>

  if (error) return (
    <Card><CardContent className="p-6 text-center"><p className="text-sm text-destructive">{error}</p><Button className="mt-4" onClick={() => void load()}>Try again</Button></CardContent></Card>
  )

  if (!properties.length) return (
    <EmptyState icon={Building2} title="No properties yet" description="Create a single-unit listing or a building with as many rental units as you need." action={<Button asChild><Link href="/dashboard/landlord/properties/new"><Plus className="mr-2 h-4 w-4" />Add Property</Link></Button>} />
  )

  const summaryCards: [string, string | number, LucideIcon][] = [
    ["Properties", totals.properties, Building2],
    ["Total units", totals.units, Users],
    ["Occupied", totals.occupied, Users],
    ["Monthly revenue", money.format(totals.monthly), TrendingUp],
  ]

  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {summaryCards.map(([label, value, Icon]) => <Card key={label}><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div><p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p></CardContent></Card>)}
    </div>

    {properties.map((property) => {
      const units = property.property_units ?? []
      const occupied = units.filter((unit) => unit.availability === "occupied").length
      const revenue = units.reduce((sum, unit) => sum + monthlyRent(unit), 0)
      const open = expanded.has(property.id)
      return <Card key={property.id} className="overflow-hidden">
        <CardHeader className="p-0">
          <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40 sm:p-5" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(property.id)) next.delete(property.id); else next.add(property.id); return next })}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{property.title}</h2><p className="truncate text-xs text-muted-foreground">{[property.address, property.city, property.state].filter(Boolean).join(", ")}</p></div>
            <div className="hidden gap-8 text-right sm:flex"><div><p className="font-semibold">{units.length}</p><p className="text-xs text-muted-foreground">Units</p></div><div><p className="font-semibold">{occupied} / {units.length}</p><p className="text-xs text-muted-foreground">Occupied</p></div><div><p className="font-semibold">{money.format(revenue)}</p><p className="text-xs text-muted-foreground">Monthly</p></div></div>
            {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </CardHeader>
        <div className="grid grid-cols-3 border-y bg-muted/20 text-center text-xs sm:hidden"><div className="p-3"><b className="block text-sm">{units.length}</b>Units</div><div className="border-x p-3"><b className="block text-sm">{occupied}/{units.length}</b>Occupied</div><div className="p-3"><b className="block truncate text-sm">{money.format(revenue)}</b>Monthly</div></div>
        {open && <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 pb-2"><Button size="sm" variant="outline" asChild><Link href={`/properties/${property.id}`}><Eye className="mr-2 h-4 w-4" />View</Link></Button><Button size="sm" asChild><Link href={`/properties/${property.id}/units`}><Pencil className="mr-2 h-4 w-4" />Manage units</Link></Button><Button size="sm" variant="outline" asChild><Link href={`/analytics?property=${property.id}`}><TrendingUp className="mr-2 h-4 w-4" />Analytics</Link></Button></div>
          {!units.length ? <div className="rounded-xl border border-dashed p-6 text-center"><p className="text-sm text-muted-foreground">No units have been added.</p><Button size="sm" className="mt-3" asChild><Link href={`/properties/${property.id}/units`}><Plus className="mr-2 h-4 w-4" />Add unit</Link></Button></div> : units.map((unit) => {
            const tenant = unit.unit_tenants?.find((item) => item.status === "active")
            const lease = unit.leases?.find((item) => item.status === "active")
            return <div key={unit.id} className="rounded-xl border bg-card p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{unit.name}</h3><Badge variant={unit.availability === "occupied" ? "default" : "secondary"}>{unit.availability}</Badge></div><div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3"><span>Tenant: <b className="text-foreground">{tenant?.tenant?.name ?? "Unassigned"}</b></span><span>Rent: <b className="text-foreground">{money.format(unit.rent)}/{unit.payment_frequency}</b></span><span>Lease expires: <b className="text-foreground">{lease?.end_date ? new Date(lease.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</b></span></div></div><div className="grid grid-cols-2 gap-2 sm:flex"><Button size="sm" variant="outline" asChild><Link href={`/properties/${property.id}/units?unit=${unit.id}`}>View</Link></Button><Button size="sm" variant="outline" asChild><Link href={`/dashboard/payments?unit=${unit.id}`}>Payments</Link></Button><Button size="sm" variant="outline" className="col-span-2" asChild><Link href={`/maintenance?unit=${unit.id}`}><Wrench className="mr-2 h-3.5 w-3.5" />Maintenance</Link></Button></div></div></div>
          })}
        </CardContent>}
      </Card>
    })}
  </div>
}
