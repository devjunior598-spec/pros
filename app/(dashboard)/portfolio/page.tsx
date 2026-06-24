"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Loader2,
    Upload,
    X,
    ExternalLink
} from "lucide-react"

export default function PortfolioPage() {
    const [portfolio, setPortfolio] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [provider, setProvider] = useState<any>(null)

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [description, setDescription] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        const fetchPortfolio = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && !signal.aborted) {
                    const { data: providerData } = await supabase
                        .from('service_providers')
                        .select('*')
                        .eq('user_id', user.id)
                        .abortSignal(signal)
                        .single()

                    if (!signal.aborted) {
                        setProvider(providerData)
                    }

                    if (providerData && !signal.aborted) {
                        const { data } = await supabase
                            .from('provider_portfolio')
                            .select('*')
                            .eq('provider_id', providerData.id)
                            .order('created_at', { ascending: false })
                            .abortSignal(signal)

                        if (!signal.aborted) {
                            setPortfolio(data || [])
                        }
                    }
                }
            } catch (error) {
                if (signal.aborted) return
                console.error("Error fetching portfolio:", error)
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchPortfolio(controller.signal)
        return () => controller.abort()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
        }
    }

    const handleAddPortfolioItem = async () => {
        if (!provider || !file) return
        setIsSubmitting(true)
        try {
            // 1. Upload to storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${provider.id}/${Math.random()}.${fileExt}`
            const filePath = `portfolio/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('provider_documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('provider_documents')
                .getPublicUrl(filePath)

            // 2. Insert into database
            const { data, error } = await supabase
                .from('provider_portfolio')
                .insert({
                    provider_id: provider.id,
                    image_url: publicUrl,
                    description: description
                })
                .select()
                .single()

            if (error) throw error

            setPortfolio([data, ...portfolio])
            setIsAddModalOpen(false)
            setFile(null)
            setPreview(null)
            setDescription("")
            alert("Portfolio item added!")
        } catch (error: any) {
            console.error("Error adding portfolio item:", error)
            alert(error.message || "Failed to add item")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return
        try {
            const { error } = await supabase
                .from('provider_portfolio')
                .delete()
                .eq('id', id)
            if (error) throw error
            setPortfolio(portfolio.filter(item => item.id !== id))
        } catch (error) {
            console.error("Error deleting portfolio item:", error)
            alert("Failed to delete item")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Portfolio Management</h1>
                    <p className="text-muted-foreground">Showcase your best work to win more jobs.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add New Work
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : portfolio.length === 0 ? (
                <Card className="p-20 text-center border-dashed">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-xl font-semibold">Your portfolio is empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        Add photos of your previous repairs to build trust with landlords.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Upload First Photo
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {portfolio.map((item) => (
                        <Card key={item.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-950">
                            <div className="aspect-video relative overflow-hidden bg-gray-100">
                                <img
                                    src={item.image_url}
                                    alt="Work sample"
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8"
                                        onClick={() => handleDeleteItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                                    "{item.description}"
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    Added on {new Date(item.created_at).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Work Sample</DialogTitle>
                        <DialogDescription>
                            Upload a photo of a completed job and provide a short description.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Work Photo</Label>
                            {preview ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border">
                                    <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all">
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Click to upload photo</span>
                                    <span className="text-[10px] text-gray-400 mt-1">PNG, JPG or WebP up to 5MB</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Short Description</Label>
                            <Textarea
                                id="desc"
                                placeholder="Describe what you did in this job..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleAddPortfolioItem}
                            disabled={isSubmitting || !file}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...
                                </>
                            ) : "Add to Portfolio"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
