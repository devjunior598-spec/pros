"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { BILL_TYPE_OPTIONS, getBillDefaultFields, parseBillDefaults, type BillType } from "@/lib/bill-defaults"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type Draft = { amount: string; dueDate: string; billingPeriod: string }
type Drafts = Record<BillType, Draft>
const emptyDraft = (): Draft => ({ amount: "", dueDate: "", billingPeriod: "" })
const emptyDrafts = () => Object.fromEntries(BILL_TYPE_OPTIONS.map(option => [option.value, emptyDraft()])) as Drafts

export function BillDefaultsSettings() {
    const [drafts, setDrafts] = useState<Drafts>(emptyDrafts)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [loadError, setLoadError] = useState("")
    const { toast } = useToast()

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError("")
        try {
            const response = await fetch("/api/bills/defaults", { cache: "no-store" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Unable to load bill prices")
            const defaults = parseBillDefaults(data.defaults)
            setDrafts(Object.fromEntries(BILL_TYPE_OPTIONS.map(option => [option.value, getBillDefaultFields(defaults, option.value)])) as Drafts)
            setDirty(false)
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Unable to load bill prices")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void load() }, [load])

    const update = (type: BillType, changes: Partial<Draft>) => {
        setDrafts(previous => ({ ...previous, [type]: { ...previous[type], ...changes } }))
        setDirty(true)
    }

    const save = async (event: React.FormEvent) => {
        event.preventDefault()
        setSaving(true)
        try {
            const entries = BILL_TYPE_OPTIONS.filter(option => {
                const draft = drafts[option.value]
                return draft.amount || draft.dueDate || draft.billingPeriod.trim()
            }).map(option => [option.value, drafts[option.value]])
            const defaults = parseBillDefaults(Object.fromEntries(entries))
            const response = await fetch("/api/bills/defaults", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ defaults }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Unable to save bill prices")
            setDirty(false)
            toast({ title: "Bill prices saved", description: "New bills will use these defaults. You can still edit each bill before sending." })
        } catch (error) {
            toast({ title: "Prices not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return <Card>
        <CardHeader>
            <CardTitle>Bill prices & defaults</CardTitle>
            <p className="text-sm text-muted-foreground">Save your usual charges once. These defaults apply to your landlord account and fill in when you select a bill type.</p>
            <p className="text-sm text-muted-foreground">You can change any amount, due date, or billing period before sending a bill. Saving here does not change existing bills or send new bills.</p>
        </CardHeader>
        <CardContent>
            {loading ? <div className="flex items-center justify-center gap-2 p-8"><Loader2 className="h-5 w-5 animate-spin" />Loading prices…</div> : loadError ?
                <div className="space-y-3" role="alert"><p className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={() => void load()}>Try again</Button></div> :
                <form onSubmit={save} className="space-y-5">
                    <p className="rounded-lg bg-muted p-3 text-sm">Dates and billing periods stay as saved. Update them for each billing cycle, or adjust them when creating a bill. Leave a bill type blank if you do not want a saved price.</p>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {BILL_TYPE_OPTIONS.map(option => <fieldset key={option.value} disabled={saving} className="rounded-lg border p-4 space-y-3">
                            <legend className="px-1 font-semibold">{option.label}</legend>
                            <div className="space-y-1.5"><Label htmlFor={`default-${option.value}-amount`}>Default amount ($)</Label><CurrencyInput id={`default-${option.value}-amount`} value={drafts[option.value].amount} onValueChange={amount => update(option.value, { amount })} placeholder="50,000" /></div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5"><Label htmlFor={`default-${option.value}-date`}>Due date (optional)</Label><Input id={`default-${option.value}-date`} type="date" value={drafts[option.value].dueDate} onChange={event => update(option.value, { dueDate: event.target.value })} /></div>
                                <div className="space-y-1.5"><Label htmlFor={`default-${option.value}-period`}>Billing period (optional)</Label><Input id={`default-${option.value}-period`} maxLength={80} value={drafts[option.value].billingPeriod} onChange={event => update(option.value, { billingPeriod: event.target.value })} placeholder="e.g. September 2026" /></div>
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => update(option.value, emptyDraft())}>Clear defaults</Button>
                        </fieldset>)}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground" aria-live="polite">{dirty ? "You have unsaved changes." : "Your saved prices are up to date."}</span>
                        <Button type="submit" disabled={!dirty || saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save bill prices</Button>
                    </div>
                </form>}
        </CardContent>
    </Card>
}
