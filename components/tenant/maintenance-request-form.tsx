"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"

interface MaintenanceRequestFormProps {
    tenantId: string
    onSuccess?: () => void
}

export function MaintenanceRequestForm({ tenantId, onSuccess }: MaintenanceRequestFormProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("medium")
    const [category, setCategory] = useState("plumbing")
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            if (files.length + newFiles.length > 5) {
                alert("Maximum 5 images allowed")
                return
            }

            // Filter by size (5MB) and type
            const validFiles = newFiles.filter(file => {
                const isValidSize = file.size <= 5 * 1024 * 1024
                const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
                return isValidSize && isValidType
            })

            if (validFiles.length < newFiles.length) {
                alert("Some files were rejected (max 5MB, JPG/PNG/WEBP only)")
            }

            setFiles(prev => [...prev, ...validFiles])
            const newPreviews = validFiles.map(file => URL.createObjectURL(file))
            setPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Get the tenant's current active rental
            const { data: rentals, error: rentalError } = await supabase
                .from('rentals')
                .select('id, property_id, property:properties(city, state)')
                .eq('tenant_id', tenantId)
                .is('end_date', null)

            if (rentalError) throw rentalError

            if (!rentals || rentals.length === 0) {
                throw new Error("You do not appear to have an active rental to submit a request for.")
            }

            const rental = rentals[0] as any
            const propertyId = rental.property_id
            const city = rental.property?.city
            const state = rental.property?.state

            // 2. Submit the request
            const { data: request, error: submitError } = await supabase
                .from('maintenance_requests')
                .insert({
                    tenant_id: tenantId,
                    rental_id: rental.id,
                    property_id: propertyId,
                    title,
                    description,
                    priority,
                    category,
                    location_city: city,
                    location_state: state,
                    status: 'pending'
                })
                .select()
                .single()

            if (submitError) throw submitError

            // 3. Upload Images if any
            if (files.length > 0 && request) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${request.id}/${Math.random()}.${fileExt}`
                    const filePath = `maintenance/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('maintenance_images')
                        .upload(filePath, file)

                    if (uploadError) {
                        console.error("Upload error:", uploadError)
                        continue
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('maintenance_images')
                        .getPublicUrl(filePath)

                    await supabase
                        .from('request_images')
                        .insert({
                            request_id: request.id,
                            image_url: publicUrl
                        })
                }
            }

            // Reset form
            setTitle("")
            setDescription("")
            setPriority("medium")
            setCategory("plumbing")
            setFiles([])
            setPreviews([])

            if (onSuccess) onSuccess()
            alert("Maintenance request submitted successfully!")

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to submit request")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit New Request</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Leaking Faucet"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Plumbing">Plumbing</SelectItem>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Rewiring">Rewiring</SelectItem>
                                <SelectItem value="Carpentry">Carpentry</SelectItem>
                                <SelectItem value="Painting">Painting</SelectItem>
                                <SelectItem value="Tiling">Tiling</SelectItem>
                                <SelectItem value="Roofing">Roofing</SelectItem>
                                <SelectItem value="AC Repair">AC Repair</SelectItem>
                                <SelectItem value="Waste Disposal">Waste Disposal</SelectItem>
                                <SelectItem value="General Handyman">General Handyman</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Images (Max 5)</Label>
                        <div className="grid grid-cols-5 gap-2">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                                    <img src={preview} alt="preview" className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {files.length < 5 && (
                                <label className="flex flex-col items-center justify-center aspect-square rounded-md border border-dashed border-muted-foreground/50 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground mt-1 text-center px-1">Upload JPG/PNG</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue in detail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
