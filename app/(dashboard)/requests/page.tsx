"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LandlordMaintenanceList } from "@/components/landlord/landlord-maintenance-list"
import { MaintenanceRequestList } from "@/components/tenant/maintenance-request-list"
import { MaintenanceRequestForm } from "@/components/tenant/maintenance-request-form"

export default function MaintenancePage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setUserRole(profile.role)
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1)
        setIsDialogOpen(false)
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!userId) {
        return <div>Please log in to view maintenance requests.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">
                        {userRole === 'landlord'
                            ? "Manage repair requests across your properties."
                            : "Track status of your repair requests."}
                    </p>
                </div>

                {userRole === 'tenant' && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px]">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Submit Maintenance Request</DialogTitle>
                                <DialogDescription>
                                    Describe the issue clearly. Uploading photos helps expedite the process.
                                </DialogDescription>
                            </DialogHeader>
                            <MaintenanceRequestForm tenantId={userId} onSuccess={handleSuccess} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {userRole === 'landlord' ? (
                <LandlordMaintenanceList landlordId={userId} />
            ) : userRole === 'tenant' ? (
                <MaintenanceRequestList tenantId={userId} refreshKey={refreshKey} />
            ) : (
                <div>Access restricted.</div>
            )}
        </div>
    )
}
