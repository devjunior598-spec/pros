"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, Mail, Loader2, ArrowRight } from "lucide-react"

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    if (typeof error === "object" && error && "message" in error) {
        const message = (error as { message?: unknown }).message
        if (typeof message === "string") return message
    }
    return "An unexpected error occurred."
}

const promiseWithTimeout = <T extends unknown>(promise: Promise<T>, ms: number, timeoutErrorMsg: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(timeoutErrorMsg)), ms)
        )
    ])
}

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [requiresEmailConfirm, setRequiresEmailConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
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
        setIsLoading(true)
        setError(null)
        try {
            // 3. Sign up with Supabase Auth correctly
            const signupPromise = supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: formData.role,
                    },
                },
            })

            // 9. Add timeout protection (15s)
            const { data: authData, error: authError } = await promiseWithTimeout(
                signupPromise,
                15000,
                "Signup is taking too long. Please check your internet and try again."
            )

            // 4. Log error to console and throw it
            if (authError) {
                console.error("Supabase Auth signUp error:", authError)
                throw authError
            }
            if (!authData.user) throw new Error("User was not created. Please try again.")

            // Insert profile row — id must equal authData.user.id
            const fullName = `${formData.firstName} ${formData.lastName}`.trim()
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: authData.user.id,
                    name: fullName,
                    full_name: fullName,
                    email: formData.email,
                    role: formData.role
                })

            if (profileError) {
                throw profileError
            }

            const resolvedRole = (authData.user.user_metadata?.role as "tenant" | "landlord" | "admin" | undefined) ?? formData.role
            
            // 7. Redirect based on role: landlord -> /dashboard/landlord, tenant -> /dashboard/tenant
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

            // Attempt auto sign in to avoid manual step if session is not active
            const signInPromise = supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            const { data: signInData, error: signInError } = await promiseWithTimeout(
                signInPromise,
                15000,
                "Auto sign-in is taking too long. Please check your internet and try again."
            )

            if (!signInError && signInData.session) {
                redirectToDashboard()
                return
            }

            if (signInError?.message?.toLowerCase().includes("email") || signInError?.message?.toLowerCase().includes("confirm")) {
                setRequiresEmailConfirm(true)
                setIsSuccess(true)
                return
            }

            if (signInError) {
                console.error("Auto sign-in error:", signInError)
                throw signInError
            }

            setRequiresEmailConfirm(true)
            setIsSuccess(true)
        } catch (err: unknown) {
            console.error("Signup process exception:", err)
            // 4. Show the exact error message on screen
            setError(getErrorMessage(err) || "Something went wrong. Please try again.")
        } finally {
            // 5. Always stop loading using finally
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
                        { id: "firstName", label: "First Name", placeholder: "John" },
                        { id: "lastName",  label: "Last Name",  placeholder: "Doe" },
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

                {/* Password */}
                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-prms-navy">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 px-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                    />
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
                                        ? "border-primary bg-primary/10 text-primary"
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

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                    ) : (
                        <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>
                    )}
                </button>

                <p className="pt-1 text-center text-sm text-prms-slate">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary transition-colors hover:text-blue-700">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    )
}
