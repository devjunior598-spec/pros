"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    if (typeof error === "object" && error && "message" in error) {
        const message = (error as { message?: unknown }).message
        if (typeof message === "string") return message
    }
    return "An unexpected error occurred."
}

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [needsConfirm, setNeedsConfirm] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSent, setResendSent] = useState(false)
    const [formData, setFormData] = useState({ email: "", password: "" })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setNeedsConfirm(false)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })
            if (error) {
                // Detect unconfirmed email specifically
                if (
                    error.message?.toLowerCase().includes("email not confirmed") ||
                    error.message?.toLowerCase().includes("not confirmed")
                ) {
                    setNeedsConfirm(true)
                    return
                }
                throw error
            }
            const { data: userData } = await supabase.auth.getUser()
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userData.user?.id)
                .maybeSingle()

            const pendingPropId = localStorage.getItem("pending_application_id")
            if (pendingPropId) {
                localStorage.removeItem("pending_application_id")
                router.push(`/dashboard/tenant/apply/${pendingPropId}`)
            } else if (profile?.role === "landlord") {
                router.push("/dashboard")
            } else if (profile?.role === "admin") {
                router.push("/admin/dashboard")
            } else {
                router.push("/dashboard")
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err) || "Failed to sign in. Check your email and password.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendConfirmation = async () => {
        setResendLoading(true)
        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: formData.email,
            })
            if (error) throw error
            setResendSent(true)
        } catch (err: unknown) {
            setError(getErrorMessage(err) || "Could not resend confirmation email.")
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="border-b border-border px-6 pb-4 pt-6">
                <h1 className="text-2xl font-semibold tracking-tight text-prms-navy">Welcome back</h1>
                <p className="mt-1 text-sm text-prms-slate">
                    Sign in to access your PRMS dashboard.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 px-6 pb-6 pt-5">

                {/* Email not confirmed banner */}
                {needsConfirm && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <div>
                                <p className="text-xs font-bold text-amber-700">Email not confirmed</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80">
                                    Please check your inbox for a confirmation email and click the link before signing in.
                                </p>
                            </div>
                        </div>
                        {resendSent ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Confirmation email resent — check your inbox.
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendConfirmation}
                                disabled={resendLoading}
                                className="flex items-center gap-1 text-xs font-bold text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-800 disabled:opacity-50"
                            >
                                {resendLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Resend confirmation email
                            </button>
                        )}
                    </div>
                )}

                {/* Generic error */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                        {error}
                    </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-prms-navy">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-prms-navy">
                            Password
                        </label>
                        <Link href="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-blue-700">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-10 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</>
                    ) : (
                        <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                    )}
                </button>

                <p className="pt-1 text-center text-sm text-prms-slate">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-semibold text-primary transition-colors hover:text-blue-700">
                        Sign up free
                    </Link>
                </p>
            </form>
        </div>
    )
}
