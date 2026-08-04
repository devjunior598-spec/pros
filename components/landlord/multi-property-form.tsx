"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Building2, Loader2, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { commaList, MULTI_PROPERTY_TYPES, uploadPropertyImages } from "@/lib/property-workflow"

const Field=({label,children,className=""}:{label:string;children:React.ReactNode;className?:string})=><div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>

 export function MultiPropertyForm(){
 const router=useRouter();const {toast}=useToast();const [saving,setSaving]=useState(false);const [files,setFiles]=useState<File[]>([])
 const [form,setForm]=useState({title:"",type:"Apartment Building",description:"",address:"",city:"",state:"",country:"Nigeria",latitude:"",longitude:"",amenities:"",rules:"",parking:"",security:"",managerName:"",managerPhone:""})
 const set=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}))
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(!form.title.trim()) return toast({title:"Building Name Required",description:"Please enter a name for your building.",variant:"destructive"});
    if(!form.address.trim()||!form.city.trim()) return toast({title:"Address & City Required",description:"Please enter the building address and city.",variant:"destructive"});
    setSaving(true);
    try{
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user;
      if (!user) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) throw authError ?? new Error("Please sign in again.");
        user = authUser;
      }

      // Ensure profile row exists in public.profiles to satisfy Foreign Key constraints
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

      let images: string[] = [];
      try {
        images = await uploadPropertyImages(files, user.id, `buildings/${Date.now()}`);
      } catch (imgErr) {
        console.warn("Image upload warning:", imgErr);
      }

      const {data,error}=await supabase.from("properties").insert({landlord_id:user.id,title:form.title.trim(),type:form.type,description:form.description.trim(),address:form.address.trim(),area:"",city:form.city.trim(),state:form.state.trim(),country:form.country.trim()||"Nigeria",latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null,shared_amenities:commaList(form.amenities),amenities:commaList(form.amenities),building_rules:commaList(form.rules),parking_details:form.parking.trim(),security_details:form.security.trim(),manager_name:form.managerName.trim(),manager_phone:form.managerPhone.trim(),shared_images:images,images,image_url:images[0]??null,is_multi_unit:true,publication_status:"draft",price:0,bedrooms:0,bathrooms:0,status:"pending"}).select("id").single();
      if(error)throw error;
      toast({title:"Building created",description:"Now add the rental units inside this property."});
      router.push(`/properties/${data.id}/units`);
      router.refresh()
    }catch(error: any){
      toast({title:"Could not create building",description:error?.message || error?.details || "Please check database permissions and try again.",variant:"destructive"})
    }finally{setSaving(false)}
  }
  return <form noValidate onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-24"><div className="flex items-center gap-3"><Button type="button" variant="outline" size="icon" onClick={()=>router.back()}><ArrowLeft className="h-4 w-4"/></Button><div><div className="flex items-center gap-2 text-sm font-medium text-blue-600"><Building2 className="h-4 w-4"/>Multi-unit workflow · Step 1 of 3</div><h1 className="text-2xl font-bold sm:text-3xl">Building information</h1><p className="text-sm text-muted-foreground">Create the parent property before adding its independent rental units.</p></div></div>
 <Card><CardHeader><CardTitle>Building profile</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Building name"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Sunrise Apartment" required/></Field><Field label="Property type"><select className="h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={e=>set("type",e.target.value)}>{MULTI_PROPERTY_TYPES.map(type=><option key={type}>{type}</option>)}</select></Field><Field label="Description" className="sm:col-span-2"><Textarea className="min-h-28" value={form.description} onChange={e=>set("description",e.target.value)}/></Field><Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={e=>set("address",e.target.value)} required/></Field><Field label="City"><Input value={form.city} onChange={e=>set("city",e.target.value)} required/></Field><Field label="State"><Input value={form.state} onChange={e=>set("state",e.target.value)}/></Field><Field label="Country"><Input value={form.country} onChange={e=>set("country",e.target.value)}/></Field><div className="flex items-end"><div className="flex w-full items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800"><MapPin className="h-4 w-4"/>Google Map coordinates</div></div><Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={e=>set("latitude",e.target.value)}/></Field><Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={e=>set("longitude",e.target.value)}/></Field></CardContent></Card>
 <Card><CardHeader><CardTitle>Shared facilities and management</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Shared amenities" className="sm:col-span-2"><Input value={form.amenities} onChange={e=>set("amenities",e.target.value)} placeholder="Lift, generator, pool, security gate"/></Field><Field label="Building rules" className="sm:col-span-2"><Textarea value={form.rules} onChange={e=>set("rules",e.target.value)} placeholder="Comma-separated rules"/></Field><Field label="Parking"><Input value={form.parking} onChange={e=>set("parking",e.target.value)} placeholder="e.g. One space per unit"/></Field><Field label="Security"><Input value={form.security} onChange={e=>set("security",e.target.value)} placeholder="e.g. 24-hour guards and CCTV"/></Field><Field label="Manager name"><Input value={form.managerName} onChange={e=>set("managerName",e.target.value)}/></Field><Field label="Manager phone"><Input type="tel" value={form.managerPhone} onChange={e=>set("managerPhone",e.target.value)}/></Field><Field label="Shared building images" className="sm:col-span-2"><Input type="file" multiple accept="image/*" onChange={e=>setFiles(Array.from(e.target.files??[]))}/><p className="text-xs text-muted-foreground">Exterior and shared-area photos, up to 8 MB each.</p></Field></CardContent></Card>
 <div className="sticky bottom-4 flex justify-end rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur"><Button type="submit" size="lg" disabled={saving}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<ArrowRight className="mr-2 h-4 w-4"/>}{saving?"Creating building…":"Continue to unit builder"}</Button></div></form>
}
