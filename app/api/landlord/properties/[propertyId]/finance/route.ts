import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

const paidStatuses = new Set(["Paid", "Successful", "success", "paid"])
const inactiveLeaseStatuses = new Set(["Draft", "Cancelled", "Terminated", "Expired"])

type Bill = {
    id: string
    amount: number | string | null
    amount_paid: number | string | null
    status: string | null
    due_date: string | null
    rental?: { tenant_id: string | null; property_id: string | null } | null
}

type Payment = {
    id: string
    amount: number | string | null
    payment_status: string | null
    tenant_id: string | null
}

type Unit = {
    id: string
    name: string | null
    rent: number | string | null
    availability: string | null
    unit_tenants?: Array<{
        status: string | null
        tenant_id: string | null
        tenant?: { name: string | null; full_name: string | null; email: string | null } | null
    }>
    leases?: Array<{ status: string | null; rent_amount: number | string | null; tenant_id: string | null }>
}

function money(value: unknown) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : 0
}

function isPaid(status: string | null) {
    return paidStatuses.has(String(status || ""))
}

export async function GET(_request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can view property finance" }, { status: 403 })
        }

        const { propertyId } = await params
        const landlordId = currentUser.user.id

        const { data: property, error: propertyError } = await supabaseAdmin
            .from("properties")
            .select("id, title, price")
            .eq("id", propertyId)
            .eq("landlord_id", landlordId)
            .maybeSingle()

        if (propertyError) throw propertyError
        if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 })

        const [unitsResult, leasesResult, billsResult, paymentsResult] = await Promise.all([
            supabaseAdmin
                .from("property_units")
                .select("id, name, rent, availability, unit_tenants(status, tenant_id, tenant:profiles!tenant_id(name, full_name, email)), leases(status, rent_amount, tenant_id)")
                .eq("property_id", propertyId)
                .eq("landlord_id", landlordId)
                .order("name", { ascending: true }),
            supabaseAdmin
                .from("lease_agreements")
                .select("id, tenant_id, property_id, rent_amount, security_deposit, status")
                .eq("property_id", propertyId)
                .eq("landlord_id", landlordId),
            supabaseAdmin
                .from("bills")
                .select("id, amount, amount_paid, status, due_date, rental:rentals!bills_rental_id_fkey!inner(tenant_id, property_id, landlord_id)")
                .eq("rental.property_id", propertyId)
                .eq("rental.landlord_id", landlordId),
            supabaseAdmin
                .from("rent_payments")
                .select("id, amount, payment_status, tenant_id")
                .eq("property_id", propertyId)
                .eq("landlord_id", landlordId),
        ])

        if (unitsResult.error) throw unitsResult.error
        if (leasesResult.error) throw leasesResult.error
        if (billsResult.error) throw billsResult.error
        if (paymentsResult.error) throw paymentsResult.error

        const units = (unitsResult.data || []) as unknown as Unit[]
        const leases = (leasesResult.data || []) as Array<{ rent_amount: number | string | null; security_deposit: number | string | null; status: string | null }>
        const bills = (billsResult.data || []) as unknown as Bill[]
        const payments = (paymentsResult.data || []) as unknown as Payment[]
        const paidPayments = payments.filter((payment) => isPaid(payment.payment_status))
        const activeLeases = leases.filter((lease) => !inactiveLeaseStatuses.has(String(lease.status || "")))

        const expectedRevenue = activeLeases.reduce((sum, lease) => sum + money(lease.rent_amount), 0)
            || units.reduce((sum, unit) => sum + money(unit.rent), 0)
            || money(property.price)
        const collectedRevenue = paidPayments.reduce((sum, payment) => sum + money(payment.amount), 0)
        const outstandingAmount = bills.reduce((sum, bill) => Math.max(0, money(bill.amount) - money(bill.amount_paid)) + sum, 0)
        const occupiedUnits = units.filter((unit) => unit.availability === "occupied" || unit.unit_tenants?.some((tenant) => tenant.status === "active")).length
        const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0

        const unitRows = units.map((unit) => {
            const tenant = unit.unit_tenants?.find((item) => item.status === "active")
            const activeUnitLease = unit.leases?.find((lease) => lease.status === "active")
            const tenantBills = tenant?.tenant_id ? bills.filter((bill) => bill.rental?.tenant_id === tenant.tenant_id) : []
            const tenantPaid = tenant?.tenant_id ? paidPayments.filter((payment) => payment.tenant_id === tenant.tenant_id) : []
            const overdueAmount = tenantBills.reduce((sum, bill) => Math.max(0, money(bill.amount) - money(bill.amount_paid)) + sum, 0)
            const paidAmount = tenantPaid.reduce((sum, payment) => sum + money(payment.amount), 0)
            const rent = money(activeUnitLease?.rent_amount || unit.rent)
            const tenantName = tenant?.tenant?.name || tenant?.tenant?.full_name || tenant?.tenant?.email || "Unassigned"
            const status = !tenant ? "Vacant" : overdueAmount > 0 ? "Overdue" : paidAmount >= rent && rent > 0 ? "Paid" : "Partially Paid"

            return {
                id: unit.id,
                name: unit.name || "Unit",
                tenantName,
                rent,
                status,
                overdueAmount,
            }
        })

        return NextResponse.json({
            propertyTitle: property.title || "Property Financials",
            expectedRevenue,
            collectedRevenue,
            outstandingAmount,
            occupancyRate,
            units: unitRows,
        })
    } catch (error: unknown) {
        console.error("Property finance API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load property finance" },
            { status: 500 },
        )
    }
}
