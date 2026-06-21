"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Mail, Loader2 } from "lucide-react"

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
            // ── Step 1: Create auth user ──────────────────────────────────────
            const { data: authData, error: authError } = await supabase.auth.signUp({
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

            if (authError) throw authError
            if (!authData.user) throw new Error("User was not created. Please try again.")

            // ── Step 2: Insert profile row ────────────────────────────────────
            // Do this regardless of email-confirm status so the profile always exists.
            const fullName = `${formData.firstName} ${formData.lastName}`.trim()
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: authData.user.id,
                        name: fullName,
                        email: formData.email,
                        role: formData.role,
                        dashboard_unlocked: false,
                    },
                    { onConflict: "id" }   // safe re-run if trigger already created it
                )

            if (profileError) {
                // Non-fatal: profile trigger may have beaten us to it; log and continue.
                console.warn("Profile upsert warning:", profileError.message)
            }

            // ── Step 3: Handle email-confirmation vs instant-session ──────────
            if (!authData.session) {
                // Email confirmation is enabled in Supabase — user must verify first.
                setRequiresEmailConfirm(true)
                setIsSuccess(true)
                return
            }

            // Session exists → signed in immediately, go straight to dashboard.
            setIsSuccess(true)
            setTimeout(() => router.push("/dashboard"), 1500)

        } catch (err: any) {
            console.error("Signup error:", err)
            setError(err.message || "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Success screen ─────────────────────────────────────────────────────────
    if (isSuccess) {
        return (
            <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="space-y-4 pb-4 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            {requiresEmailConfirm
                                ? <Mail className="h-8 w-8 text-emerald-500" />
                                : <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            }
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                        {requiresEmailConfirm ? "Check your email" : "Account created!"}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {requiresEmailConfirm
                            ? <>We sent a confirmation link to <strong className="text-slate-700 dark:text-slate-200">{formData.email}</strong>. Click it to activate your account, then come back and sign in.</>
                            : "Your account is ready. Taking you to the dashboard…"
                        }
                    </CardDescription>
                </CardHeader>
                <CardFooter className="pb-6">
                    {requiresEmailConfirm ? (
                        <Link href="/login" className="w-full">
                            <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                Go to Login
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    // ── Sign-up form ───────────────────────────────────────────────────────────
    return (
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1.5 pb-6">
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    Create an account
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs leading-relaxed">
                    Enter your information below to get started with PRMS.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSignup}>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 rounded-xl">
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                First name
                            </Label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Last name
                            </Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min. 6 characters"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    {/* Role picker */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            I am a…
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["tenant", "landlord"] as const).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleRoleChange(r)}
                                    disabled={isLoading}
                                    className={[
                                        "flex items-center gap-2 border rounded-xl p-3 text-sm font-medium transition-all duration-150 cursor-pointer",
                                        formData.role === r
                                            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                                    ].join(" ")}
                                >
                                    <span className={[
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                        formData.role === r ? "border-blue-500" : "border-slate-300 dark:border-slate-600",
                                    ].join(" ")}>
                                        {formData.role === r && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </span>
                                    <span className="capitalize">{r}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-2 pb-6">
                    <Button
                        type="submit"
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating account…
                            </>
                        ) : "Create Account"}
                    </Button>

                    <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
