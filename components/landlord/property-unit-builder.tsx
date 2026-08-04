"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building2, Home, Loader2, Plus, Trash2 } from "lucide-react"

const PROPERTY_TYPES = ["Single Room", "Self Contain", "Room and Parlour", "Mini Flat", "One Bedroom Flat", "Two Bedroom Flat", "Three Bedroom Flat", "Four Bedroom Flat", "Duplex", "Bungalow", "Apartment Building", "Hostel", "Estate", "Office Complex", "Shopping Plaza", "Warehouse", "Commercial Building", "Mixed Use Property"]

type UnitDraft = { name: string; bedrooms: string; bathrooms: string; toilets: string; floor: string; size: string; rent: string; payment_frequency: string; description: string; amenities: string; availability: string; files: File[] }
const emptyUnit = (name = "Unit 1"): UnitDraft => ({ name, bedrooms: "0", bathrooms: "0", toilets: "0", floor: "", size: "", rent: "", payment_frequency: "yearly", description: "", amenities: "", availability: "available", files: [] })

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>

export function PropertyUnitBuilder() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [kind, setKind] = useState<"single" | "multi">("single")
  const [propertyFiles, setPropertyFiles] = useState<File[]>([])
  const [property, setProperty] = useState({ title: "", type: "Apartment Building", description: "", address: "", area: "", city: "", state: "", latitude: "", longitude: "", amenities: "" })
  const [units, setUnits] = useState<UnitDraft[]>([emptyUnit()])

  const updateProperty = (key: keyof typeof property, value: string) => setProperty((current) => ({ ...current, [key]: value }))
  const updateUnit = (index: number, key: keyof UnitDraft, value: string | File[]) => setUnits((current) => current.map((unit, i) => i === index ? { ...unit, [key]: value } : unit))

  const upload = async (files: File[], owner: string, folder: string) => {
    const urls: string[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`)
      if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is larger than 8 MB.`)
      const extension = file.name.split(".").pop() ?? "jpg"
      const path = `${owner}/${folder}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from("property-images").upload(path, file)
      if (error) throw error
      urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl)
    }
    return urls
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!property.title.trim() || !property.address.trim() || !property.city.trim()) return toast({ title: "Missing property details", description: "Building name, address, and city are required.", variant: "destructive" })
    if (!units.length || units.some((unit) => !unit.name.trim() || Number(unit.rent) <= 0)) return toast({ title: "Check your units", description: "Every unit needs a name and a rent greater than zero.", variant: "destructive" })
    setSaving(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error("Please sign in again.")

      // Ensure profile row exists in public.profiles
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
      if (!profile) {
        try {
          await supabase.from("profiles").insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Landlord",
            email: user.email ?? "",
            role: "landlord"
          })
        } catch {
          // ignore duplicate profile error
        }
      }

      const sharedImages = await upload(propertyFiles, user.id, `properties/${Date.now()}`)
      const first = units[0]
      const { data: created, error: propertyError } = await supabase.from("properties").insert({
        landlord_id: user.id, title: property.title.trim(), type: property.type, description: property.description.trim(), address: property.address.trim(), area: property.area.trim(), city: property.city.trim(), state: property.state.trim(),
        latitude: property.latitude ? Number(property.latitude) : null, longitude: property.longitude ? Number(property.longitude) : null,
        shared_amenities: property.amenities.split(",").map((v) => v.trim()).filter(Boolean), shared_images: sharedImages, images: sharedImages, image_url: sharedImages[0] ?? null,
        is_multi_unit: kind === "multi", price: Number(first.rent), bedrooms: Number(first.bedrooms), bathrooms: Number(first.bathrooms), status: "available",
      }).select("id").single()
      if (propertyError) throw propertyError

      const rows = []
      for (let index = 0; index < units.length; index++) {
        const unit = units[index]
        const images = await upload(unit.files, user.id, `units/${created.id}/${index}`)
        rows.push({ property_id: created.id, landlord_id: user.id, name: unit.name.trim(), bedrooms: Number(unit.bedrooms), bathrooms: Number(unit.bathrooms), toilets: Number(unit.toilets), floor: unit.floor.trim() || null, size: unit.size ? Number(unit.size) : null, rent: Number(unit.rent), payment_frequency: unit.payment_frequency, description: unit.description.trim(), amenities: unit.amenities.split(",").map((v) => v.trim()).filter(Boolean), images, availability: unit.availability })
      }
      const { error: unitsError } = await supabase.from("property_units").insert(rows)
      if (unitsError) { await supabase.from("properties").delete().eq("id", created.id); throw unitsError }
      toast({ title: "Property created", description: `${property.title} and ${rows.length} unit${rows.length === 1 ? "" : "s"} are ready.` })
      router.push("/properties")
      router.refresh()
    } catch (error: any) {
      toast({ title: "Could not create property", description: error?.message || error?.details || "Please check database permissions and try again.", variant: "destructive" })
    } finally { setSaving(false) }
  }

  return <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-24">
    <div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button><div><h1 className="text-2xl font-bold">Add property</h1><p className="text-sm text-muted-foreground">Create the building, then configure its rental units.</p></div></div>
    <Card><CardHeader><CardTitle>What are you listing?</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{([['single', Home, 'Single unit', 'One independently rented home or room'], ['multi', Building2, 'Multi-unit property', 'A building or estate containing several units']] as const).map(([value, Icon, title, description]) => <button type="button" key={value} onClick={() => { setKind(value); if (value === "single") setUnits((current) => [current[0] ?? emptyUnit()]) }} className={`flex min-h-24 items-center gap-4 rounded-xl border-2 p-4 text-left transition ${kind === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}><Icon className="h-7 w-7 text-primary" /><span><b className="block">{title}</b><span className="text-sm text-muted-foreground">{description}</span></span></button>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Property details</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Building / property name"><Input value={property.title} onChange={(e) => updateProperty("title", e.target.value)} required /></Field><Field label="Property type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={property.type} onChange={(e) => updateProperty("type", e.target.value)}>{PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field><div className="sm:col-span-2"><Field label="Description"><Textarea value={property.description} onChange={(e) => updateProperty("description", e.target.value)} /></Field></div><div className="sm:col-span-2"><Field label="Address"><Input value={property.address} onChange={(e) => updateProperty("address", e.target.value)} required /></Field></div><Field label="Area / neighborhood"><Input value={property.area} onChange={(e) => updateProperty("area", e.target.value)} /></Field><Field label="City"><Input value={property.city} onChange={(e) => updateProperty("city", e.target.value)} required /></Field><Field label="State"><Input value={property.state} onChange={(e) => updateProperty("state", e.target.value)} /></Field><Field label="Shared amenities (comma separated)"><Input value={property.amenities} onChange={(e) => updateProperty("amenities", e.target.value)} placeholder="Parking, security, pool" /></Field><Field label="Latitude"><Input type="number" step="any" value={property.latitude} onChange={(e) => updateProperty("latitude", e.target.value)} /></Field><Field label="Longitude"><Input type="number" step="any" value={property.longitude} onChange={(e) => updateProperty("longitude", e.target.value)} /></Field><div className="sm:col-span-2"><Field label="Shared property photos"><Input type="file" accept="image/*" multiple onChange={(e) => setPropertyFiles(Array.from(e.target.files ?? []))} /><p className="text-xs text-muted-foreground">Up to 8 MB per image.</p></Field></div></CardContent></Card>
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Unit builder</h2><p className="text-sm text-muted-foreground">{units.length} unit{units.length === 1 ? "" : "s"} configured</p></div>{kind === "multi" && <Button type="button" variant="outline" onClick={() => setUnits((current) => [...current, emptyUnit(`Unit ${current.length + 1}`)])}><Plus className="mr-2 h-4 w-4" />Add unit</Button>}</div>
    {units.map((unit, index) => <Card key={index}><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">{unit.name || `Unit ${index + 1}`}</CardTitle>{kind === "multi" && units.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => setUnits((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Unit name"><Input value={unit.name} onChange={(e) => updateUnit(index, "name", e.target.value)} required /></Field><Field label="Rent (₦)"><Input type="number" min="1" value={unit.rent} onChange={(e) => updateUnit(index, "rent", e.target.value)} required /></Field><Field label="Payment frequency"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={unit.payment_frequency} onChange={(e) => updateUnit(index, "payment_frequency", e.target.value)}>{["monthly", "quarterly", "biannually", "yearly"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Availability"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={unit.availability} onChange={(e) => updateUnit(index, "availability", e.target.value)}>{["available", "occupied", "reserved", "maintenance", "inactive"].map((value) => <option key={value}>{value}</option>)}</select></Field>{["bedrooms", "bathrooms", "toilets"].map((key) => <Field key={key} label={key[0].toUpperCase() + key.slice(1)}><Input type="number" min="0" value={String(unit[key as keyof UnitDraft])} onChange={(e) => updateUnit(index, key as keyof UnitDraft, e.target.value)} /></Field>)}<Field label="Floor"><Input value={unit.floor} onChange={(e) => updateUnit(index, "floor", e.target.value)} placeholder="Ground, 2, B" /></Field><Field label="Size (m²)"><Input type="number" min="0" value={unit.size} onChange={(e) => updateUnit(index, "size", e.target.value)} /></Field><div className="lg:col-span-3"><Field label="Amenities"><Input value={unit.amenities} onChange={(e) => updateUnit(index, "amenities", e.target.value)} placeholder="Balcony, fitted kitchen, AC" /></Field></div><div className="sm:col-span-2 lg:col-span-4"><Field label="Description"><Textarea value={unit.description} onChange={(e) => updateUnit(index, "description", e.target.value)} /></Field></div><div className="sm:col-span-2 lg:col-span-4"><Field label="Unit photos"><Input type="file" accept="image/*" multiple onChange={(e) => updateUnit(index, "files", Array.from(e.target.files ?? []))} /></Field></div></CardContent></Card>)}
    <div className="sticky bottom-4 flex justify-end rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"><Button type="submit" size="lg" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Creating property…" : `Create property and ${units.length} unit${units.length === 1 ? "" : "s"}`}</Button></div>
  </form>
}
