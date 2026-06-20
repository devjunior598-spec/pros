"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Image as ImageIcon, Building2, Plus, X, Loader2, Sparkles, ArrowLeft, CheckCircle2, MapPin } from "lucide-react"

export default function PostPropertyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        address: "",
        city: "",
        state: "",
        area: "",
        zip_code: "",
        type: "Apartment",
        bedrooms: "",
        bathrooms: "",
        square_footage: "",
        virtual_tour_url: "",
    })
    const [amenitiesString, setAmenitiesString] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        URL.revokeObjectURL(previews[index])
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("You must be logged in to post a property.")
                setLoading(false)
                return
            }

            const imageUrls: string[] = []

            // 1. Upload files
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(filePath)
                imageUrls.push(publicUrl)
            }

            // 2. Process amenities
            const amenities = amenitiesString.split(',').map(s => s.trim()).filter(Boolean)

            // 3. Insert into database
            const { error } = await supabase.from("properties").insert({
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                address: formData.address,
                city: formData.city,
                state: formData.state,
                area: formData.area,
                zip_code: formData.zip_code,
                type: formData.type,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
                amenities: amenities,
                images: imageUrls,
                landlord_id: user.id,
                status: "available",
                virtual_tour_url: formData.virtual_tour_url || null,
            })

            if (error) throw error

            alert("Property posted successfully!")
            router.push("/properties")
        } catch (error: any) {
            console.error("Error creating property:", error)
            alert(`Failed to post property: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 font-sans text-slate-900 dark:text-slate-100 max-w-4xl mx-auto py-4">
            
            {/* Header / Nav row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                            List a New Property
                        </h1>
                        <p className="text-xs text-slate-400">Deploy verified listing onto the PRMS rental engine</p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        <Sparkles className="h-3.5 w-3.5" />
                        Platform Onboarding
                    </div>
                    <CardTitle className="text-xl font-black">Property Listing Particulars</CardTitle>
                    <CardDescription className="text-slate-400 dark:text-slate-400 text-xs">
                        Configure pricing, location specifications, amenities, and media galleries.
                    </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 sm:p-8 space-y-8">
                        
                        {/* Section 1: Basic Particulars */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> 1. Basic Particulars
                            </h3>
                            
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property Title</Label>
                                <Input 
                                    id="title" 
                                    name="title" 
                                    placeholder="e.g. Modern 2-Bedroom Apartment in Lekki Phase 1" 
                                    required 
                                    value={formData.title} 
                                    onChange={handleChange}
                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detailed Description</Label>
                                <Textarea 
                                    id="description" 
                                    name="description" 
                                    placeholder="Outline your property's best assets, utility info, state of fixtures..." 
                                    required 
                                    className="min-h-[120px] bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl py-3 text-sm leading-relaxed" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Virtual Tour URL (Optional)</label>
                                <Input
                                    type="url"
                                    placeholder="https://matterport.com/..."
                                    value={formData.virtual_tour_url || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, virtual_tour_url: e.target.value }))}
                                    className="h-11 bg-slate-950/50 border-slate-700 rounded-xl"
                                />
                                <p className="text-[10px] text-slate-500">Paste a Matterport, YouTube, or Google Street View link for a virtual property tour.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Annual Rent Price (₦)</Label>
                                    <Input 
                                        id="price" 
                                        name="price" 
                                        type="number" 
                                        placeholder="₦ 3,500,000" 
                                        required 
                                        value={formData.price} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property Type</Label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-slate-100 font-sans"
                                    >
                                        <option value="Apartment">Apartment</option>
                                        <option value="Studio">Studio</option>
                                        <option value="Duplex">Duplex</option>
                                        <option value="House">House</option>
                                        <option value="Office">Office</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Address & Location */}
                        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> 2. Address & Location
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</Label>
                                    <Input 
                                        id="city" 
                                        name="city" 
                                        placeholder="Lagos" 
                                        required 
                                        value={formData.city} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Area / Neighborhood</Label>
                                    <Input 
                                        id="area" 
                                        name="area" 
                                        placeholder="Lekki Phase 1" 
                                        required 
                                        value={formData.area} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Address</Label>
                                <Input 
                                    id="address" 
                                    name="address" 
                                    placeholder="e.g. Plot 15, Admiralty Way" 
                                    required 
                                    value={formData.address} 
                                    onChange={handleChange}
                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State</Label>
                                    <Input 
                                        id="state" 
                                        name="state" 
                                        placeholder="Lagos State" 
                                        value={formData.state} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip_code" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zip Code (Optional)</Label>
                                    <Input 
                                        id="zip_code" 
                                        name="zip_code" 
                                        placeholder="101233" 
                                        value={formData.zip_code} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Room Specifications */}
                        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" /> 3. Specifications & Metrics
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bedrooms Count</Label>
                                    <Input 
                                        id="bedrooms" 
                                        name="bedrooms" 
                                        type="number" 
                                        placeholder="2" 
                                        value={formData.bedrooms} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bathrooms" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bathrooms Count</Label>
                                    <Input 
                                        id="bathrooms" 
                                        name="bathrooms" 
                                        type="number" 
                                        placeholder="2" 
                                        value={formData.bathrooms} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="square_footage" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Square Footage (Sqft)</Label>
                                    <Input 
                                        id="square_footage" 
                                        name="square_footage" 
                                        type="number" 
                                        placeholder="1200" 
                                        value={formData.square_footage} 
                                        onChange={handleChange}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Amenities */}
                        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> 4. Amenities Checklist
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="amenities" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amenities List</Label>
                                <Input
                                    id="amenities"
                                    placeholder="Pool, Gym, Allocated Parking, 24/7 Power, WiFi, Gated Security"
                                    value={amenitiesString}
                                    onChange={(e) => setAmenitiesString(e.target.value)}
                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                />
                                <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                                    Enter individual amenities separated by commas.
                                </p>
                            </div>
                        </div>

                        {/* Section 5: Media Uploads */}
                        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> 5. Property Media Gallery
                            </h3>

                            <div className="space-y-4">
                                <div className="p-6 border-2 border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl text-center space-y-2.5">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <Label htmlFor="image" className="block text-sm font-extrabold cursor-pointer hover:text-blue-500 transition-colors">
                                            Upload Media Files
                                        </Label>
                                        <p className="text-[10px] text-slate-400 mt-1">Select one or multiple photos. The first image will be configured as the primary thumbnail.</p>
                                    </div>
                                    <Input
                                        id="image"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 dark:bg-slate-900" onClick={() => document.getElementById("image")?.click()}>
                                        Browse Files
                                    </Button>
                                </div>

                                {/* Previews Grid */}
                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                        {previews.map((preview, index) => (
                                            <div key={index} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                                {index === 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 py-0.5 text-[8px] text-center font-extrabold uppercase text-white">Primary Photo</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </CardContent>
                    
                    {/* Form Footer Actions */}
                    <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/20 dark:bg-slate-950/20">
                        <Button variant="ghost" type="button" onClick={() => router.back()} className="rounded-xl font-bold dark:hover:bg-slate-900">
                            Cancel
                        </Button>
                        
                        <Button type="submit" disabled={loading} className="px-8 font-extrabold h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                "Publish Property"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

// SlidersHorizontal helper
function SlidersHorizontal(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="21" x2="14" y1="4" y2="4" />
            <line x1="10" x2="3" y1="4" y2="4" />
            <line x1="21" x2="12" y1="12" y2="12" />
            <line x1="8" x2="3" y1="12" y2="12" />
            <line x1="21" x2="16" y1="20" y2="20" />
            <line x1="12" x2="3" y1="20" y2="20" />
            <line x1="14" x2="14" y1="2" y2="6" />
            <line x1="8" x2="8" y1="10" y2="14" />
            <line x1="12" x2="12" y1="18" y2="22" />
        </svg>
    )
}
