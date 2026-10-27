import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto mt-12 max-w-lg border-border shadow-lg">
        <CardHeader className="items-center text-center">
          <AlertTriangle className="mb-4 h-14 w-14 text-amber-600" />
          <CardTitle>Payment processing is unavailable</CardTitle>
          <CardDescription className="text-base">U.S. checkout is not configured yet. This page cannot confirm a payment. Check with your bank and follow the payment instructions in your lease.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline" asChild>
            <Link href="/pay-bills"><ArrowLeft className="mr-2 h-4 w-4" />Return to bills</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
