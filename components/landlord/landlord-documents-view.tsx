import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, User, Home, Eye, Download, Search, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DocumentManager } from "@/components/document-manager"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface LandlordDocumentsViewProps {
    landlordId: string
}

export function LandlordDocumentsView({ landlordId }: LandlordDocumentsViewProps) {
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [rentals, setRentals] = useState<any[]>([])
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('documents')
            .select(`
                *,
                tenant:profiles!inner (
                    name,
                    email
                ),
                rental:rentals!inner (
                    id,
                    property:properties!inner (
                        title,
                        landlord_id
                    )
                )
            `)
            .eq('rental.property.landlord_id', landlordId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching landlord documents:", error)
        } else {
            setDocuments(data || [])
        }
        setLoading(false)
    }, [landlordId])

    const fetchRentals = useCallback(async () => {
        const { data, error } = await supabase
            .from('rentals')
            .select(`
                id,
                tenant_id,
                tenant:profiles!tenant_id (name),
                property:properties!inner (title)
            `)
            .eq('landlord_id', landlordId)
            .eq('status', 'approved')

        if (error) {
            console.error("Error fetching rentals:", error)
        } else {
            setRentals(data || [])
        }
    }, [landlordId])

    useEffect(() => {
        if (landlordId) {
            fetchDocuments()
            fetchRentals()
        }
    }, [landlordId, fetchDocuments, fetchRentals])

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.rental?.property?.title?.toLowerCase().includes(search.toLowerCase())
    )

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case 'id_card': return 'ID Card'
            case 'lease_agreement': return 'Lease Agreement'
            case 'proof_of_payment': return 'Payment Proof'
            default: return 'Other'
        }
    }

    const selectedRental = rentals.find(r => r.id === selectedRentalId)

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold">Lease & Tenant Documents</h3>
                    <p className="text-sm text-muted-foreground">Manage official agreements and view documents shared by your tenants.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Lease
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Upload Official Document</DialogTitle>
                                <DialogDescription>
                                    Select a tenant and upload official lease agreements or other documents.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Tenant / Property</label>
                                    <Select value={selectedRentalId || ""} onValueChange={setSelectedRentalId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose an active rental..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rentals.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    {r.tenant?.name} - {r.property?.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedRentalId && selectedRental && (
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                        <DocumentManager
                                            tenantId={selectedRental.tenant_id}
                                            rentalId={selectedRentalId}
                                            isLandlord={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {filteredDocs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                        <FileText className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                        <p className="text-muted-foreground text-center">
                            {search ? "No documents match your search." : "No documents found."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className="bg-primary/5 p-4 flex items-center justify-center md:border-r">
                                        <FileText className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="flex-1 p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-lg">{doc.name}</h4>
                                                    {doc.uploaded_by === landlordId ? (
                                                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-[10px] h-4">Official</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">Tenant Shared</Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                    <Badge variant="secondary" className="text-xs">{getDocTypeLabel(doc.type)}</Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center">
                                                        <User className="h-3 w-3 mr-1" />
                                                        {doc.tenant?.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center">
                                                        <Home className="h-3 w-3 mr-1" />
                                                        {doc.rental?.property?.title}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Date</p>
                                                <p className="text-sm font-medium">{new Date(doc.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-muted/30 p-4 flex items-center space-x-2 justify-center md:flex-col md:space-x-0 md:space-y-2">
                                        <Button variant="outline" size="sm" asChild className="bg-white h-8 w-full">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </a>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="bg-white h-8 w-full">
                                            <a href={doc.url} download={doc.name}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
