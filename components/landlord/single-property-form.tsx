"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Home, Loader2, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { commaList, deletePropertyImages, PAYMENT_FREQUENCIES, SINGLE_PROPERTY_TYPES, uploadPropertyImages, type UploadedPropertyImage } from "@/lib/property-workflow"
import { useAuth } from "@/contexts/auth-context"
import { US_COUNTRY } from "@/lib/us-region"
import { USStateSelect } from "@/components/us-state-select"

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>

export function SinglePropertyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [form, setForm] = useState({ title:"", type:"Apartment", rent:"", frequency:"monthly", bedrooms:"1", bathrooms:"1", toilets:"1", size:"", address:"", city:"", state:"", zipCode:"", description:"", amenities:"", latitude:"", longitude:"", availability:"available", meterNumber:"", electricityPayment:"landlord_bill", waterPayment:"landlord_bill", wastePayment:"landlord_bill", utilityNotes:"" })
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({...current,[key]:value}))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    // Explicit client-side validation to prevent browser silent cancellation
    if (!form.title.trim()) {
      return toast({ title: "Property Name Required", description: "Please enter a name for your property.", variant: "destructive" })
    }
    if (!form.address.trim() || !form.city.trim()) {
      return toast({ title: "Address & City Required", description: "Please enter the street address and city.", variant: "destructive" })
    }
    if (!form.rent || Number(form.rent) <= 0) {
      return toast({ title: "Invalid Rent Amount", description: "Please enter a valid rental price greater than 0.", variant: "destructive" })
    }

    setSaving(true)
    try {
      if (!user) throw new Error("You must be logged in to publish a property. Please sign in again.")
      if (profile?.role !== "landlord") throw new Error("Only landlord accounts can publish properties.")

      let uploadedImages: UploadedPropertyImage[] = []
      uploadedImages = await uploadPropertyImages(files, user.id, `single/${Date.now()}`)
      const images = uploadedImages.map((image) => image.url)

      // 4. Insert into properties table
      const { data: property, error: propertyError } = await supabase.from("properties").insert({
        landlord_id: user.id,
        title: form.title.trim(),
        type: form.type,
        price: Number(form.rent),
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        address: form.address.trim(),
        area: "",
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim() || null,
        country: US_COUNTRY,
        description: form.description.trim(),
        amenities: commaList(form.amenities),
        images,
        image_url: images[0] ?? null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        is_multi_unit: false,
        publication_status: "published",
        status: form.availability === "reserved" || form.availability === "maintenance" ? "available" : form.availability,
        electricity_meter_number: form.meterNumber.trim() || null,
        electricity_payment_method: form.electricityPayment,
        water_payment_method: form.waterPayment,
        waste_payment_method: form.wastePayment,
        utility_notes: form.utilityNotes.trim() || null
      }).select("id").single()

      if (propertyError) {
        console.error("Properties insert error:", propertyError.message || propertyError.details || propertyError.hint || JSON.stringify(propertyError), propertyError)
        await deletePropertyImages(uploadedImages)
        throw new Error(propertyError.message || propertyError.details || "Failed to insert property record.")
      }

      // 5. Insert into property_units table
      const { error: unitError } = await supabase.from("property_units").insert({
        property_id: property.id,
        landlord_id: user.id,
        name: form.title.trim(),
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        toilets: Number(form.toilets || 0),
        size: form.size ? Number(form.size) : null,
        rent: Number(form.rent),
        payment_frequency: form.frequency,
        description: form.description.trim(),
        amenities: commaList(form.amenities),
        images,
        availability: form.availability,
        published: true
      })

      if (unitError) {
        console.error("Property unit insert error:", unitError)
        await supabase.from("properties").delete().eq("id", property.id)
        await deletePropertyImages(uploadedImages)
        throw unitError
      }

      toast({ title: "Property Published!", description: `${form.title} is now active in your portfolio.` })
      router.push("/properties")
      router.refresh()
    } catch (error: any) {
      console.error("Publish error:", error)
      const message = error?.message || error?.details || "Failed to publish property. Please try again."
      toast({ title: "Could Not Publish Property", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return <form noValidate onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-24">
    <div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" onClick={()=>router.back()}><ArrowLeft className="h-4 w-4" /></Button><div><div className="flex items-center gap-2 text-sm font-medium text-blue-600"><Home className="h-4 w-4" />Single unit workflow</div><h1 className="text-2xl font-bold sm:text-3xl">List a single unit property</h1><p className="text-sm text-muted-foreground">Everything on this page belongs to one independent rental.</p></div></div>
    <Card className="shadow-sm"><CardHeader><CardTitle>Property and pricing</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Property name *"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Modern two-bedroom apartment" required /></Field><Field label="Property type"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={e=>set("type",e.target.value)}>{SINGLE_PROPERTY_TYPES.map(type=><option key={type}>{type}</option>)}</select></Field><Field label="Rent ($) *"><Input type="number" min="1" value={form.rent} onChange={e=>set("rent",e.target.value)} placeholder="e.g. 2,500" required /></Field><Field label="Payment frequency"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.frequency} onChange={e=>set("frequency",e.target.value)}>{PAYMENT_FREQUENCIES.map(value=><option key={value}>{value}</option>)}</select></Field>{([['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['toilets','Toilets'],['size','Property size (sq ft)']] as const).map(([key,label])=><Field key={key} label={label}><Input type="number" min="0" value={form[key]} onChange={e=>set(key,e.target.value)} /></Field>)}</CardContent></Card>
    <Card className="shadow-sm"><CardHeader><CardTitle>Location and presentation</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Address *" className="sm:col-span-2"><Input value={form.address} onChange={e=>set("address",e.target.value)} placeholder="e.g. 123 Main Street" required /></Field><Field label="City *"><Input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="e.g. Austin" required /></Field><Field label="State"><USStateSelect id="state" value={form.state} onChange={value=>set("state",value)} /></Field><Field label="ZIP code"><Input value={form.zipCode} onChange={e=>set("zipCode",e.target.value)} placeholder="e.g. 78701" autoComplete="postal-code" /></Field><Field label="Description" className="sm:col-span-2"><Textarea className="min-h-28" value={form.description} onChange={e=>set("description",e.target.value)} /></Field><Field label="Amenities (comma separated)" className="sm:col-span-2"><Input value={form.amenities} onChange={e=>set("amenities",e.target.value)} placeholder="Parking, fitted kitchen, security" /></Field><Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={e=>set("latitude",e.target.value)} /></Field><Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={e=>set("longitude",e.target.value)} /></Field><Field label="Property images" className="sm:col-span-2"><Input type="file" multiple accept="image/*" onChange={e=>setFiles(Array.from(e.target.files??[]))} /><p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 8 MB each.</p></Field><Field label="Availability"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.availability} onChange={e=>set("availability",e.target.value)}><option value="available">Available</option><option value="reserved">Reserved</option><option value="maintenance">Maintenance</option></select></Field><div className="flex items-end"><div className="flex w-full items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800"><MapPin className="h-4 w-4" />Map coordinates are optional.</div></div></CardContent></Card>
    <Card className="shadow-sm"><CardHeader><CardTitle>Utilities and other bills</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Electricity meter / account number"><Input value={form.meterNumber} onChange={e=>set("meterNumber",e.target.value)} placeholder="Optional meter number"/></Field><Field label="Electricity payment"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.electricityPayment} onChange={e=>set("electricityPayment",e.target.value)}><option value="landlord_bill">Landlord sends bill in PRMS</option><option value="tenant_direct">Tenant pays provider directly</option><option value="prepaid_meter">Tenant funds prepaid meter</option><option value="included_in_rent">Included in rent</option></select></Field><Field label="Water payment"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.waterPayment} onChange={e=>set("waterPayment",e.target.value)}><option value="landlord_bill">Landlord sends bill in PRMS</option><option value="tenant_direct">Tenant pays provider directly</option><option value="included_in_rent">Included in rent</option></select></Field><Field label="Waste payment"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.wastePayment} onChange={e=>set("wastePayment",e.target.value)}><option value="landlord_bill">Landlord sends bill in PRMS</option><option value="tenant_direct">Tenant pays provider directly</option><option value="included_in_rent">Included in rent</option></select></Field><Field label="Utility instructions" className="sm:col-span-2"><Textarea value={form.utilityNotes} onChange={e=>set("utilityNotes",e.target.value)} placeholder="Explain provider, meter, and how tenants should pay other bills."/></Field></CardContent></Card>
    <div className="sticky bottom-4 flex justify-end rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur"><Button type="submit" size="lg" disabled={saving}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Check className="mr-2 h-4 w-4"/>}{saving?"Publishing…":"Publish property"}</Button></div>
  </form>
}
