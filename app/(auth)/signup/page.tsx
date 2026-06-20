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
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        })
    }

    const handleRoleChange = (role: "tenant" | "landlord") => {
        setFormData({ ...formData, role })
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        console.log("=== handleSignup START ===");

        try {
            console.log("Calling signUp...", formData);
            // 1. Sign up with Supabase Auth
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
            console.log("signUp returned", authData, authError);

            if (authError) throw authError

            if (authData.user) {
                console.log("User created!");
                
                if (!authData.session) {
                    setRequiresEmailConfirm(true)
                }
                
                setIsSuccess(true)
                return
            }
        } catch (err: any) {
            console.error("signUp catch error:", err);
            setError(err.message || "Something went wrong")
        } finally {
            console.log("signUp finally");
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-green-600">Sign up successful!</CardTitle>
                    <CardDescription>
                        {requiresEmailConfirm 
                            ? <span>We have sent a confirmation link to <strong>{formData.email}</strong>. Please check your email to complete your registration.</span>
                            : <span>Your account has been created successfully. Welcome to PRMS!</span>
                        }
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    {requiresEmailConfirm ? (
                        <Link href="/login" className="w-full">
                            <Button className="w-full">Return to Login</Button>
                        </Link>
                    ) : (
                        <Button className="w-full" onClick={() => {
                            const pendingPropId = localStorage.getItem("pending_application_id")
                            if (pendingPropId) {
                                localStorage.removeItem("pending_application_id")
                                router.push(`/dashboard/tenant/apply/${pendingPropId}`)
                            } else {
                                router.push("/dashboard")
                            }
                        }}>Go to Dashboard</Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>
                    Enter your information to get started.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>I am a...</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted ${formData.role === "tenant" ? "border-primary bg-primary/5" : ""}`}
                                onClick={() => handleRoleChange("tenant")}
                            >
                                <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center`}>
                                    {formData.role === "tenant" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                                <Label className="cursor-pointer font-medium text-sm">Tenant</Label>
                            </div>
                            <div
                                className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted ${formData.role === "landlord" ? "border-primary bg-primary/5" : ""}`}
                                onClick={() => handleRoleChange("landlord")}
                            >
                                <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center`}>
                                    {formData.role === "landlord" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                                <Label className="cursor-pointer font-medium text-sm">Landlord</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                    <div className="text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
