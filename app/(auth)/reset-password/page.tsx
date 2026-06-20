"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        // Supabase expects a recovery session to be active (usually handled by the URL hash/link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setMessage({ type: 'error', text: "Your session has expired or the link is invalid. Please request a new password reset link." })
            }
        }
        checkSession()
    }, [])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match." })
            return
        }

        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: "Your password has been updated successfully!" })
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        }
        setLoading(false)
    }

    if (message?.type === 'success') {
        return (
            <div className="container flex items-center justify-center min-h-[80vh]">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-500/10 p-3">
                                <ShieldCheck className="h-10 w-10 text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Password Reset Successfully</CardTitle>
                        <CardDescription>
                            Your security is our priority. You can now use your new password to log in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground mt-4">
                            Redirecting you to the login page in a few seconds...
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push('/login')}>
                            Go to Login Now
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <CardDescription>
                        Please enter your new password below. Ensure it's strong and unique.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-background text-white pr-10"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-background text-white"
                                minLength={6}
                            />
                        </div>

                        {message?.type === 'error' && (
                            <Alert variant="destructive">
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
