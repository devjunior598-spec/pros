import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const [
            usersResult,
            tenantsResult,
            landlordsResult,
            propertyCountResult,
            activeRentalsResult,
            pendingApplicationsResult,
            pendingTenantKycResult,
            pendingLandlordKycResult,
            recentUsersResult,
            recentApplicationsResult,
        ] = await Promise.all([
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "tenant"),
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "landlord"),
            supabaseAdmin.from("properties").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("rentals").select("id", { count: "exact", head: true }).in("status", ["active", "approved"]),
            supabaseAdmin.from("rentals").select("id", { count: "exact", head: true }).eq("status", "pending"),
            supabaseAdmin.from("tenant_kyc").select("id", { count: "exact", head: true }).eq("status", "pending"),
            supabaseAdmin.from("landlord_kyc").select("id", { count: "exact", head: true }).eq("status", "pending"),
            supabaseAdmin
                .from("profiles")
                .select("id, name, full_name, email, role, is_verified, status, created_at")
                .in("role", ["tenant", "landlord"])
                .order("created_at", { ascending: false })
                .limit(6),
            supabaseAdmin
                .from("rentals")
                .select("id, status, rent_amount, created_at, property_id, tenant_id, landlord_id")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(6),
        ])

        const results = [
            usersResult, tenantsResult, landlordsResult, propertyCountResult, activeRentalsResult,
            pendingApplicationsResult, pendingTenantKycResult, pendingLandlordKycResult,
            recentUsersResult, recentApplicationsResult,
        ]
        const failed = results.find((result) => result.error)
        if (failed?.error) throw failed.error

        const applications = recentApplicationsResult.data || []
        const propertyIds = [...new Set(applications.map((application) => application.property_id))]
        const tenantIds = [...new Set(applications.map((application) => application.tenant_id))]

        const [propertiesResult, tenantsProfileResult] = await Promise.all([
            propertyIds.length > 0
                ? supabaseAdmin.from("properties").select("id, title").in("id", propertyIds)
                : Promise.resolve({ data: [], error: null }),
            tenantIds.length > 0
                ? supabaseAdmin.from("profiles").select("id, name, full_name, email").in("id", tenantIds)
                : Promise.resolve({ data: [], error: null }),
        ])
        if (propertiesResult.error) throw propertiesResult.error
        if (tenantsProfileResult.error) throw tenantsProfileResult.error

        const propertiesById = new Map((propertiesResult.data || []).map((property) => [property.id, property]))
        const tenantsById = new Map((tenantsProfileResult.data || []).map((tenant) => [tenant.id, tenant]))

        return NextResponse.json({
            metrics: {
                users: usersResult.count || 0,
                tenants: tenantsResult.count || 0,
                landlords: landlordsResult.count || 0,
                properties: propertyCountResult.count || 0,
                activeRentals: activeRentalsResult.count || 0,
                pendingApplications: pendingApplicationsResult.count || 0,
                pendingVerification: (pendingTenantKycResult.count || 0) + (pendingLandlordKycResult.count || 0),
            },
            recentUsers: recentUsersResult.data || [],
            pendingApplications: applications.map((application) => ({
                ...application,
                property: propertiesById.get(application.property_id) || null,
                tenant: tenantsById.get(application.tenant_id) || null,
            })),
        })
    } catch (error: unknown) {
        console.error("Admin dashboard API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load admin dashboard" },
            { status: 500 },
        )
    }
}
