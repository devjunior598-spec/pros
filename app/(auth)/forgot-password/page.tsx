"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, MailCheck } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: "Password reset link sent! Please check your email inbox and spam folder." })
        }
        setLoading(false)
    }

    if (message?.type === 'success') {
        return (
            <div className="container flex items-center justify-center min-h-[80vh]">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <MailCheck className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Check your email</CardTitle>
                        <CardDescription>
                            We have sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {message.text}
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Link href="/login" className="w-full">
                            <Button variant="outline" className="w-full text-white">Back to Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-background text-white"
                            />
                        </div>

                        {message?.type === 'error' && (
                            <Alert variant="destructive">
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t p-6">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
