"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react"

interface KYCFormProps {
    userId: string
    currentProfile: any
}

export function KYCForm({ userId, currentProfile }: KYCFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(currentProfile?.name || "")
    const [phone, setPhone] = useState(currentProfile?.phone || "")
    const [dob, setDob] = useState("")
    const [address, setAddress] = useState("")
    const [idType, setIdType] = useState("NIN")
    const [idNumber, setIdNumber] = useState("")
    const [idImage, setIdImage] = useState<File | null>(null)
    const [selfieImage, setSelfieImage] = useState<File | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!idImage || !selfieImage) {
            setMessage({ type: 'error', text: 'Please upload both ID and Selfie images' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const formData = new FormData()
            formData.append('userId', userId)
            formData.append('fullName', fullName)
            formData.append('phone', phone)
            formData.append('dob', dob)
            formData.append('address', address)
            formData.append('idType', idType)
            formData.append('idNumber', idNumber)
            formData.append('idImage', idImage)
            formData.append('selfieImage', selfieImage)

            const response = await fetch('/api/kyc/submit', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) throw new Error(result.message || 'Submission failed')

            setMessage({ type: 'success', text: 'KYC documents submitted successfully! Admin will review them shortly.' })
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)
        } catch (error: any) {
            console.error("KYC Submission error:", error)
            setMessage({ type: 'error', text: error.message || 'Failed to submit KYC' })
        } finally {
            setLoading(false)
        }
    }

    if (message?.type === 'success') {
        return (
            <Card className="max-w-md mx-auto text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl mb-2">Submission Successful</CardTitle>
                <CardDescription>{message.text}</CardDescription>
                <Button className="mt-6 w-full" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Identity Verification (KYC)</CardTitle>
                <CardDescription>
                    Please provide your legal documents to unlock wallet features and secure your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Legal Name</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="idType">Government ID Type</Label>
                            <Select value={idType} onValueChange={setIdType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ID Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NIN">NIN</SelectItem>
                                    <SelectItem value="Driver's License">Driver's License</SelectItem>
                                    <SelectItem value="Passport">International Passport</SelectItem>
                                    <SelectItem value="Voter's Card">Voter's Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-full space-y-2">
                            <Label htmlFor="idNumber">ID Number</Label>
                            <Input
                                id="idNumber"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-span-full space-y-2">
                            <Label htmlFor="address">Residential Address</Label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>ID Card Image (Front)</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={(e) => setIdImage(e.target.files?.[0] || null)}
                                />
                                {idImage ? (
                                    <p className="text-sm font-medium text-primary flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 mr-2" /> {idImage.name}
                                    </p>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground">Click to upload ID Card</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Selfie with ID</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={(e) => setSelfieImage(e.target.files?.[0] || null)}
                                />
                                {selfieImage ? (
                                    <p className="text-sm font-medium text-primary flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 mr-2" /> {selfieImage.name}
                                    </p>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground">Click to upload Selfie</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {message?.type === 'error' && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting Details...
                            </>
                        ) : (
                            "Submit for Verification"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
