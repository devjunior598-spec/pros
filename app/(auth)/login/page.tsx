"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({ email: "", password: "" })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })
            if (error) throw error
            const pendingPropId = localStorage.getItem("pending_application_id")
            if (pendingPropId) {
                localStorage.removeItem("pending_application_id")
                router.push(`/dashboard/tenant/apply/${pendingPropId}`)
            } else {
                router.push("/dashboard")
            }
        } catch (err: any) {
            setError(err.message || "Failed to sign in")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Workspace Login
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Welcome Back</h1>
                <p className="text-blue-200/50 text-xs mt-1 leading-relaxed">
                    Enter your credentials to access your PRMS dashboard.
                </p>
            </div>

            <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-semibold">
                        {error}
                    </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/40" />
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none rounded-xl text-sm text-white placeholder-blue-200/30 transition-colors"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">
                            Password
                        </label>
                        <Link href="/forgot-password" className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/40" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="w-full pl-10 pr-10 h-11 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none rounded-xl text-sm text-white placeholder-blue-200/30 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</>
                    ) : (
                        <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                    )}
                </button>

                <p className="text-center text-xs text-blue-200/50 pt-1">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        Sign up free
                    </Link>
                </p>
            </form>
        </div>
    )
}
