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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Loader2,
    Upload,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Briefcase,
    MapPin,
    ShieldCheck,
    User
} from "lucide-react"

const CATEGORIES = [
    "Plumbing", "Electrical", "Rewiring", "Carpentry",
    "Painting", "Tiling", "Roofing", "AC Repair",
    "Waste Disposal", "General Handyman"
]

const NIGERIAN_STATES = [
    "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Ogun", "Delta", "Edo", "Anambra", "Enugu"
]

export default function ProviderSignupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        category: "",
        experience: "",
        state: "",
        city: "",
        bio: "",
        cacNumber: "",
    })

    const [files, setFiles] = useState<{
        profilePhoto: File | null;
        governmentId: File | null;
    }>({
        profilePhoto: null,
        governmentId: null,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        })
    }

    const handleSelectChange = (id: string, value: string) => {
        setFormData({
            ...formData,
            [id]: value,
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profilePhoto' | 'governmentId') => {
        if (e.target.files && e.target.files[0]) {
            setFiles({
                ...files,
                [type]: e.target.files[0]
            })
        }
    }

    const nextStep = () => setStep(step + 1)
    const prevStep = () => setStep(step - 1)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step < 4) {
            nextStep()
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'service_provider',
                    },
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("Signup failed")

            const userId = authData.user.id

            // 2. Upload Files
            let profileUrl = ""
            let idUrl = ""

            if (files.profilePhoto) {
                const fileName = `${userId}/profile_${Date.now()}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('provider_documents')
                    .upload(fileName, files.profilePhoto)
                if (uploadError) throw uploadError
                profileUrl = supabase.storage.from('provider_documents').getPublicUrl(fileName).data.publicUrl
            }

            if (files.governmentId) {
                const fileName = `${userId}/id_${Date.now()}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('provider_documents')
                    .upload(fileName, files.governmentId)
                if (uploadError) throw uploadError
                idUrl = supabase.storage.from('provider_documents').getPublicUrl(fileName).data.publicUrl
            }

            // 3. Create Service Provider Record
            const { error: providerError } = await supabase
                .from('service_providers')
                .insert({
                    user_id: userId,
                    category: formData.category,
                    experience_years: parseInt(formData.experience) || 0,
                    location_state: formData.state,
                    location_city: formData.city,
                    bio: formData.bio,
                    verified: false,
                    approval_status: 'pending'
                })

            if (providerError) throw providerError

            // 4. Update profile with photo if available
            if (profileUrl) {
                await supabase
                    .from('profiles')
                    .update({ profile_image_url: profileUrl })
                    .eq('id', userId)
            }

            setSuccess(true)
        } catch (err: any) {
            console.error("Signup error:", err)
            setError(err.message || "Something went wrong during registration")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="max-w-md mx-auto text-center p-8 py-12">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                </div>
                <CardTitle className="text-2xl mb-4">Registration Submitted!</CardTitle>
                <CardDescription className="text-base mb-8">
                    Your account has been created and is currently **pending admin approval**.
                    We will notify you via email once your account is activated.
                </CardDescription>
                <Button className="w-full" asChild>
                    <Link href="/login">Go to Login</Link>
                </Button>
            </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto shadow-xl border-none">
            <CardHeader className="space-y-1">
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                    Provider Registration
                </CardTitle>
                <CardDescription>
                    Step {step} of 4: {
                        step === 1 ? "Account Credentials" :
                            step === 2 ? "Professional Details" :
                                step === 3 ? "Service Location" : "Verification Documents"
                    }
                </CardDescription>
                <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </CardHeader>
            <form onSubmit={handleSignup}>
                <CardContent className="pt-6 space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Enter your legal full name"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="e.g., 08012345678"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Service Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => handleSelectChange('category', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your primary skill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="experience">Years of Experience</Label>
                                <Input
                                    id="experience"
                                    type="number"
                                    placeholder="How many years have you been working?"
                                    required
                                    value={formData.experience}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Professional Bio</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="Briefly describe your services and expertise..."
                                    className="min-h-[120px]"
                                    required
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="state">Service State</Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(v) => handleSelectChange('state', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state in Nigeria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NIGERIAN_STATES.map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City / Area</Label>
                                <Input
                                    id="city"
                                    placeholder="Enter city or area of residence"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label>Profile Photo</Label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileChange(e, 'profilePhoto')}
                                        accept="image/*"
                                    />
                                    {files.profilePhoto ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                            <p className="text-xs font-medium truncate w-full px-2">{files.profilePhoto.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <User className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500">Upload professional photo</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Government ID (NIN/DL)</Label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileChange(e, 'governmentId')}
                                        accept="image/*,.pdf"
                                    />
                                    {files.governmentId ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                            <p className="text-xs font-medium truncate w-full px-2">{files.governmentId.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500">Upload ID for verification</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4 mt-4">
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800 flex gap-3">
                                    <ShieldCheck className="h-5 w-5 shrink-0" />
                                    <p>Upon registration, your documents will be reviewed by our compliance team. Verification typically takes 24-48 hours.</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cacNumber">CAC Number (Optional for Companies)</Label>
                                    <Input
                                        id="cacNumber"
                                        placeholder="RC-1234567"
                                        value={formData.cacNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 p-6 border-t font-medium">
                    <div className="flex w-full gap-4">
                        {step > 1 && (
                            <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                                <ChevronLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                        )}
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Registering...
                                </>
                            ) : (
                                <>
                                    {step < 4 ? (
                                        <>Next <ChevronRight className="h-4 w-4 ml-2" /></>
                                    ) : "Submit Registration"}
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="text-center text-sm font-normal text-gray-500">
                        Interested in Renting?{" "}
                        <Link href="/signup" className="text-blue-600 underline font-medium">
                            Register as a Tenant
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
