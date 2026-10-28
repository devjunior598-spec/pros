"use client"

import { useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function SaleInquiryForm({ propertyId, sellerId, user }: { propertyId: string; sellerId: string; user: User | null }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [viewingDate, setViewingDate] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  if (!user) return <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-950"><p>Sign in to contact the owner or request a viewing.</p><Button asChild className="mt-3 w-full"><Link href={`/login?next=${encodeURIComponent(`/listings/${propertyId}?purpose=sale`)}`}>Sign in to inquire</Link></Button></div>
  if (user.id === sellerId) return <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">This is your property listing.</p>
  if (sent) return <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-semibold">Inquiry sent</p><p className="mt-1">The owner can review your message in their dashboard. You can track it under Sales inquiries.</p><Button asChild variant="outline" className="mt-3"><Link href="/dashboard/sale-inquiries">View my inquiries</Link></Button></div>

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (name.trim().length < 2 || message.trim().length < 10) {
      setError("Enter your name and a message of at least 10 characters.")
      return
    }
    setBusy(true)
    const { error: insertError } = await supabase.from("sale_inquiries").insert({
      property_id: propertyId,
      buyer_id: user.id,
      seller_id: sellerId,
      contact_name: name.trim(),
      contact_email: (email || user.email || "").trim(),
      contact_phone: phone.trim() || null,
      message: message.trim(),
      preferred_viewing_date: viewingDate || null,
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else setSent(true)
  }

  return <form onSubmit={submit} className="space-y-3">
    <p className="text-sm text-slate-600">Ask a question or suggest a date to view this property. Your name, contact details, and message will be visible to the owner. No payment is collected here.</p>
    <div className="space-y-1"><Label htmlFor="sale-contact-name">Your name</Label><Input id="sale-contact-name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name" /></div>
    <div className="space-y-1"><Label htmlFor="sale-contact-email">Email</Label><Input id="sale-contact-email" type="email" value={email || user.email || ""} onChange={e => setEmail(e.target.value)} required maxLength={254} autoComplete="email" /></div>
    <div className="space-y-1"><Label htmlFor="sale-contact-phone">Phone (optional)</Label><Input id="sale-contact-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></div>
    <div className="space-y-1"><Label htmlFor="sale-viewing-date">Preferred viewing date (optional)</Label><Input id="sale-viewing-date" type="date" min={new Date().toISOString().slice(0, 10)} value={viewingDate} onChange={e => setViewingDate(e.target.value)} /></div>
    <div className="space-y-1"><Label htmlFor="sale-message">Message</Label><Textarea id="sale-message" value={message} onChange={e => setMessage(e.target.value)} required minLength={10} maxLength={2000} placeholder="I'd like to learn more about the property and arrange a viewing." /></div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send inquiry"}</Button>
  </form>
}
