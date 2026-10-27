"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getAuthErrorMessage as getErrorMessage } from "@/lib/auth-verification"
import { AuthTurnstile, type AuthTurnstileHandle, turnstileEnabled } from "@/components/auth/auth-turnstile"
import {
    Loader2,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Briefcase,
    MapPin,
    ShieldCheck,
    User,
    Mail,
    Phone,
    Lock,
    EyeOff,
    Eye,
    Wrench,
    Check
} from "lucide-react"

const CATEGORIES = [
    "Plumbing", "Electrical", "Rewiring", "Carpentry",
    "Painting", "Tiling", "Roofing", "AC Repair",
    "Waste Disposal", "General Handyman"
]
import { US_STATES } from "@/lib/us-region"





export default function ProviderSignupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [captchaToken, setCaptchaToken] = useState("")
    const [securityError, setSecurityError] = useState<string | null>(null)
    const turnstileRef = useRef<AuthTurnstileHandle>(null)
    const authInFlight = useRef(false)

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        category: "",
        experience: "",
        state: "",
        city: "",
        bio: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        })
    }

    const nextStep = () => {
        setError(null)
        // Basic validation before moving to next step
        if (step === 1) {
            if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
                setError("Please fill in all account credentials.")
                return
            }
            if (formData.password.length < 8) {
                setError("Password must be at least 8 characters.")
                return
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match. Please enter the same password twice.")
                return
            }
        } else if (step === 2) {
            if (!formData.category || !formData.experience || !formData.bio) {
                setError("Please fill in all professional details.")
                return
            }
        } else if (step === 3) {
            if (!formData.state || !formData.city) {
                setError("Please fill in all service location details.")
                return
            }
        }
        setStep(step + 1)
    }
    const prevStep = () => setStep(step - 1)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (authInFlight.current) return
        
        if (step < 4) {
            nextStep()
            return
        }

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
            setSecurityError("Please complete a fresh security verification before submitting your registration.")
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
                        full_name: formData.fullName,
                        role: 'service_provider',
                        phone: formData.phone.trim(),
                        provider_registration: {
                            category: formData.category, experience: formData.experience,
                            state: formData.state, city: formData.city, bio: formData.bio.slice(0, 2000),
                        },
                    },
                    emailRedirectTo: `${window.location.origin}/provider-login`,
                    captchaToken: verificationToken,
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("Signup failed")

            if (authData.session) {
                router.replace("/provider-onboarding")
                return
            }

            setSuccess(true)
        } catch (err: unknown) {
            console.error("Signup error:", err)
            turnstileRef.current?.reset()
            setError(getErrorMessage(err) || "Something went wrong during registration")
        } finally {
            authInFlight.current = false
            setIsLoading(false)
        }
    }

    // Success screen
    if (success) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                <div className="space-y-4 px-6 py-10 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
                            <CheckCircle className="h-8 w-8 text-prms-emerald" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-prms-navy">Check your email</h2>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-prms-slate">
                        Your login and professional details have been saved. Confirm your email, then sign in to upload your documents and submit your provider application for review.
                    </p>
                    <Link href="/provider-login">
                        <button className="mt-4 h-11 w-full rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700">
                            Go to Login
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    const steps = [
        { num: 1, label: "Account" },
        { num: 2, label: "Skills" },
        { num: 3, label: "Location" },
        { num: 4, label: "Confirm" },
    ]

    return (
        <div className="w-full max-w-xl mx-auto overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-prms-blue/10 text-prms-blue">
                        <Wrench className="h-4 w-4" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-prms-navy">Provider Registration</h1>
                </div>
                <p className="mt-1 text-sm text-prms-slate">
                    Join our network of trusted service professionals.
                </p>

                {/* Step Indicator */}
                <div className="mt-8 flex items-center justify-between relative px-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-border -z-10" />
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-prms-blue -z-10 transition-all duration-300"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    />
                    
                    {steps.map((s) => {
                        const isActive = s.num === step;
                        const isCompleted = s.num < step;
                        return (
                            <div key={s.num} className="flex flex-col items-center gap-2 bg-white">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300 ${
                                    isCompleted ? 'border-prms-emerald bg-prms-emerald text-white' :
                                    isActive ? 'border-prms-blue bg-prms-blue text-white' :
                                    'border-border bg-secondary text-prms-slate'
                                }`}>
                                    {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                                </div>
                                <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-prms-navy' : 'text-prms-slate'}`}>
                                    {s.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 px-6 pb-6 pt-5">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="min-h-[280px]">
                    {/* Step 1: Account Credentials */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1.5">
                                <label htmlFor="fullName" className="text-sm font-medium text-prms-navy">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="fullName"
                                        placeholder="Chinedu Okafor"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-prms-navy">Email Address</label>
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

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="text-sm font-medium text-prms-navy">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="(555) 555-0123"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    />
                                </div>
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
                        </div>
                    )}

                    {/* Step 2: Professional Details */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1.5">
                                <label htmlFor="category" className="text-sm font-medium text-prms-navy">Service Category</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <select
                                        id="category"
                                        required
                                        value={formData.category}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full appearance-none rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    >
                                        <option value="" disabled>Select your primary skill</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label htmlFor="experience" className="text-sm font-medium text-prms-navy">Years of Experience</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="experience"
                                        type="number"
                                        placeholder="e.g., 5"
                                        required
                                        min={0}
                                        value={formData.experience}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="bio" className="text-sm font-medium text-prms-navy">Professional Bio</label>
                                <textarea
                                    id="bio"
                                    placeholder="Briefly describe your services and expertise..."
                                    required
                                    value={formData.bio}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="min-h-[100px] w-full rounded-lg border border-border bg-secondary/30 p-3 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Service Location */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1.5">
                                <label htmlFor="state" className="text-sm font-medium text-prms-navy">Service State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <select
                                        id="state"
                                        required
                                        value={formData.state}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full appearance-none rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    >
                                        <option value="" disabled>Select state</option>
                                        {US_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label htmlFor="city" className="text-sm font-medium text-prms-navy">City / Area</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="city"
                                        placeholder="e.g., Ikeja"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-lg border border-border bg-secondary/30 pl-10 pr-4 text-base text-prms-navy placeholder:text-prms-slate/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-secondary/30 p-4 text-sm">
                                <p className="font-semibold">Create your login first</p>
                                <p className="mt-2">Confirm your email, then sign in to upload your profile photo and government ID. Your professional details will be filled in automatically.</p>
                                <p className="mt-2">Your application goes to the review team after you submit those documents.</p>
                            </div>
                            <AuthTurnstile ref={turnstileRef} onTokenChange={setCaptchaToken} onErrorChange={setSecurityError} />
                            {securityError && <span className="sr-only">{securityError}</span>}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={isLoading}
                            className="flex h-12 w-1/3 items-center justify-center gap-2 rounded-lg border border-border bg-white font-semibold text-prms-navy transition-all hover:bg-secondary disabled:opacity-60"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || Boolean(step === 4 && turnstileEnabled && !captchaToken)}
                        className={`flex h-12 ${step > 1 ? 'w-2/3' : 'w-full'} items-center justify-center gap-2 rounded-lg bg-prms-blue font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60`}
                    >
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                        ) : (
                            <>
                                {step < 4 ? <span>Next</span> : <span>Submit Registration</span>}
                                {step < 4 && <ChevronRight className="h-4 w-4" />}
                            </>
                        )}
                    </button>
                </div>

                <div className="pt-2 text-center space-y-2">
                    <p className="text-sm text-prms-slate">
                        Already have an account?{" "}
                        <Link href="/provider-login" className="font-semibold text-primary transition-colors hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                    <p className="text-sm text-prms-slate">
                        Looking to rent?{" "}
                        <Link href="/signup" className="font-semibold text-primary transition-colors hover:text-blue-700">
                            Sign up as Tenant
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}
