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
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        console.log("=== handleLogin START ===");

        try {
            console.log("Calling supabase.auth.signInWithPassword...");
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })
            console.log("Call returned. Error:", error, "Data:", data);

            if (error) throw error

            console.log("Checking for pending application...");
            // Check for pending application
            const pendingPropId = localStorage.getItem("pending_application_id")
            if (pendingPropId) {
                console.log("Redirecting to pending app:", pendingPropId);
                localStorage.removeItem("pending_application_id")
                router.push(`/dashboard/tenant/apply/${pendingPropId}`)
            } else {
                console.log("Redirecting to dashboard...");
                router.push("/dashboard")
            }
        } catch (err: any) {
            console.error("=== handleLogin CATCH ERROR ===", err);
            setError(err.message || "Failed to sign in")
        } finally {
            console.log("=== handleLogin FINALLY ===");
            setIsLoading(false)
        }
    }

    return (
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden font-sans">
            <CardHeader className="space-y-1.5 pb-6">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Workspace Login
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    Welcome Back
                </CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-400 text-xs leading-relaxed">
                    Enter your credentials below to access your PRMS account dashboard.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    
                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 rounded-xl">
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Password
                            </Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="pl-10 pr-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-4 pb-6">
                    <Button 
                        type="submit" 
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </Button>
                    
                    <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
