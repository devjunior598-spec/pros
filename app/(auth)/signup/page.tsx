"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getAuthErrorMessage as getErrorMessage } from "@/lib/auth-verification"
import { AuthTurnstile, type AuthTurnstileHandle, turnstileEnabled } from "@/components/auth/auth-turnstile"
import { CheckCircle2, Mail, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"





export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [requiresEmailConfirm, setRequiresEmailConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [captchaToken, setCaptchaToken] = useState("")
    const [securityError, setSecurityError] = useState<string | null>(null)
    const turnstileRef = useRef<AuthTurnstileHandle>(null)
    const authInFlight = useRef(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "tenant" as "tenant" | "landlord",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleRoleChange = (role: "tenant" | "landlord") => {
        setFormData({ ...formData, role })
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (authInFlight.current) return
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match. Please enter the same password twice.")
            return
        }
        const verificationToken = turnstileEnabled ? turnstileRef.current?.consumeToken() : undefined
        if (turnstileEnabled && !verificationToken) {
            setSecurityError("Please complete the security verification before creating your account.")
            return
        }
        authInFlight.current = true
        setIsLoading(true)
        setError(null)
        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        role: formData.role,
                    },
                    emailRedirectTo: `${window.location.origin}/login`,
                    captchaToken: verificationToken,
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("User was not created. Please try again.")

            const resolvedRole = (authData.user.user_metadata?.role as "tenant" | "landlord" | "admin" | undefined) ?? formData.role
            
            // 2. The database trigger creates the profile atomically with the Auth user.
            // Redirect based on role.
            const redirectToDashboard = () => {
                if (resolvedRole === "landlord") {
                    router.replace("/dashboard/landlord")
                } else if (resolvedRole === "admin") {
                    router.replace("/admin/dashboard")
                } else {
                    router.replace("/dashboard/tenant")
                }
            }

            if (authData.session) {
                redirectToDashboard()
                return
            }

            setRequiresEmailConfirm(true)
            setIsSuccess(true)
        } catch (err: unknown) {
            console.error("Signup process exception:", err)
            turnstileRef.current?.reset()
            setError(getErrorMessage(err) || "Something went wrong. Please try again.")
        } finally {
            authInFlight.current = false
            setIsLoading(false)
        }
    }

    // Success screen
    if (isSuccess) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                <div className="space-y-4 px-6 py-10 text-center">
                    <div className="flex justify-center">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${requiresEmailConfirm ? "border-primary/20 bg-primary/10" : "border-emerald-200 bg-emerald-50"}`}>
                            {requiresEmailConfirm
                                ? <Mail className="h-8 w-8 text-primary" />
                                : <CheckCircle2 className="h-8 w-8 text-prms-emerald" />
                            }
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-prms-navy">
                        {requiresEmailConfirm ? "Check your email" : "Account created!"}
                    </h2>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-prms-slate">
                        {requiresEmailConfirm
                            ? <>We sent a confirmation link to <strong className="text-prms-navy">{formData.email}</strong>. Click it, then return to sign in.</>
                            : "Account created! Taking you to login…"
                        }
                    </p>
                    {requiresEmailConfirm && (
                        <Link href="/login">
                            <button className="mt-2 h-11 w-full rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700">
                                Go to Login
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="border-b border-border px-6 pb-4 pt-6">
                <h1 className="text-2xl font-semibold tracking-tight text-prms-navy">Create your account</h1>
                <p className="mt-1 text-sm text-prms-slate">
                    Get started in under 3 minutes. No credit card required.
                </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 px-6 pb-6 pt-5">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                        {error}
                    </div>
                )}

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: "firstName", label: "First Name", placeholder: "Chinedu" },
                        { id: "lastName",  label: "Last Name",  placeholder: "Okafor" },
                    ].map(f => (
                        <div key={f.id} className="space-y-1.5">
                            <label htmlFor={f.id} className="text-sm font-medium text-prms-navy">{f.label}</label>
                            <input
                                id={f.id}
                                placeholder={f.placeholder}
                                required
                                value={formData[f.id as keyof typeof formData] as string}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-12 w-full rounded-lg border border-border bg-secondary/30 px-3 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                            />
                        </div>
                    ))}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-prms-navy">Phone number</label>
                    <input
                        id="phone"
                        type="tel"
                        placeholder="(555) 555-0123"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 px-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                    />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-prms-navy">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 px-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-prms-navy">Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-12 w-full rounded-lg border border-border bg-white pl-4 pr-14 text-base text-prms-navy placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            aria-controls="password"
                            disabled={isLoading}
                            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-prms-navy">Confirm password</label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Enter your password again"
                            required
                            minLength={8}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-12 w-full rounded-lg border border-border bg-white pl-4 pr-14 text-base text-prms-navy placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            aria-pressed={showConfirmPassword}
                            aria-controls="confirmPassword"
                            disabled={isLoading}
                            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Role picker */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-prms-navy">I am a…</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(["tenant", "landlord"] as const).map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleChange(r)}
                                disabled={isLoading}
                                className={[
                                    "flex min-h-[48px] items-center gap-2 rounded-lg border p-3.5 text-sm font-medium transition-all duration-150",
                                    formData.role === r
                                        ? "border-primary bg-primary/10 text-blue-700"
                                        : "border-border bg-white text-prms-slate hover:border-primary/30 hover:text-prms-navy",
                                ].join(" ")}
                            >
                                <span className={[
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                    formData.role === r ? "border-primary" : "border-border",
                                ].join(" ")}>
                                    {formData.role === r && <span className="h-2 w-2 rounded-full bg-primary" />}
                                </span>
                                <span className="capitalize">{r}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <AuthTurnstile ref={turnstileRef} onTokenChange={setCaptchaToken} onErrorChange={setSecurityError} />
                {securityError && <span className="sr-only">{securityError}</span>}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading || Boolean(turnstileEnabled && !captchaToken)}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                    ) : (
                        <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>
                    )}
                </button>

                <div className="pt-1 text-center space-y-2">
                    <p className="text-sm text-prms-slate">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary transition-colors hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                    <p className="text-sm text-prms-slate">
                        <Link href="/provider-signup" className="font-semibold text-primary transition-colors hover:text-blue-700">
                            Register as a service provider instead
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}
