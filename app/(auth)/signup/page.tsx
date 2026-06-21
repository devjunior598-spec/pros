"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, Mail, Loader2, ArrowRight, Sparkles } from "lucide-react"

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

            const fullName = `${formData.firstName} ${formData.lastName}`.trim()
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    { id: authData.user.id, name: fullName, email: formData.email, role: formData.role, dashboard_unlocked: false },
                    { onConflict: "id" }
                )
            if (profileError) console.warn("Profile upsert warning:", profileError.message)

            if (!authData.session) {
                setRequiresEmailConfirm(true)
                setIsSuccess(true)
                return
            }
            setIsSuccess(true)
            setTimeout(() => router.push("/dashboard"), 1500)
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Success screen
    if (isSuccess) {
        return (
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="px-6 py-10 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${requiresEmailConfirm ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                            {requiresEmailConfirm
                                ? <Mail className="h-8 w-8 text-blue-400" />
                                : <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            }
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white">
                        {requiresEmailConfirm ? "Check your email" : "Account created!"}
                    </h2>
                    <p className="text-sm text-blue-200/60 leading-relaxed max-w-xs mx-auto">
                        {requiresEmailConfirm
                            ? <>We sent a confirmation link to <strong className="text-white">{formData.email}</strong>. Click it, then return to sign in.</>
                            : "Your account is ready. Taking you to the dashboard…"
                        }
                    </p>
                    {requiresEmailConfirm && (
                        <Link href="/login">
                            <button className="mt-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20">
                                Go to Login
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Create Account
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Join PRMS</h1>
                <p className="text-blue-200/50 text-xs mt-1 leading-relaxed">
                    Get started in under 3 minutes. No credit card required.
                </p>
            </div>

            <form onSubmit={handleSignup} className="px-6 pb-6 space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-semibold">
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
                            <label htmlFor={f.id} className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">{f.label}</label>
                            <input
                                id={f.id}
                                placeholder={f.placeholder}
                                required
                                value={(formData as any)[f.id]}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="w-full px-3 h-11 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none rounded-xl text-sm text-white placeholder-blue-200/30 transition-colors"
                            />
                        </div>
                    ))}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-full px-4 h-11 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none rounded-xl text-sm text-white placeholder-blue-200/30 transition-colors"
                    />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-full px-4 h-11 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none rounded-xl text-sm text-white placeholder-blue-200/30 transition-colors"
                    />
                </div>

                {/* Role picker */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">I am a…</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(["tenant", "landlord"] as const).map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleChange(r)}
                                disabled={isLoading}
                                className={[
                                    "flex items-center gap-2 border rounded-xl p-3 text-sm font-medium transition-all duration-150",
                                    formData.role === r
                                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                                        : "border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20 hover:text-white",
                                ].join(" ")}
                            >
                                <span className={[
                                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    formData.role === r ? "border-blue-400" : "border-white/20",
                                ].join(" ")}>
                                    {formData.role === r && <span className="h-2 w-2 rounded-full bg-blue-400" />}
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
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                    ) : (
                        <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>
                    )}
                </button>

                <p className="text-center text-xs text-blue-200/50 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    )
}
