"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function AdminKYCReviewList() {
    const [kycs, setKycs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    const fetchKYCs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('tenant_kyc')
            .select(`
                *,
                tenant:profiles (
                    name,
                    email
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching KYCs:", error)
        } else {
            setKycs(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchKYCs()
    }, [])

    const handleReview = async (kycId: string, tenantId: string, status: 'approved' | 'rejected') => {
        setProcessingId(kycId)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const response = await fetch('/api/kyc/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kycId,
                    tenantId,
                    status,
                    rejectionReason: status === 'rejected' ? rejectionReason : null,
                    adminId: user?.id
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.message)

            alert(`KYC ${status} successfully`)
            fetchKYCs()
            setRejectionReason("")
        } catch (error: any) {
            console.error("Review error:", error)
            alert(error.message || "Failed to process review")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tenant KYC Verification Queue</CardTitle>
                <CardDescription>Review and approve or reject tenant identity documents.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>ID Type</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {kycs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No KYC submissions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            kycs.map((kyc) => (
                                <TableRow key={kyc.id}>
                                    <TableCell>
                                        <div className="font-medium">{kyc.tenant?.name}</div>
                                        <div className="text-xs text-muted-foreground">{kyc.tenant?.email}</div>
                                    </TableCell>
                                    <TableCell>{kyc.id_type}</TableCell>
                                    <TableCell>{new Date(kyc.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            kyc.status === 'approved' ? 'default' :
                                                kyc.status === 'pending' ? 'outline' : 'destructive'
                                        }>
                                            {kyc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>KYC Review: {kyc.tenant?.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b pb-2">Tenant Details</h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div className="text-muted-foreground">Name:</div>
                                                            <div>{kyc.tenant?.name}</div>
                                                            <div className="text-muted-foreground">DOB:</div>
                                                            <div>{new Date(kyc.dob).toLocaleDateString()}</div>
                                                            <div className="text-muted-foreground">Address:</div>
                                                            <div className="col-span-full bg-muted p-2 rounded mt-1">{kyc.address}</div>
                                                        </div>

                                                        <h4 className="font-semibold border-b pb-2 mt-6">ID Information</h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div className="text-muted-foreground">Type:</div>
                                                            <div>{kyc.id_type}</div>
                                                            <div className="text-muted-foreground">Number:</div>
                                                            <div>{kyc.id_number}</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b pb-2">Documents</h4>
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">Government ID</div>
                                                            <div className="aspect-video bg-muted rounded-md overflow-hidden relative group">
                                                                <img src={kyc.id_image_url} alt="ID card" className="object-contain w-full h-full" />
                                                                <a href={kyc.id_image_url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                                    <ExternalLink className="h-6 w-6" />
                                                                </a>
                                                            </div>

                                                            <div className="text-sm font-medium mt-4">Selfie with ID</div>
                                                            <div className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                                                                <img src={kyc.selfie_image_url} alt="Selfie" className="object-contain w-full h-full" />
                                                                <a href={kyc.selfie_image_url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                                    <ExternalLink className="h-6 w-6" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {kyc.status === 'pending' && (
                                                    <div className="mt-8 border-t pt-6 space-y-4">
                                                        <div>
                                                            <Label>Rejection Reason (only if rejecting)</Label>
                                                            <Textarea
                                                                placeholder="Reason for rejection..."
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-3">
                                                            <Button
                                                                variant="destructive"
                                                                disabled={!!processingId}
                                                                onClick={() => handleReview(kyc.id, kyc.tenant_id, 'rejected')}
                                                            >
                                                                {processingId === kyc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                className="bg-green-600 hover:bg-green-700"
                                                                disabled={!!processingId}
                                                                onClick={() => handleReview(kyc.id, kyc.tenant_id, 'approved')}
                                                            >
                                                                {processingId === kyc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
