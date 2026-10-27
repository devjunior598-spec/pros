"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, FileText, Loader2, Save, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Property = { id: string; title: string; address: string; city: string; price: number }
type Fields = Record<"fullName" | "email" | "phone" | "currentAddress" | "occupation" | "employer" | "employmentStatus" | "monthlyIncome" | "preferredMoveInDate" | "numberOfOccupants" | "reasonForMoving" | "applicationLetter" | "guarantorName" | "guarantorPhone" | "guarantorAddress" | "references", string>
const empty: Fields = { fullName: "", email: "", phone: "", currentAddress: "", occupation: "", employer: "", employmentStatus: "", monthlyIncome: "", preferredMoveInDate: "", numberOfOccupants: "1", reasonForMoving: "", applicationLetter: "", guarantorName: "", guarantorPhone: "", guarantorAddress: "", references: "" }
const documentOptions = [["government_id", "Government ID"], ["proof_of_income", "Proof of income"], ["employment_letter", "Employment letter"], ["supporting_document", "Supporting documents"]] as const

export default function PropertyApplicationPage() {
  const { id } = useParams<{ id: string }>()
  const unitId = useSearchParams().get("unitId")
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [form, setForm] = useState<Fields>(empty)
  const [documents, setDocuments] = useState<Record<string, File | null>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(`/properties/${id}/apply${unitId ? `?unitId=${unitId}` : ""}`)}`)
  }, [authLoading, id, router, unitId, user])
  useEffect(() => {
    if (!user) return
    setForm((current) => ({ ...current, fullName: profile?.full_name || profile?.name || current.fullName, email: profile?.email || user.email || current.email, phone: profile?.phone || current.phone, currentAddress: profile?.address || current.currentAddress, occupation: profile?.occupation || current.occupation, employer: profile?.company || current.employer }))
  }, [profile, user])
  useEffect(() => { void (async () => { const { data, error } = await supabase.from("properties").select("id,title,address,city,price").eq("id", id).eq("country", "United States").eq("publication_status", "published").maybeSingle(); if (error || !data) setError("Property is unavailable."); else setProperty(data); setLoading(false) })() }, [id])
  const set = (key: keyof Fields, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent, intent: "draft" | "submit") => {
    event.preventDefault(); setError(null)
    if (intent === "submit" && (!/^\S+@\S+\.\S+$/.test(form.email) || form.phone.replace(/\D/g, "").length < 7)) { setError("Enter a valid email address and phone number."); return }
    for (const [type, file] of Object.entries(documents)) if (file && (file.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type))) { setError(`${type.replaceAll("_", " ")} must be a PDF, image, or Word document under 10 MB.`); return }
    setSubmitting(intent)
    try {
      const body = new FormData(); body.set("propertyId", id); if (unitId) body.set("unitId", unitId); body.set("intent", intent)
      Object.entries(form).forEach(([key, value]) => body.set(key, value))
      Object.entries(documents).forEach(([type, file]) => { if (file) body.append("documents", new File([file], `${type}__${file.name}`, { type: file.type })) })
      const response = await fetch("/api/applications", { method: "POST", body }); const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not save your application")
      router.replace("/dashboard/tenant/applications")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your application") } finally { setSubmitting(null) }
  }
  if (loading || authLoading) return <div className="mx-auto max-w-3xl animate-pulse space-y-4 py-8"><div className="h-10 w-2/5 rounded bg-muted" /><div className="h-96 rounded-xl bg-muted" /></div>
  if (!property) return <div className="mx-auto max-w-xl py-12 text-center"><p className="text-destructive">{error || "Property not found."}</p><Button className="mt-4" variant="outline" onClick={() => router.back()}>Go back</Button></div>
  return <form onSubmit={(event) => submit(event, "submit")} className="mx-auto max-w-3xl space-y-5 pb-28"><Button type="button" variant="ghost" className="min-h-11" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to listing</Button><Card><CardHeader><CardTitle>Apply for {property.title}</CardTitle><p className="text-sm text-muted-foreground">{property.address}, {property.city}</p></CardHeader><CardContent className="space-y-5">{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<section className="grid gap-4 sm:grid-cols-2">{([['fullName','Full name'],['email','Email'],['phone','Phone'],['currentAddress','Current address'],['occupation','Occupation'],['employer','Employer'],['employmentStatus','Employment status'],['monthlyIncome','Monthly income'],['preferredMoveInDate','Preferred move-in date'],['numberOfOccupants','Number of occupants']] as const).map(([key,label]) => <div key={key} className={key === 'currentAddress' ? 'sm:col-span-2' : ''}><Label htmlFor={key}>{label}{['fullName','email','phone','occupation','employmentStatus','monthlyIncome','preferredMoveInDate','numberOfOccupants'].includes(key) && ' *'}</Label><Input id={key} type={key === 'email' ? 'email' : key === 'preferredMoveInDate' ? 'date' : key === 'monthlyIncome' || key === 'numberOfOccupants' ? 'number' : 'text'} min={key === 'numberOfOccupants' ? '1' : undefined} value={form[key]} onChange={(e) => set(key, e.target.value)} /></div>)}</section><section className="space-y-4"><Label htmlFor="reasonForMoving">Reason for moving *</Label><Textarea id="reasonForMoving" value={form.reasonForMoving} onChange={(e) => set('reasonForMoving', e.target.value)} /><Label htmlFor="applicationLetter">Application letter</Label><Textarea id="applicationLetter" className="min-h-32" value={form.applicationLetter} onChange={(e) => set('applicationLetter', e.target.value)} /></section><section className="grid gap-4 sm:grid-cols-2"><div><Label>Guarantor name *</Label><Input value={form.guarantorName} onChange={(e) => set('guarantorName', e.target.value)} /></div><div><Label>Guarantor phone *</Label><Input value={form.guarantorPhone} onChange={(e) => set('guarantorPhone', e.target.value)} /></div><div className="sm:col-span-2"><Label>Guarantor address *</Label><Input value={form.guarantorAddress} onChange={(e) => set('guarantorAddress', e.target.value)} /></div><div className="sm:col-span-2"><Label>References</Label><Textarea value={form.references} onChange={(e) => set('references', e.target.value)} /></div></section><section className="space-y-3"><h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Supporting documents</h2><p className="text-xs text-muted-foreground">PDF, image, or Word files up to 10 MB. Documents remain private.</p>{documentOptions.map(([type,label]) => <div key={type}><Label>{label}</Label><Input type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" onChange={(e) => setDocuments((old) => ({ ...old, [type]: e.target.files?.[0] || null }))} /></div>)}</section></CardContent></Card><div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur md:left-64"><div className="mx-auto flex max-w-3xl gap-3"><Button type="button" variant="outline" className="min-h-11 flex-1" disabled={!!submitting} onClick={(event) => void submit(event, "draft")}>{submitting === 'draft' ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" />Save draft</>}</Button><Button type="submit" className="min-h-11 flex-1" disabled={!!submitting}>{submitting === 'submit' ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Submit application</>}</Button></div></div></form>
}
