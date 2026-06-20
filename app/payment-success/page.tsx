"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

function PaymentVerification() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const reference = searchParams.get('reference')

    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
    const [message, setMessage] = useState('Verifying your payment...')

    useEffect(() => {
        if (!reference) {
            setStatus('failed')
            setMessage('No payment reference found.')
            return
        }

        const verifyPayment = async () => {
            try {
                const res = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reference })
                })

                const data = await res.json()

                if (res.ok && data.success) {
                    setStatus('success')
                    setMessage('Your payment was successful and your wallet has been credited.')

                    // Automatically redirect back to wallet after 3 seconds
                    setTimeout(() => {
                        router.push('/dashboard?tab=Wallet')
                    }, 3000)
                } else {
                    setStatus('failed')
                    setMessage(data.message || 'Payment verification failed.')
                }
            } catch (error) {
                setStatus('failed')
                setMessage('An error occurred during verification. If you were debited, it will be automatically resolved.')
            }
        }

        verifyPayment()
    }, [reference, router])

    return (
        <Card className="w-full max-w-md mx-auto mt-20 shadow-xl border-none">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-6">
                    {status === 'verifying' && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500" />}
                    {status === 'failed' && <XCircle className="h-16 w-16 text-red-500" />}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {status === 'verifying' && 'Verifying Payment...'}
                    {status === 'success' && 'Payment Successful'}
                    {status === 'failed' && 'Payment Failed'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    {message}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
                {status === 'success' && (
                    <div className="text-center text-sm text-muted-foreground">
                        Redirecting to your dashboard in a moment...
                    </div>
                )}

                <Button
                    className="w-full"
                    variant={status === 'success' ? "default" : "outline"}
                    asChild
                >
                    <Link href="/dashboard?tab=Wallet">
                        {status === 'success' ? 'Go to Wallet Now' : (
                            <><ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard</>
                        )}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-12">
            <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <PaymentVerification />
            </Suspense>
        </div>
    )
}
