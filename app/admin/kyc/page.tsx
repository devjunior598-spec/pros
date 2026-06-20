"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ShieldCheck,
    XCircle,
    CheckCircle,
    Eye,
    Search,
    Filter,
    Loader2,
    Clock,
    User,
    ExternalLink,
    AlertTriangle
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AdminKYCPage() {
    const [tenants, setTenants] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("tenants")
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    const fetchVerifications = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/kyc')
            if (!res.ok) throw new Error("Failed to fetch verifications")

            const data = await res.json()
            setTenants(data.tenants || [])
            setProviders(data.providers || [])
        } catch (error) {
            console.error("Error fetching verifications:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVerifications()
    }, [])

    const handleTenantReview = async (kyc: any, status: 'approved' | 'rejected') => {
        setProcessingId(kyc.id)
        try {
            const res = await fetch('/api/admin/kyc/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: kyc.id,
                    type: 'tenant',
                    status,
                    userId: kyc.tenant_id,
                    rejectionReason: status === 'rejected' ? rejectionReason : undefined
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to update status")

            alert(data.message)
            fetchVerifications()
            setRejectionReason("")
        } catch (error: any) {
            alert(error.message || "Failed to update status")
        } finally {
            setProcessingId(null)
        }
    }

    const handleProviderReview = async (provider: any, status: 'approved' | 'rejected') => {
        setProcessingId(provider.id)
        try {
            const res = await fetch('/api/admin/kyc/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: provider.id,
                    type: 'provider',
                    status,
                    userId: provider.user_id
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to update status")

            alert(data.message)
            fetchVerifications()
        } catch (error: any) {
            alert(error.message || "Failed to update status")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Verification Center</h1>
                    <p className="text-muted-foreground">Manage identity and professional verifications.</p>
                </div>
            </div>

            <Tabs defaultValue="tenants" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6">
                    <TabsTrigger value="tenants" className="rounded-lg gap-2">
                        Tenant KYC {tenants.filter(k => k.status === 'pending').length > 0 &&
                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                {tenants.filter(k => k.status === 'pending').length}
                            </Badge>
                        }
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="rounded-lg gap-2">
                        Provider Approvals {providers.filter(p => p.approval_status === 'pending').length > 0 &&
                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                {providers.filter(p => p.approval_status === 'pending').length}
                            </Badge>
                        }
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tenants">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Tenant Identity Queue</CardTitle>
                            <CardDescription>Review Government ID and selfie submissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Tenant</th>
                                            <th className="px-6 py-4">ID Type</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Submitted</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : tenants.length === 0 ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic">No tenant submissions yet.</td></tr>
                                        ) : (
                                            tenants.map((kyc) => (
                                                <tr key={kyc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">
                                                        <div>{kyc.tenant?.name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{kyc.tenant?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">{kyc.id_type}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={kyc.status === 'approved' ? 'default' : kyc.status === 'rejected' ? 'destructive' : 'outline'}>
                                                            {kyc.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                                        {new Date(kyc.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="gap-2">
                                                                    <Eye className="h-3 w-3" /> Review
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                                                                <DialogHeader>
                                                                    <DialogTitle>KYC Review: {kyc.tenant?.name}</DialogTitle>
                                                                    <DialogDescription>Verify the submitted documents match the tenant profile.</DialogDescription>
                                                                </DialogHeader>

                                                                <div className="grid md:grid-cols-2 gap-6 py-4">
                                                                    <div className="space-y-4">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs text-muted-foreground">Government ID ({kyc.id_type})</Label>
                                                                            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border">
                                                                                <img src={kyc.id_image_url} alt="ID" className="w-full h-full object-contain" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs text-muted-foreground">Selfie with ID</Label>
                                                                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border">
                                                                                <img src={kyc.selfie_image_url} alt="Selfie" className="w-full h-full object-contain" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
                                                                            <h4 className="font-bold text-sm border-b pb-2">Application Data</h4>
                                                                            <div className="grid grid-cols-2 gap-y-3 text-xs">
                                                                                <span className="text-muted-foreground">ID Number:</span>
                                                                                <span className="font-medium">{kyc.id_number}</span>
                                                                                <span className="text-muted-foreground">Date of Birth:</span>
                                                                                <span className="font-medium">{new Date(kyc.dob).toLocaleDateString()}</span>
                                                                                <span className="text-muted-foreground">Address:</span>
                                                                                <span className="font-medium">{kyc.address}</span>
                                                                            </div>
                                                                        </div>

                                                                        {kyc.status === 'pending' && (
                                                                            <div className="space-y-3 pt-4 border-t">
                                                                                <Label htmlFor="reason">Rejection Reason</Label>
                                                                                <Textarea
                                                                                    id="reason"
                                                                                    placeholder="Required only for rejection..."
                                                                                    className="text-xs"
                                                                                    value={rejectionReason}
                                                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <DialogFooter>
                                                                    <Button variant="ghost" onClick={() => { }}>Close</Button>
                                                                    {kyc.status === 'pending' && (
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                variant="destructive"
                                                                                onClick={() => handleTenantReview(kyc, 'rejected')}
                                                                                disabled={processingId === kyc.id}
                                                                            >
                                                                                Reject
                                                                            </Button>
                                                                            <Button
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                                onClick={() => handleTenantReview(kyc, 'approved')}
                                                                                disabled={processingId === kyc.id}
                                                                            >
                                                                                Approve
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="providers">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Service Provider Registry</CardTitle>
                            <CardDescription>Review professional profiles and approval status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Provider</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Experience</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : providers.length === 0 ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic">No provider registrations yet.</td></tr>
                                        ) : (
                                            providers.map((p) => (
                                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">
                                                        <div>{p.user?.name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{p.user?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{p.category}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">{p.experience_years} Years</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={p.approval_status === 'approved' ? 'default' : p.approval_status === 'rejected' ? 'destructive' : 'outline'}>
                                                            {p.approval_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {p.approval_status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-green-600 h-8 px-2"
                                                                        onClick={() => handleProviderReview(p, 'approved')}
                                                                        disabled={processingId === p.id}
                                                                        title="Approve immediately"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 h-8 px-2"
                                                                        onClick={() => handleProviderReview(p, 'rejected')}
                                                                        disabled={processingId === p.id}
                                                                        title="Reject immediately"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-8 gap-1">
                                                                        <Eye className="h-3 w-3" /> Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Provider Profile: {p.user?.name}</DialogTitle>
                                                                        <DialogDescription>Review professional qualifications and details.</DialogDescription>
                                                                    </DialogHeader>

                                                                    <div className="grid md:grid-cols-2 gap-6 py-4">
                                                                        <div className="space-y-4">
                                                                            <h4 className="font-semibold border-b pb-2">Business Information</h4>
                                                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-muted-foreground text-xs">Business Name</span>
                                                                                    <span className="font-medium">{p.business_name || p.user?.name}</span>
                                                                                </div>
                                                                                <div className="flex flex-col mt-2">
                                                                                    <span className="text-muted-foreground text-xs">Primary Category</span>
                                                                                    <Badge variant="secondary" className="w-fit mt-1">{p.category}</Badge>
                                                                                </div>
                                                                                <div className="flex flex-col mt-2">
                                                                                    <span className="text-muted-foreground text-xs">Experience</span>
                                                                                    <span>{p.experience_years} Years</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <h4 className="font-semibold border-b pb-2">Contact Details</h4>
                                                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-muted-foreground text-xs">Email</span>
                                                                                    <span>{p.user?.email}</span>
                                                                                </div>
                                                                                <div className="flex flex-col mt-2">
                                                                                    <span className="text-muted-foreground text-xs">Phone</span>
                                                                                    <span>{p.phone || 'Not provided'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col mt-2">
                                                                                    <span className="text-muted-foreground text-xs">Address / Service Area</span>
                                                                                    <span>{p.address || 'Not provided'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2 mt-2">
                                                                        <h4 className="font-semibold border-b pb-2 text-sm">Skills & Description</h4>
                                                                        <p className="text-sm bg-muted p-3 rounded-md min-h-[80px]">
                                                                            {p.skills || 'No detailed description provided by the applicant.'}
                                                                        </p>
                                                                    </div>

                                                                    <DialogFooter className="mt-6 border-t pt-4">
                                                                        <Button variant="ghost" onClick={() => { }}>Close</Button>
                                                                        {p.approval_status === 'pending' && (
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    onClick={() => handleProviderReview(p, 'rejected')}
                                                                                    disabled={processingId === p.id}
                                                                                >
                                                                                    Reject
                                                                                </Button>
                                                                                <Button
                                                                                    className="bg-green-600 hover:bg-green-700"
                                                                                    onClick={() => handleProviderReview(p, 'approved')}
                                                                                    disabled={processingId === p.id}
                                                                                >
                                                                                    Approve Provider
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
