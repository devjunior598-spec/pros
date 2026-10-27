import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

const paidStatuses = new Set(["Paid", "Successful", "success", "paid"])
const inactiveLeaseStatuses = new Set(["Draft", "Cancelled", "Terminated", "Expired"])

type Bill = {
    id: string
    amount: number | string | null
    amount_paid: number | string | null
    due_date: string | null
    status: string | null
    rental?: {
        id: string
        tenant_id: string | null
        property_id: string | null
        landlord_id: string | null
        property?: { id: string; title: string | null } | null
    } | null
}

type Payment = {
    id: string
    amount: number | string | null
    payment_status: string | null
    payment_date: string | null
    created_at: string | null
    tenant_id: string | null
    property_id: string | null
    property?: { id: string; title: string | null } | null
}

type LeaseAgreement = {
    id: string
    property_id: string | null
    tenant_id: string | null
    rent_amount: number | string | null
    security_deposit: number | string | null
    status: string | null
}

function money(value: unknown) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : 0
}

function monthKey(date: Date) {
    return date.toLocaleString("en-US", { month: "short" })
}

function inSameMonth(dateValue: string | null, target: Date) {
    if (!dateValue) return false
    const date = new Date(dateValue)
    return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth()
}

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can view finance analytics" }, { status: 403 })
        }

        const landlordId = currentUser.user.id
        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get("propertyId")
        const scopedPropertyId = propertyId && propertyId !== "all" ? propertyId : null

        const { data: ownedProperties, error: propertyError } = await supabaseAdmin
            .from("properties")
            .select("id, title")
            .eq("landlord_id", landlordId)

        if (propertyError) throw propertyError

        const ownedPropertyIds = new Set((ownedProperties || []).map((property) => property.id))
        if (scopedPropertyId && !ownedPropertyIds.has(scopedPropertyId)) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 })
        }

        let paymentsQuery = supabaseAdmin
            .from("rent_payments")
            .select("id, amount, payment_status, payment_date, created_at, tenant_id, property_id, property:properties!property_id(id,title)")
            .eq("landlord_id", landlordId)

        let billsQuery = supabaseAdmin
            .from("bills")
            .select("id, amount, amount_paid, due_date, status, rental:rentals!bills_rental_id_fkey!inner(id, tenant_id, property_id, landlord_id, property:properties!rentals_property_id_fkey(id,title))")
            .eq("rental.landlord_id", landlordId)

        let leasesQuery = supabaseAdmin
            .from("lease_agreements")
            .select("id, property_id, tenant_id, rent_amount, security_deposit, status")
            .eq("landlord_id", landlordId)

        if (scopedPropertyId) {
            paymentsQuery = paymentsQuery.eq("property_id", scopedPropertyId)
            billsQuery = billsQuery.eq("rental.property_id", scopedPropertyId)
            leasesQuery = leasesQuery.eq("property_id", scopedPropertyId)
        }

        const [paymentsResult, billsResult, leasesResult] = await Promise.all([
            paymentsQuery,
            billsQuery,
            leasesQuery,
        ])

        if (paymentsResult.error) throw paymentsResult.error
        if (billsResult.error) throw billsResult.error
        if (leasesResult.error) throw leasesResult.error

        const payments = (paymentsResult.data || []) as unknown as Payment[]
        const bills = (billsResult.data || []) as unknown as Bill[]
        const leases = (leasesResult.data || []) as LeaseAgreement[]
        const paidPayments = payments.filter((payment) => paidStatuses.has(String(payment.payment_status || "")))
        const activeLeases = leases.filter((lease) => !inactiveLeaseStatuses.has(String(lease.status || "")))
        const today = new Date()

        const totalCollected = paidPayments.reduce((sum, payment) => sum + money(payment.amount), 0)
        const outstandingRent = bills.reduce((sum, bill) => Math.max(0, money(bill.amount) - money(bill.amount_paid)) + sum, 0)
        const overdueBills = bills.filter((bill) => {
            const dueDate = bill.due_date ? new Date(bill.due_date) : null
            return dueDate && dueDate < today && String(bill.status || "").toLowerCase() !== "paid" && money(bill.amount) > money(bill.amount_paid)
        })
        const overdueRent = overdueBills.reduce((sum, bill) => Math.max(0, money(bill.amount) - money(bill.amount_paid)) + sum, 0)
        const leaseExpected = activeLeases.reduce((sum, lease) => sum + money(lease.rent_amount), 0)
        const billExpected = bills.reduce((sum, bill) => sum + money(bill.amount), 0)
        const totalExpected = leaseExpected || billExpected
        const securityDepositsHeld = activeLeases.reduce((sum, lease) => sum + money(lease.security_deposit), 0)
        const collectionBase = totalCollected + outstandingRent
        const collectionRate = collectionBase > 0 ? Math.round((totalCollected / collectionBase) * 100) : 0
        const paidTenantsCount = new Set(paidPayments.map((payment) => payment.tenant_id).filter(Boolean)).size
        const overdueTenantsCount = new Set(overdueBills.map((bill) => bill.rental?.tenant_id).filter(Boolean)).size

        const monthlyData = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1)
            return {
                month: monthKey(date),
                collected: paidPayments.filter((payment) => inSameMonth(payment.payment_date || payment.created_at, date)).reduce((sum, payment) => sum + money(payment.amount), 0),
                expected: bills.filter((bill) => inSameMonth(bill.due_date, date)).reduce((sum, bill) => sum + money(bill.amount), 0),
            }
        })

        const propertyBreakdown = (ownedProperties || [])
            .filter((property) => !scopedPropertyId || property.id === scopedPropertyId)
            .map((property) => ({
                name: property.title || "Untitled Property",
                collected: paidPayments.filter((payment) => payment.property_id === property.id).reduce((sum, payment) => sum + money(payment.amount), 0),
                outstanding: bills.filter((bill) => bill.rental?.property_id === property.id).reduce((sum, bill) => Math.max(0, money(bill.amount) - money(bill.amount_paid)) + sum, 0),
            }))
            .filter((property) => property.collected > 0 || property.outstanding > 0)

        return NextResponse.json({
            totalCollected,
            totalExpected,
            outstandingRent,
            overdueRent,
            securityDepositsHeld,
            collectionRate,
            paidTenantsCount,
            overdueTenantsCount,
            monthlyData,
            propertyBreakdown,
        })
    } catch (error: unknown) {
        console.error("Landlord finance API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load finance analytics" },
            { status: 500 },
        )
    }
}
