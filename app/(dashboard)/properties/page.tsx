"use client"

import Link from "next/link"
import { RoleGuard } from "@/components/role-guard"
import { MultiUnitPortfolio } from "@/components/landlord/multi-unit-portfolio"
import { PageHeader } from "@/components/page-header"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export default function PropertiesPage() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading your portfolio…</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Please log in to view your properties.</p>
            </div>
        )
    }

    return (
        <RoleGuard allowedRoles={["landlord"]}>
            <div className="flex-1 space-y-6">
                <PageHeader
                    title="Properties"
                    description="Manage your rental and for-sale listings"
                    icon={Building2}
                >
                    <Link href="/dashboard/properties/add">
                        <Button className="w-full sm:w-auto min-h-[44px] rounded-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Property
                        </Button>
                    </Link>
                </PageHeader>

                <MultiUnitPortfolio landlordId={user.id} />
            </div>
        </RoleGuard>
    )
}
