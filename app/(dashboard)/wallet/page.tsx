import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WalletPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <CreditCard className="mb-2 h-6 w-6 text-primary" />
          <CardTitle>Wallet funding is unavailable</CardTitle>
          <CardDescription>Wallet balances, auto-refills, and payment methods are hidden while the platform moves to U.S. payment processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">No wallet payment can be started from PRMS. Use the payment instructions in your rental agreement until U.S. checkout is configured.</p>
          <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    </main>
  )
}
