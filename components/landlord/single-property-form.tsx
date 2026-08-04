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
import { commaList, PAYMENT_FREQUENCIES, SINGLE_PROPERTY_TYPES, uploadPropertyImages } from "@/lib/property-workflow"

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>

export function SinglePropertyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [form, setForm] = useState({ title:"", type:"One Bedroom Flat", rent:"", frequency:"yearly", bedrooms:"1", bathrooms:"1", toilets:"1", size:"", address:"", city:"", state:"", description:"", amenities:"", latitude:"", longitude:"", availability:"available" })
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({...current,[key]:value}))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.address.trim() || !form.city.trim() || Number(form.rent) <= 0) {
      return toast({title:"Check required fields",description:"Property name, rent, address, and city are required.",variant:"destructive"})
    }
    setSaving(true)
    try {
      const {data:{user},error:authError}=await supabase.auth.getUser()
      if(authError||!user) throw authError??new Error("Please sign in again.")

      // Ensure profile row exists to prevent FK violation on property_units table
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

      const images=await uploadPropertyImages(files,user.id,`single/${Date.now()}`)
      const {data:property,error:propertyError}=await supabase.from("properties").insert({landlord_id:user.id,title:form.title.trim(),type:form.type,price:Number(form.rent),frequency:form.frequency,bedrooms:Number(form.bedrooms),bathrooms:Number(form.bathrooms),toilets:Number(form.toilets),square_footage:form.size?Number(form.size):null,address:form.address.trim(),area:"",city:form.city.trim(),state:form.state.trim(),description:form.description.trim(),amenities:commaList(form.amenities),images,image_url:images[0]??null,latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null,is_multi_unit:false,publication_status:"published",status:form.availability}).select("id").single()
      if(propertyError) throw propertyError

      const {error:unitError}=await supabase.from("property_units").insert({property_id:property.id,landlord_id:user.id,name:form.title.trim(),bedrooms:Number(form.bedrooms),bathrooms:Number(form.bathrooms),toilets:Number(form.toilets),size:form.size?Number(form.size):null,rent:Number(form.rent),payment_frequency:form.frequency,description:form.description.trim(),amenities:commaList(form.amenities),images,availability:form.availability,published:true})
      if(unitError){await supabase.from("properties").delete().eq("id",property.id);throw unitError}

      toast({title:"Property published",description:`${form.title} is now in your portfolio.`});router.push("/properties");router.refresh()
    } catch(error: any){
      toast({title:"Could not publish property",description:error?.message || error?.details || "Please check database permissions and try again.",variant:"destructive"})
    } finally{setSaving(false)}
  }

  return <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-24">
    <div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" onClick={()=>router.back()}><ArrowLeft className="h-4 w-4" /></Button><div><div className="flex items-center gap-2 text-sm font-medium text-blue-600"><Home className="h-4 w-4" />Single unit workflow</div><h1 className="text-2xl font-bold sm:text-3xl">List a single unit property</h1><p className="text-sm text-muted-foreground">Everything on this page belongs to one independent rental.</p></div></div>
    <Card className="shadow-sm"><CardHeader><CardTitle>Property and pricing</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Property name"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Modern two bedroom flat" required /></Field><Field label="Property type"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={e=>set("type",e.target.value)}>{SINGLE_PROPERTY_TYPES.map(type=><option key={type}>{type}</option>)}</select></Field><Field label="Rent (₦)"><Input type="number" min="1" value={form.rent} onChange={e=>set("rent",e.target.value)} required /></Field><Field label="Payment frequency"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.frequency} onChange={e=>set("frequency",e.target.value)}>{PAYMENT_FREQUENCIES.map(value=><option key={value}>{value}</option>)}</select></Field>{([['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['toilets','Toilets'],['size','Property size (m²)']] as const).map(([key,label])=><Field key={key} label={label}><Input type="number" min="0" value={form[key]} onChange={e=>set(key,e.target.value)} /></Field>)}</CardContent></Card>
    <Card className="shadow-sm"><CardHeader><CardTitle>Location and presentation</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={e=>set("address",e.target.value)} required /></Field><Field label="City"><Input value={form.city} onChange={e=>set("city",e.target.value)} required /></Field><Field label="State"><Input value={form.state} onChange={e=>set("state",e.target.value)} /></Field><Field label="Description" className="sm:col-span-2"><Textarea className="min-h-28" value={form.description} onChange={e=>set("description",e.target.value)} /></Field><Field label="Amenities (comma separated)" className="sm:col-span-2"><Input value={form.amenities} onChange={e=>set("amenities",e.target.value)} placeholder="Parking, fitted kitchen, security" /></Field><Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={e=>set("latitude",e.target.value)} /></Field><Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={e=>set("longitude",e.target.value)} /></Field><Field label="Property images" className="sm:col-span-2"><Input type="file" multiple accept="image/*" onChange={e=>setFiles(Array.from(e.target.files??[]))} /><p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 8 MB each.</p></Field><Field label="Availability"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.availability} onChange={e=>set("availability",e.target.value)}><option value="available">Available</option><option value="reserved">Reserved</option><option value="maintenance">Maintenance</option></select></Field><div className="flex items-end"><div className="flex w-full items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800"><MapPin className="h-4 w-4" />Map coordinates are optional.</div></div></CardContent></Card>
    <div className="sticky bottom-4 flex justify-end rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur"><Button type="submit" size="lg" disabled={saving}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Check className="mr-2 h-4 w-4"/>}{saving?"Publishing…":"Publish property"}</Button></div>
  </form>
}
