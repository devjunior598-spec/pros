import { CreditCard, Landmark } from "lucide-react"

export default function AdminFinancePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-primary">U.S. payment setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-prms-navy">Payments and payouts</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Online rent collection, wallet funding, bank verification, and landlord payouts are paused until a U.S. payment provider and payout account are configured.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white p-6">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="mt-4 font-semibold text-prms-navy">Rent collection</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">No online rent payment can be initiated or marked successful from this workspace during setup.</p>
        </article>
        <article className="rounded-2xl border border-border bg-white p-6">
          <Landmark className="h-6 w-6 text-primary" />
          <h2 className="mt-4 font-semibold text-prms-navy">Payouts</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Connect and verify the U.S. payout provider before enabling bank accounts or withdrawals.</p>
        </article>
      </section>
    </main>
  )
}
