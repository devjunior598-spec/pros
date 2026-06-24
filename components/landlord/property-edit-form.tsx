"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X, Plus, ImageIcon, Sparkles } from "lucide-react"
import { Property, PropertyStatus } from "@/types"

interface PropertyEditFormProps {
    property: Property
    onSuccess: () => void
}

export function PropertyEditForm({ property, onSuccess }: PropertyEditFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Property>>({
        title: property.title,
        price: property.price,
        frequency: property.frequency || 'Monthly',
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code,
        area: property.area,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        toilets: property.toilets,
        size: property.size || property.square_footage,
        square_footage: property.square_footage,
        status: property.status,
        description: property.description,
        amenities: property.amenities || [],
        images: property.images || [],
    })

    // Local state for comma-separated amenities string
    const [amenitiesString, setAmenitiesString] = useState(property.amenities?.join(', ') || '')
    // State for image handling
    const [existingImages, setExistingImages] = useState<string[]>(property.images || [])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [newPreviews, setNewPreviews] = useState<string[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const addedFiles = Array.from(e.target.files)
            setNewFiles(prev => [...prev, ...addedFiles])

            const addedPreviews = addedFiles.map(file => URL.createObjectURL(file))
            setNewPreviews(prev => [...prev, ...addedPreviews])
        }
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
        URL.revokeObjectURL(newPreviews[index])
        setNewPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const uploadedUrls: string[] = []

            // 1. Upload new files if any
            for (const file of newFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filePath)
                uploadedUrls.push(publicUrl)
            }

            // 2. Combine existing (filtered) and new uploaded URLs
            const finalImageUrls = [...existingImages, ...uploadedUrls]

            // 3. Process amenities
            const processedAmenities = amenitiesString.split(',').map(s => s.trim()).filter(Boolean)

            // 4. Update database
            const processedData = {
                ...formData,
                square_footage: formData.size, // Sync square_footage
                amenities: processedAmenities,
                images: finalImageUrls
            }

            const { error } = await supabase
                .from('properties')
                .update(processedData)
                .eq('id', property.id)

            if (error) throw error

            onSuccess()
        } catch (error: any) {
            console.error("Error updating property:", error)
            alert(`Failed to update property: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 dark:text-slate-100 font-sans">
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 px-1 scrollbar-thin">
                
                {/* Title and Type Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="type" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Apartment">Apartment</SelectItem>
                                <SelectItem value="House">House</SelectItem>
                                <SelectItem value="Duplex">Duplex</SelectItem>
                                <SelectItem value="Studio">Studio</SelectItem>
                                <SelectItem value="Shop">Shop</SelectItem>
                                <SelectItem value="Office">Office</SelectItem>
                                <SelectItem value="Land">Land</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Price, Frequency, and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price (₦)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            required
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="frequency" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Frequency</Label>
                        <Select
                            value={formData.frequency}
                            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                        >
                            <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="status" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupancy Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value: PropertyStatus) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="rented">Rented</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</Label>
                    <Input
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. Plot 15, Admiralty Way"
                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                </div>

                {/* City, State, Zip Code */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State</Label>
                        <Input
                            id="state"
                            value={formData.state || ''}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="zip_code" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zip Code</Label>
                        <Input
                            id="zip_code"
                            value={formData.zip_code || ''}
                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="area" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Area / Neighborhood</Label>
                    <Input
                        id="area"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        required
                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                </div>

                {/* Specs Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="bedrooms" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bedrooms</Label>
                        <Input
                            id="bedrooms"
                            type="number"
                            value={formData.bedrooms || ''}
                            onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="bathrooms" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bathrooms</Label>
                        <Input
                            id="bathrooms"
                            type="number"
                            value={formData.bathrooms || ''}
                            onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="toilets" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Toilets</Label>
                        <Input
                            id="toilets"
                            type="number"
                            value={formData.toilets || ''}
                            onChange={(e) => setFormData({ ...formData, toilets: Number(e.target.value) })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="size" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size (Sqft)</Label>
                        <Input
                            id="size"
                            type="number"
                            value={formData.size || ''}
                            onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
                            className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                </div>

                {/* Amenities */}
                <div className="space-y-1.5">
                    <Label htmlFor="amenities" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amenities (comma separated)</Label>
                    <Input
                        id="amenities"
                        value={amenitiesString}
                        onChange={(e) => setAmenitiesString(e.target.value)}
                        placeholder="Pool, Gym, Parking, WiFi"
                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl py-3 text-sm"
                    />
                </div>

                {/* Images Gallery */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4" /> Manage Media Gallery
                    </h3>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400">Active Listing Photos</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {existingImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <img src={url} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 py-0.5 text-[8px] text-center font-extrabold uppercase text-white">Primary</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Previews */}
                    {newPreviews.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-450 dark:text-slate-400">Newly Added (Pending upload)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {newPreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative group aspect-video rounded-xl overflow-hidden border border-blue-600/60">
                                        <img src={preview} alt={`New Preview ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(index)}
                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-100 hover:bg-red-650 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500/20 py-0.5 text-[8px] text-center font-bold uppercase tracking-tighter text-blue-400">New</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Button */}
                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl text-center space-y-1">
                        <Label htmlFor="new-images" className="block text-xs font-bold flex items-center justify-center cursor-pointer hover:text-blue-500 transition-colors">
                            <Plus className="mr-1 h-4 w-4" /> Add More Photos
                        </Label>
                        <Input
                            id="new-images"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                            Choose supplementary property photos.
                        </p>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full font-bold h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10 mt-4 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        <span>Saving adjustments...</span>
                    </>
                ) : (
                    <span>Save Changes</span>
                )}
            </Button>
        </form>
    )
}
