export const BILL_TYPE_OPTIONS = [
    { value: "electricity", label: "Electricity" },
    { value: "water", label: "Water" },
    { value: "waste", label: "Waste" },
    { value: "gas", label: "Gas" },
    { value: "service", label: "Service charge" },
    { value: "rent", label: "Rent" },
    { value: "custom", label: "Other bill" },
] as const

export type BillType = typeof BILL_TYPE_OPTIONS[number]["value"]
export type BillDefault = { amount: number; dueDate: string; billingPeriod: string }
export type BillDefaults = Partial<Record<BillType, BillDefault>>

export function formatBillAmount(value: string): string {
    if (!value) return ""
    const [whole, fraction] = value.split(".")
    const grouped = (whole || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

export function parseBillDefaults(input: unknown): BillDefaults {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid bill defaults")
    const defaults: BillDefaults = {}
    for (const [type, value] of Object.entries(input)) {
        const option = BILL_TYPE_OPTIONS.find(option => option.value === type)
        if (!option || !value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid bill type or defaults")
        const row = value as Record<string, unknown>
        const amountText = typeof row.amount === "number" || typeof row.amount === "string" ? String(row.amount) : ""
        const amount = Number(amountText)
        if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
            throw new Error(`${option.label}: enter an amount above zero and at most $1,000,000,000, with up to two decimal places`)
        }
        if (typeof row.dueDate !== "string" || typeof row.billingPeriod !== "string") throw new Error(`${option.label}: invalid date or billing period`)
        const dueDate = row.dueDate
        if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0, 10) !== dueDate)) {
            throw new Error(`${option.label}: enter a valid due date`)
        }
        const billingPeriod = row.billingPeriod.trim()
        if (billingPeriod.length > 80) throw new Error(`${option.label}: billing period must be 80 characters or fewer`)
        defaults[option.value] = { amount, dueDate, billingPeriod }
    }
    return defaults
}

export function getBillDefaultFields(defaults: BillDefaults, type: string) {
    const saved = defaults[type as BillType]
    return { amount: saved ? String(saved.amount) : "", dueDate: saved?.dueDate || "", billingPeriod: saved?.billingPeriod || "" }
}
