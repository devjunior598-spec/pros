"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SaleListing = {
  id: string
  landlord_id: string
  listing_purpose: "rent" | "sale" | "both"
  title: string
  description: string | null
  sale_price: number | null
  price: number
  lot_size_sqft: number | null
}

export default function EditSaleListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState<SaleListing | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [lotSize, setLotSize] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || typeof params.id !== "string") return
    const timer = window.setTimeout(async () => {
      const { data, error: queryError } = await supabase.from("properties")
        .select("id, landlord_id, listing_purpose, title, description, sale_price, price, lot_size_sqft")
        .eq("id", params.id).eq("landlord_id", user.id).eq("country", "United States").maybeSingle()
      if (queryError || !data || !["sale", "both"].includes(data.listing_purpose)) {
        setError(queryError?.message || "Sale listing not found.")
      } else {
        const property = data as SaleListing
        setListing(property)
        setTitle(property.title)
        setDescription(property.description ?? "")
        setSalePrice(String(property.sale_price ?? property.price))
        setLotSize(property.lot_size_sqft ? String(property.lot_size_sqft) : "")
      }
      setLoading(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [params.id, user])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!listing || !user) return
    if (!title.trim() || !Number.isFinite(Number(salePrice)) || Number(salePrice) <= 0 || (lotSize && (!Number.isFinite(Number(lotSize)) || Number(lotSize) <= 0))) {
      setError("Enter a title, a positive asking price, and a positive lot size if provided.")
      return
    }
    setSaving(true)
    setError("")
    const { error: updateError } = await supabase.from("properties").update({
      title: title.trim(),
      description: description.trim(),
      sale_price: Number(salePrice),
      lot_size_sqft: lotSize ? Number(lotSize) : null,
      verification_status: "pending",
      is_approved: false,
      ...(listing.listing_purpose === "sale" ? { price: Number(salePrice) } : {}),
    }).eq("id", listing.id).eq("landlord_id", user.id)
    setSaving(false)
    if (updateError) setError(updateError.message)
    else { router.push("/properties"); router.refresh() }
  }

  return <RoleGuard allowedRoles={["landlord"]}><div className="mx-auto max-w-2xl space-y-6 pb-16"><div><h1 className="text-3xl font-bold tracking-tight">Edit sale listing</h1><p className="mt-2 text-sm text-muted-foreground">Changes to the asking price or description will be reviewed before the listing appears publicly again.</p></div>{loading ? <p className="text-sm text-muted-foreground">Loading listing…</p> : listing ? <Card><CardHeader><CardTitle>{listing.title}</CardTitle></CardHeader><CardContent><form onSubmit={save} className="space-y-5"><div className="space-y-2"><Label htmlFor="sale-edit-title">Title</Label><Input id="sale-edit-title" value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} /></div><div className="space-y-2"><Label htmlFor="sale-edit-price">Asking price ($)</Label><Input id="sale-edit-price" type="number" min="1" value={salePrice} onChange={e => setSalePrice(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="sale-edit-lot">Lot size (sq ft)</Label><Input id="sale-edit-lot" type="number" min="1" value={lotSize} onChange={e => setLotSize(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="sale-edit-description">Description</Label><Textarea id="sale-edit-description" value={description} onChange={e => setDescription(e.target.value)} rows={7} /></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => router.push("/properties")}>Cancel</Button></div></form></CardContent></Card> : <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Sale listing not found."}</p>}</div></RoleGuard>
}
