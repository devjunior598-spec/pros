"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Loader2,
    Upload,
    FileText,
    Trash2,
    Eye,
    Download,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface DocumentManagerProps {
    tenantId: string
    rentalId?: string
    isLandlord?: boolean
}

export function DocumentManager({ tenantId, rentalId, isLandlord = false }: DocumentManagerProps) {
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState(false)

    // Form state
    const [file, setFile] = useState<File | null>(null)
    const [docType, setDocType] = useState("other")

    const fetchDocuments = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching documents:", error)
        } else {
            setDocuments(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        if (tenantId) {
            fetchDocuments()
        }
    }, [tenantId])

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)
        setUploadError(null)
        setUploadSuccess(false)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${tenantId}/${fileName}`

            // 1. Upload to Storage
            const { error: storageError, data: storageData } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (storageError) throw storageError

            // 2. Get Public URL (or Private URL signed if bucket is private)
            // For simplicity and to show usage, we'll use publicUrl if bucket is public,
            // but for sensitive docs, signed URLs are better.
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            // 3. Save to DB
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: file.name,
                    url: publicUrl,
                    storage_path: filePath,
                    type: docType,
                    tenant_id: tenantId,
                    rental_id: rentalId,
                    uploaded_by: user.id,
                })

            if (dbError) throw dbError

            setUploadSuccess(true)
            setFile(null)
            // Reset input
            const input = document.getElementById('file-upload') as HTMLInputElement
            if (input) input.value = ''

            fetchDocuments()
        } catch (error: any) {
            console.error("Upload error:", error)
            setUploadError(error.message || "Failed to upload document")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (doc: any) => {
        if (!confirm("Are you sure you want to delete this document?")) return

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([doc.storage_path])

            if (storageError) throw storageError

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id)

            if (dbError) throw dbError

            fetchDocuments()
        } catch (error: any) {
            console.error("Delete error:", error)
            alert("Failed to delete document")
        }
    }

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case 'id_card': return 'ID Card'
            case 'lease_agreement': return 'Lease Agreement'
            case 'proof_of_payment': return 'Payment Proof'
            default: return 'Other'
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{isLandlord ? 'Upload Official Document' : 'Upload Document'}</CardTitle>
                    <CardDescription>
                        {isLandlord
                            ? "Upload lease agreements or other files for this tenant."
                            : "Upload IDs, lease agreements, or other important files."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="doc-type">Document Type</Label>
                                <Select value={docType} onValueChange={setDocType}>
                                    <SelectTrigger id="doc-type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id_card">ID Card / Passport</SelectItem>
                                        <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                                        <SelectItem value="proof_of_payment">Proof of Payment</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                        </div>

                        {uploadError && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {uploadError}
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Document uploaded successfully!
                            </div>
                        )}

                        <Button type="submit" disabled={uploading || !file}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isLandlord ? 'Upload to Tenant' : 'Upload Document'}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Documents</CardTitle>
                    <CardDescription>
                        {isLandlord ? "Documents uploaded by this tenant." : "A list of all your uploaded documents."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                            <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p className="text-muted-foreground">No documents found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <div className="flex items-center space-x-2 mt-1 text-xs">
                                                <Badge variant="secondary" className="text-[10px] uppercase h-4">
                                                    {getDocTypeLabel(doc.type)}
                                                </Badge>
                                                <span className="text-muted-foreground">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-muted-foreground italic border-l pl-2">
                                                    Uploaded by: {doc.uploaded_by === tenantId ? 'Tenant' : 'Landlord'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="icon" asChild title="View">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild title="Download">
                                            <a href={doc.url} download={doc.name}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        {!isLandlord && (
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc)} title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
