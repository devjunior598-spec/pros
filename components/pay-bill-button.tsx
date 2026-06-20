"use client"

import React, { useState } from 'react';
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PayBillButtonProps {
    bill: {
        id: string
        amount: number
        tenant_email: string
        status: string
    }
}

export default function PayBillButton({ bill }: PayBillButtonProps) {
    const [loading, setLoading] = useState(false);

    const payBill = async () => {
        setLoading(true);

        // Generate payment reference (format matching webhook parser)
        const reference = `bill-${bill.id}-${Date.now()}`;

        try {
            const response = await fetch('/api/initiate-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: bill.amount,
                    email: bill.tenant_email,
                    reference
                }),
            });

            const data = await response.json();

            if (data?.payment_url) {
                // Redirect to Paystack checkout
                window.location.href = data.payment_url;
            } else {
                alert('Payment initialization failed: ' + (data?.message || 'Unknown error'));
            }
        } catch (err) {
            console.error("Payment error:", err)
            alert('An error occurred while initializing payment.')
        } finally {
            setLoading(false);
        }
    };

    if (bill.status === 'paid') {
        return (
            <Button variant="outline" disabled className="w-full">
                Paid
            </Button>
        )
    }

    return (
        <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={payBill}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                </>
            )}
        </Button>
    );
}
