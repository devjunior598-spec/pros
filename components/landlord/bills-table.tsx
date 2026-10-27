"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BellRing, CreditCard, Loader2, Plus, Settings } from "lucide-react"
import { BILL_TYPE_OPTIONS, getBillDefaultFields, parseBillDefaults, type BillDefaults, type BillType } from "@/lib/bill-defaults"
import { BillDefaultsSettings } from "@/components/landlord/bill-defaults-settings"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type RentalOption = {
    id: string
    tenant_id: string
    tenant: { name?: string; full_name?: string; email?: string } | null
    property: { title?: string } | null
}
type BillRow = {
    id: string
    type: string
    amount: number
    amount_paid: number
    status: string
    due_date?: string
    description?: string
    rental: { tenant_id: string; tenant: { name?: string; full_name?: string; email?: string } | null }
}

const initialForm = { rentalId: "", type: "electricity", amount: "", dueDate: "", billingPeriod: "", description: "" }

export function BillsTable({ landlordId, rentalId }: { landlordId: string; rentalId?: string }) {
    const [bills, setBills] = useState<BillRow[]>([])
    const [rentals, setRentals] = useState<RentalOption[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pricesOpen, setPricesOpen] = useState(false)
    const [defaults, setDefaults] = useState<BillDefaults>({})
    const [defaultsLoading, setDefaultsLoading] = useState(false)
    const [defaultsError, setDefaultsError] = useState("")
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)
    const [form, setForm] = useState({ ...initialForm, rentalId: rentalId || "" })
    const { toast } = useToast()

    const fetchBills = useCallback(async () => {
        setLoading(true)
        let query = supabase.from("bills").select(`
            id, type, amount, amount_paid, status, due_date, description,
            rental:rentals!inner(tenant_id, landlord_id, tenant:profiles!tenant_id(name, full_name, email))
        `).eq("rental.landlord_id", landlordId).order("due_date", { ascending: true })
        if (rentalId) query = query.eq("rental_id", rentalId)
        const { data, error } = await query
        if (error) toast({ title: "Could not load bills", description: error.message, variant: "destructive" })
        else setBills((data || []) as unknown as BillRow[])
        setLoading(false)
    }, [landlordId, rentalId, toast])

    const loadRentalOptions = useCallback(async () => {
        const response = await fetch("/api/bills")
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to load connected tenants")
        setRentals((data.rentals || []).filter((rental: RentalOption) => !rentalId || rental.id === rentalId).map((rental: any) => ({
            ...rental,
            tenant: Array.isArray(rental.tenant) ? rental.tenant[0] : rental.tenant,
            property: Array.isArray(rental.property) ? rental.property[0] : rental.property,
        })))
    }, [rentalId])

    useEffect(() => {
        if (!landlordId) return
        fetchBills()
        loadRentalOptions().catch(error => toast({ title: "Tenant list unavailable", description: error.message, variant: "destructive" }))
        const channel = supabase.channel("landlord-bills").on("postgres_changes", { event: "*", schema: "public", table: "bills" } as any, fetchBills).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [landlordId, fetchBills, loadRentalOptions, toast])

    const openCreateBill = async () => {
        setDefaultsLoading(true)
        setDefaultsError("")
        let saved: BillDefaults = {}
        try {
            const response = await fetch("/api/bills/defaults", { cache: "no-store" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Unable to load saved prices")
            saved = parseBillDefaults(data.defaults)
        } catch {
            setDefaultsError("Saved prices could not load. Enter this bill's details manually, or close and try again.")
        } finally {
            setDefaults(saved)
            setForm({ ...initialForm, rentalId: rentalId || "", ...getBillDefaultFields(saved, initialForm.type) })
            setDefaultsLoading(false)
            setDialogOpen(true)
        }
    }

    const createBill = async () => {
        setCreating(true)
        try {
            const response = await fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Unable to create bill")
            toast({ title: "Bill sent", description: data.message })
            setForm({ ...initialForm, rentalId: rentalId || "" })
            setDialogOpen(false)
            await fetchBills()
        } catch (error) {
            toast({ title: "Bill not created", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
        } finally {
            setCreating(false)
        }
    }

    const sendReminder = async (bill: BillRow) => {
        setSendingReminderId(bill.id)
        try {
            const response = await fetch("/api/bills/remind", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billId: bill.id }) })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Unable to send reminder")
            toast({ title: "Reminder sent", description: "The tenant can open the bill and pay before its due date." })
        } catch (error) {
            toast({ title: "Reminder not sent", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
        } finally {
            setSendingReminderId(null)
        }
    }

    return <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><CardTitle>Tenant Bills & Payments</CardTitle><p className="mt-1 text-sm text-muted-foreground">Create rent, NEPA/electricity, water, waste, service, gas, or custom bills. Send reminders at any time; tenants can pay before or on the due date.</p></div>
            <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPricesOpen(true)}><Settings className="mr-2 h-4 w-4" />Bill prices</Button>
                <Button onClick={() => void openCreateBill()} disabled={defaultsLoading}>{defaultsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create bill</Button>
            </div>
        </CardHeader>
        <CardContent>
            {loading ? <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin" /></div> :
            bills.length === 0 ? <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><CreditCard className="h-10 w-10 opacity-40" /><p>No bills yet. Create one for a connected tenant.</p></div> :
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Tenant</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Paid</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead>
            <tbody>{bills.map(bill => <tr key={bill.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{bill.rental?.tenant?.full_name || bill.rental?.tenant?.name || "Tenant"}</td>
                <td className="p-3"><Badge variant="secondary" className="capitalize">{bill.type === "electricity" ? "NEPA / Electricity" : bill.type}</Badge></td>
                <td className="p-3 font-mono font-bold">${Number(bill.amount).toLocaleString()}</td>
                <td className="p-3">${Number(bill.amount_paid || 0).toLocaleString()}</td>
                <td className="p-3">{bill.due_date ? new Date(bill.due_date + "T00:00:00").toLocaleDateString() : "—"}</td>
                <td className="p-3"><Badge variant={bill.status === "paid" ? "default" : bill.status === "overdue" ? "destructive" : "outline"} className="capitalize">{bill.status.replace("_", " ")}</Badge></td>
                <td className="p-3 text-right">{bill.status !== "paid" && Number(bill.amount) > Number(bill.amount_paid || 0) && <Button size="sm" variant="outline" onClick={() => sendReminder(bill)} disabled={sendingReminderId !== null}>{sendingReminderId === bill.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}Remind</Button>}</td>
            </tr>)}</tbody></table></div>}
        </CardContent>

        <Dialog open={pricesOpen} onOpenChange={setPricesOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader><DialogTitle>Manage bill prices</DialogTitle><DialogDescription>Set the defaults to use when creating tenant bills.</DialogDescription></DialogHeader>
            {pricesOpen && <BillDefaultsSettings />}
        </DialogContent></Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create tenant bill</DialogTitle><DialogDescription>The tenant is notified immediately and can pay now, even before the due date.</DialogDescription></DialogHeader>
            {defaultsError && <p className="text-sm text-destructive" role="alert">{defaultsError}</p>}
            {defaults[form.type as BillType] && <p className="rounded-lg bg-muted p-3 text-sm">Your saved defaults are filled in. You can increase or decrease the amount, or edit the date and billing period for this bill only.</p>}
            <div className="grid gap-4 py-2">
                <div className="space-y-2"><Label>Tenant and property</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.rentalId} onChange={event => setForm({ ...form, rentalId: event.target.value })}><option value="">Choose connected tenant</option>{rentals.map(rental => <option key={rental.id} value={rental.id}>{rental.tenant?.full_name || rental.tenant?.name || rental.tenant?.email || "Tenant"} — {rental.property?.title || "Property"}</option>)}</select></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="bill-type">Bill type</Label><select id="bill-type" className="h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={event => setForm({ ...form, type: event.target.value, ...getBillDefaultFields(defaults, event.target.value) })}>{BILL_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="bill-amount">Amount ($)</Label><CurrencyInput id="bill-amount" value={form.amount} onValueChange={amount => setForm({ ...form, amount })} placeholder="50,000" /></div></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} /></div><div className="space-y-2"><Label>Billing period</Label><Input value={form.billingPeriod} onChange={event => setForm({ ...form, billingPeriod: event.target.value })} placeholder="e.g. September 2026" /></div></div>
                <div className="space-y-2"><Label>Details</Label><Textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Meter reading, account reference, or payment instructions" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={createBill} disabled={creating || !form.rentalId || !form.amount || !form.dueDate}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create and notify</Button></DialogFooter>
        </DialogContent></Dialog></Card>
}
