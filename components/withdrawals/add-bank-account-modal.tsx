"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddBankAccountModalProps {
    onSuccess: () => void
    landlordName?: string
}

/**
 * U.S. payouts need a processor-backed onboarding flow (for example Stripe
 * Connect). The legacy Nigerian bank-verification flow is intentionally not
 * shown while that integration is unavailable.
 */
export function AddBankAccountModal(_props: AddBankAccountModalProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            className="w-full border-blue-200 bg-blue-50 text-blue-700"
            disabled
            title="U.S. payout onboarding is not configured yet."
        >
            <Plus className="mr-2 h-4 w-4" />
            U.S. payout setup coming soon
        </Button>
    )
}
