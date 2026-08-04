"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, CreditCard, FileText, Loader2, MessageSquare, Plus, Save, UserRound, Wrench } from "lucide-react"
import type { Property, PropertyUnit } from "@/types"

type Draft = Pick<PropertyUnit, "name" | "bedrooms" | "bathrooms" | "toilets" | "rent" | "payment_frequency" | "availability"> & { floor: string; size: string; amenities: string }
const blank: Draft = { name: "", bedrooms: 0, bathrooms: 0, toilets: 0, floor: "", size: "", rent: 0, payment_frequency: "yearly", amenities: "", availability: "available" }
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })

export default function UnitManagementPage() {
  const { id } = useParams<{ id: string }>()
  const search = useSearchParams()
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<PropertyUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: propertyData, error: propertyError }, { data: unitData, error: unitsError }] = await Promise.all([
      supabase.from("properties").select("*").eq("id", id).single(),
      supabase.from("property_units").select("*").eq("property_id", id).order("name"),
    ])
    if (propertyError || unitsError) toast({ title: "Could not load units", description: propertyError?.message ?? unitsError?.message, variant: "destructive" })
    setProperty(propertyData as Property | null)
    setUnits((unitData ?? []) as PropertyUnit[])
    setLoading(false)
  }, [id, toast])

  const openEdit = (unit?: PropertyUnit) => {
    setEditing(unit?.id ?? null)
    setDraft(unit ? { name: unit.name, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, toilets: unit.toilets, floor: unit.floor ?? "", size: unit.size?.toString() ?? "", rent: unit.rent, payment_frequency: unit.payment_frequency, amenities: unit.amenities.join(", "), availability: unit.availability } : { ...blank, name: `Unit ${units.length + 1}` })
    setDialog(true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    const selected = search.get("unit")
    if (!selected || !units.length) return
    const unit = units.find((item) => item.id === selected)
    if (!unit) return
    const timer = window.setTimeout(() => openEdit(unit), 0)
    return () => window.clearTimeout(timer)
    // The query parameter is a one-time deep link into the edit dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, units])

  const save = async () => {
    if (!draft.name.trim() || draft.rent <= 0) return toast({ title: "Unit name and rent are required", variant: "destructive" })
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const payload = { ...draft, floor: draft.floor || null, size: draft.size ? Number(draft.size) : null, amenities: draft.amenities.split(",").map((value) => value.trim()).filter(Boolean), property_id: id, landlord_id: user.id }
    const result = editing ? await supabase.from("property_units").update(payload).eq("id", editing) : await supabase.from("property_units").insert(payload)
    setSaving(false)
    if (result.error) return toast({ title: "Could not save unit", description: result.error.message, variant: "destructive" })
    toast({ title: editing ? "Unit updated" : "Unit added" })
    setDialog(false)
    void load()
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!property) return <p>Property not found.</p>

  return <div className="space-y-6 pb-16">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Button variant="outline" size="icon" asChild><Link href="/properties"><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="text-2xl font-bold">{property.title}</h1><p className="text-sm text-muted-foreground">Manage {units.length} rental unit{units.length === 1 ? "" : "s"}</p></div></div><Button onClick={() => openEdit()}><Plus className="mr-2 h-4 w-4" />Add unit</Button></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{units.map((unit) => <Card key={unit.id} className="overflow-hidden"><CardHeader className="border-b bg-muted/20"><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-lg">{unit.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Floor {unit.floor || "—"} · {unit.bedrooms} bed · {unit.bathrooms} bath</p></div><Badge>{unit.availability}</Badge></div></CardHeader><CardContent className="space-y-4 p-4"><div><p className="text-2xl font-bold">{money.format(unit.rent)}</p><p className="text-xs text-muted-foreground">per {unit.payment_frequency.replace("ly", "")}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(unit)}><Save className="mr-2 h-3.5 w-3.5" />Edit</Button><Button variant="outline" size="sm" asChild><Link href={`/tenants?unit=${unit.id}`}><UserRound className="mr-2 h-3.5 w-3.5" />Tenant</Link></Button><Button variant="outline" size="sm" asChild><Link href={`/dashboard/payments?unit=${unit.id}`}><CreditCard className="mr-2 h-3.5 w-3.5" />Payments</Link></Button><Button variant="outline" size="sm" asChild><Link href={`/dashboard/leases?unit=${unit.id}`}><FileText className="mr-2 h-3.5 w-3.5" />Lease</Link></Button><Button variant="outline" size="sm" asChild><Link href={`/maintenance?unit=${unit.id}`}><Wrench className="mr-2 h-3.5 w-3.5" />Maintenance</Link></Button><Button variant="outline" size="sm" asChild><Link href={`/messages?unit=${unit.id}`}><MessageSquare className="mr-2 h-3.5 w-3.5" />Messages</Link></Button></div></CardContent></Card>)}</div>
    {!units.length && <Card><CardContent className="flex flex-col items-center p-10 text-center"><Building2 className="mb-3 h-10 w-10 text-muted-foreground" /><h2 className="font-semibold">No units yet</h2><p className="mb-4 text-sm text-muted-foreground">Add the first rentable unit for this property.</p><Button onClick={() => openEdit()}><Plus className="mr-2 h-4 w-4" />Add unit</Button></CardContent></Card>}
    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit unit" : "Add unit"}</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2">{([['name','Unit name','text'],['rent','Rent (₦)','number'],['bedrooms','Bedrooms','number'],['bathrooms','Bathrooms','number'],['toilets','Toilets','number'],['floor','Floor','text'],['size','Size (m²)','number'],['amenities','Amenities','text']] as const).map(([key, label, type]) => <div key={key} className={key === "amenities" ? "sm:col-span-2" : ""}><Label>{label}</Label><Input className="mt-2" type={type} value={String(draft[key])} onChange={(event) => setDraft((current) => ({ ...current, [key]: type === "number" && key !== "size" ? Number(event.target.value) : event.target.value }))} /></div>)}<div><Label>Frequency</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={draft.payment_frequency} onChange={(e) => setDraft((current) => ({ ...current, payment_frequency: e.target.value as Draft['payment_frequency'] }))}>{["monthly","quarterly","biannually","yearly"].map((value) => <option key={value}>{value}</option>)}</select></div><div><Label>Availability</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={draft.availability} onChange={(e) => setDraft((current) => ({ ...current, availability: e.target.value as Draft['availability'] }))}>{["available","occupied","reserved","maintenance","inactive"].map((value) => <option key={value}>{value}</option>)}</select></div></div><Button className="mt-4 w-full" onClick={() => void save()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save unit</Button></DialogContent></Dialog>
  </div>
}
