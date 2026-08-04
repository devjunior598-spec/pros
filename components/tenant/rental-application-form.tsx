"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, Sparkles, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface RentalApplicationFormProps {
    propertyId: string
    tenantId: string
    rentAmount: number
    onSuccess: () => void
}

export function RentalApplicationForm({ propertyId, tenantId, rentAmount, onSuccess }: RentalApplicationFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploadingFile, setUploadingFile] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [moveInDate, setMoveInDate] = useState("")
    const [employment, setEmployment] = useState("")
    const [income, setIncome] = useState("")
    const [applicationLetter, setApplicationLetter] = useState("")
    const [applicationLetterUrl, setApplicationLetterUrl] = useState("")

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !tenantId) return

        setUploadingFile(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `application_letters/${tenantId}_${Date.now()}.${fileExt}`

            const { error: uploadErr } = await supabase.storage
                .from('property-documents')
                .upload(filePath, file, { upsert: true })

            if (uploadErr) {
                const reader = new FileReader()
                reader.onload = () => {
                    setApplicationLetterUrl(reader.result as string)
                    setUploadingFile(false)
                }
                reader.readAsDataURL(file)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('property-documents')
                .getPublicUrl(filePath)

            setApplicationLetterUrl(publicUrl)
        } catch (err) {
            console.error("File upload error:", err)
        } finally {
            setUploadingFile(false)
        }
    }

    const autoFillTemplate = () => {
        const moveIn = moveInDate ? new Date(moveInDate).toLocaleDateString() : "the earliest available date"
        const emp = employment || "Employed Professional"
        const inc = income ? `₦${income}` : "As specified in profile"

        const letter = `Dear Property Owner / Landlord,\n\nI am writing to formally submit my rental application for this property.\n\nAbout Me:\nI work as ${emp}. I am seeking a quality, well-managed home and believe this residence matches my living requirements.\n\nKey Application Summary:\n- Employment: ${emp}\n- Monthly Income: ${inc}\n- Preferred Move-in Date: ${moveIn}\n\nI take pride in maintaining a quiet, clean, and respectful home environment while ensuring rent is paid reliably on time.\n\nThank you for reviewing my application letter.\n\nSincerely,\nApplicant`
        setApplicationLetter(letter)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/rentals/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    employment: employment.trim() || undefined,
                    income: income.trim() || undefined,
                    applicationLetter: applicationLetter.trim() || undefined,
                    applicationLetterUrl: applicationLetterUrl.trim() || undefined,
                    rentStartDate: moveInDate || null,
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to submit application')

            onSuccess()
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : "Failed to submit application"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent</Label>
                <Input
                    id="rent"
                    value={`₦${rentAmount.toLocaleString()}/mo`}
                    disabled
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="employment" className="text-xs font-semibold">Employment Status</Label>
                    <Input
                        id="employment"
                        placeholder="e.g. Software Engineer"
                        value={employment}
                        onChange={(e) => setEmployment(e.target.value)}
                        className="text-xs"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="income" className="text-xs font-semibold">Monthly Income</Label>
                    <Input
                        id="income"
                        placeholder="e.g. 600000"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        className="text-xs"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="moveIn" className="text-xs font-semibold">Proposed Move-in Date</Label>
                <Input
                    id="moveIn"
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="text-xs"
                />
            </div>

            <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                    <Label htmlFor="letter" className="flex items-center gap-1 font-semibold text-xs">
                        <FileText className="w-3.5 h-3.5 text-primary" /> Application Letter to Landlord
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-primary"
                        onClick={autoFillTemplate}
                    >
                        <Sparkles className="mr-1 h-3 w-3" /> Auto-fill Template
                    </Button>
                </div>
                <Textarea
                    id="letter"
                    placeholder="Write a brief cover letter introducing yourself to the landlord..."
                    value={applicationLetter}
                    onChange={(e) => setApplicationLetter(e.target.value)}
                    rows={4}
                    className="text-xs font-sans leading-relaxed"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Attach Document or Cover Letter File (Optional)</Label>
                <div className="flex items-center space-x-2">
                    <Input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileUpload}
                        className="cursor-pointer text-xs"
                        disabled={uploadingFile}
                    />
                    {uploadingFile && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                {applicationLetterUrl && (
                    <p className="text-[11px] text-green-600 font-medium flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Document attached
                    </p>
                )}
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
                By clicking &quot;Confirm Application&quot;, your application details and cover letter will be sent directly to the property landlord.
            </p>

            <Button type="submit" className="w-full text-xs font-bold py-2.5 bg-blue-600 hover:bg-blue-700" disabled={loading || uploadingFile}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    "Confirm Application & Letter"
                )}
            </Button>
        </form>
    )
}
