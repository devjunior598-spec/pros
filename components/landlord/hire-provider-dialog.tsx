"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Briefcase } from "lucide-react"

interface HireProviderDialogProps {
    provider: any
    landlordId: string
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function HireProviderDialog({ provider, landlordId, onSuccess, trigger }: HireProviderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<any[]>([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        property_id: "",
        scheduled_date: ""
    })

    useEffect(() => {
        if (open && landlordId) {
            fetchProperties()
        }
    }, [open, landlordId])

    const fetchProperties = async () => {
        const { data } = await supabase
            .from('properties')
            .select('id, title, address')
            .eq('landlord_id', landlordId)

        setProperties(data || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('service_jobs')
            .insert({
                landlord_id: landlordId,
                provider_id: provider.id,
                title: formData.title,
                description: formData.description,
                property_id: formData.property_id || null, // Optional
                scheduled_date: formData.scheduled_date || null,
                status: 'pending'
            })

        if (error) {
            console.error("Error hiring provider:", error)
            alert("Failed to submit request.")
        } else {
            setOpen(false)
            setFormData({ title: "", description: "", property_id: "", scheduled_date: "" })
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Hire</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Hire {provider.provider?.full_name || provider.provider?.name}</DialogTitle>
                    <DialogDescription>
                        Send a job request to this provider. They will contact you to confirm details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Fix leaking sink in Apt 4B"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="property">Property (Optional)</Label>
                        <Select
                            value={formData.property_id}
                            onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Preferred Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.scheduled_date}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue in detail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
