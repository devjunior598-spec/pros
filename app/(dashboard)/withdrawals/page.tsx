import Link from "next/link"
import { ArrowLeft, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WithdrawalsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <Landmark className="mb-2 h-6 w-6 text-primary" />
          <CardTitle>U.S. payouts are not configured</CardTitle>
          <CardDescription>Bank verification, withdrawals, and automatic payouts are paused until the U.S. payout provider is set up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">Existing bank details and payout balances are not shown here. Contact the platform administrator to reconcile any previous activity before enabling a new payout account.</p>
          <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    </main>
  )
}
