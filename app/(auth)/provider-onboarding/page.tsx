"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const categories = ["Plumbing", "Electrical", "Rewiring", "Carpentry", "Painting", "Tiling", "Roofing", "AC Repair", "Waste Disposal", "General Handyman"]

export default function ProviderOnboardingPage() {
    const { user, profile, providerStatus, loading, authError, retryAuth } = useAuth()
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const inFlight = useRef(false)
    useEffect(() => {
        if (!loading && profile?.role === "service_provider" && providerStatus && providerStatus !== "incomplete") router.replace("/provider-dashboard")
    }, [loading, profile, providerStatus, router])

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (inFlight.current) return
        const form = new FormData(event.currentTarget)
        inFlight.current = true
        setSaving(true)
        setError("")
        try {
            const response = await fetch("/api/providers/onboarding", { method: "POST", body: form })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Unable to save your application")
            window.location.assign("/provider-dashboard")
        } catch (error) {
            setError(error instanceof Error ? error.message : "Please check your connection and try again")
        } finally { inFlight.current = false; setSaving(false) }
    }

    if (loading) return <Loader2 className="mx-auto h-8 w-8 animate-spin" />
    if (authError) return <div role="alert" className="space-y-4 rounded-xl bg-white p-6"><p>{authError}</p><Button onClick={retryAuth}>Try again</Button></div>
    if (!user) return <div className="rounded-xl bg-white p-6"><Link href="/provider-login" className="text-blue-600 underline">Sign in to complete your provider registration</Link></div>
    if (profile?.role !== "service_provider") return <div className="rounded-xl bg-white p-6"><p>This setup is for service providers.</p><Link href="/dashboard" className="text-blue-600 underline">Open your account</Link></div>
    if (providerStatus !== "incomplete") return <Loader2 className="mx-auto h-8 w-8 animate-spin" />
    const draft = user.user_metadata?.provider_registration || {}
    return <div className="space-y-5 rounded-xl border bg-white p-6 text-slate-900">
        <h1 className="text-2xl font-semibold">Complete provider registration</h1>
        <p className="text-sm text-slate-600">Your login is already saved. Review your details and upload your documents for approval. If submission fails, you can retry without creating another account.</p>
        <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={saving} className="space-y-4">
                <div className="space-y-1"><Label htmlFor="provider-name">Full name</Label><Input id="provider-name" name="fullName" defaultValue={profile.full_name || user.user_metadata?.full_name || ""} required maxLength={150} /></div>
                <div className="space-y-1"><Label htmlFor="provider-phone">Phone</Label><Input id="provider-phone" name="phone" defaultValue={profile.phone || user.user_metadata?.phone || ""} required maxLength={40} /></div>
                <div className="space-y-1"><Label htmlFor="provider-category">Trade</Label><select id="provider-category" name="category" defaultValue={draft.category || ""} required className="h-10 w-full rounded-md border px-3"><option value="">Select trade</option>{categories.map(category => <option key={category}>{category}</option>)}</select></div>
                <div className="space-y-1"><Label htmlFor="provider-experience">Years of experience</Label><Input id="provider-experience" name="experience" type="number" min={0} max={80} step={1} defaultValue={draft.experience || "0"} required /></div>
                <div className="space-y-1"><Label htmlFor="provider-state">State</Label><Input id="provider-state" name="state" defaultValue={draft.state || ""} required maxLength={80} /></div>
                <div className="space-y-1"><Label htmlFor="provider-city">City</Label><Input id="provider-city" name="city" defaultValue={draft.city || ""} required maxLength={80} /></div>
                <div className="space-y-1"><Label htmlFor="provider-bio">About your services</Label><textarea id="provider-bio" name="bio" defaultValue={draft.bio || ""} required maxLength={2000} className="min-h-24 w-full rounded-md border p-3" /></div>
                <div className="space-y-1"><Label htmlFor="provider-photo">Profile photo (maximum 1 MB)</Label><Input id="provider-photo" name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" required /></div>
                <div className="space-y-1"><Label htmlFor="provider-id">Government ID (maximum 2 MB)</Label><Input id="provider-id" name="governmentId" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /><p className="text-xs text-slate-500">Documents are stored privately for verification.</p></div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for review</Button>
            </fieldset>
        </form>
    </div>
}
