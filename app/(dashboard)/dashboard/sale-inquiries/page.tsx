"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Inquiry = {
  id: string
  property_id: string
  buyer_id: string
  seller_id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  message: string
  preferred_viewing_date: string | null
  status: "new" | "contacted" | "closed"
  created_at: string
  properties: { title: string; city: string; state: string } | null
}

export default function SaleInquiriesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"received" | "sent">("received")

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from("sale_inquiries")
      .select("id, property_id, buyer_id, seller_id, contact_name, contact_email, contact_phone, message, preferred_viewing_date, status, created_at, properties(title, city, state)")
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
    setError(queryError?.message ?? "")
    if (!queryError) setItems((data ?? []) as unknown as Inquiry[])
    setLoading(false)
  }, [user])

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [load])

  const updateStatus = async (id: string, status: Inquiry["status"]) => {
    const { error: updateError } = await supabase.from("sale_inquiries").update({ status }).eq("id", id)
    if (updateError) setError(updateError.message)
    else setItems(current => current.map(item => item.id === id ? { ...item, status } : item))
  }

  const visible = items.filter(item => tab === "received" ? item.seller_id === user?.id : item.buyer_id === user?.id)

  return <RoleGuard allowedRoles={["tenant", "landlord"]}><div className="mx-auto max-w-5xl space-y-6 pb-16">
    <div><h1 className="text-3xl font-bold tracking-tight">Sales inquiries</h1><p className="mt-2 text-sm text-muted-foreground">Review buyer messages and your requests to view properties for sale.</p></div>
    <div className="flex gap-2 rounded-xl border bg-white p-1.5"><Button variant={tab === "received" ? "default" : "ghost"} onClick={() => setTab("received")} className="flex-1">Received</Button><Button variant={tab === "sent" ? "default" : "ghost"} onClick={() => setTab("sent")} className="flex-1">Sent</Button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading inquiries…</p> : visible.length === 0 ? <Card><CardContent className="p-8 text-center"><p className="font-semibold">No {tab} inquiries yet</p><p className="mt-1 text-sm text-muted-foreground">{tab === "sent" ? "Browse properties for sale and contact an owner." : "Buyer messages will appear here when someone inquires about your listing."}</p><Button asChild variant="outline" className="mt-4"><Link href={tab === "sent" ? "/listings?purpose=sale" : "/dashboard/properties/add/sale"}>{tab === "sent" ? "Browse for sale" : "List a property"}</Link></Button></CardContent></Card> : <div className="space-y-4">{visible.map(item => <Card key={item.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/listings/${item.property_id}?purpose=sale`} className="font-semibold text-primary hover:underline">{item.properties?.title ?? "Property"}</Link><p className="text-xs text-muted-foreground">{[item.properties?.city, item.properties?.state].filter(Boolean).join(", ")} · {new Date(item.created_at).toLocaleDateString("en-US")}</p></div><Badge variant="secondary" className="capitalize">{item.status}</Badge></div><p className="whitespace-pre-wrap text-sm">{item.message}</p>{item.preferred_viewing_date && <p className="text-sm"><b>Preferred viewing:</b> {new Date(`${item.preferred_viewing_date}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>}<div className="border-t pt-3 text-sm"><p><b>Contact:</b> {item.contact_name}</p><a className="text-primary hover:underline" href={`mailto:${item.contact_email}`}>{item.contact_email}</a>{item.contact_phone && <p>{item.contact_phone}</p>}</div>{tab === "received" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void updateStatus(item.id, "contacted")}>Mark contacted</Button><Button size="sm" variant="outline" onClick={() => void updateStatus(item.id, "closed")}>Close</Button></div>}</CardContent></Card>)}</div>}
  </div></RoleGuard>
}
