"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Key, Globe, AlertTriangle, ShieldCheck, LockKeyhole } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface AccountSettingsProps {
    userId: string
    email: string
}

export function AccountSettings({ email }: AccountSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [verificationPassword, setVerificationPassword] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [verifiedUntil, setVerifiedUntil] = useState<number | null>(null)
    const { toast } = useToast()

    const isRecentlyVerified = Boolean(verifiedUntil && verifiedUntil > Date.now())

    useEffect(() => {
        const recognizeRecentLogin = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
            const tenMinutes = 10 * 60 * 1000
            if (lastSignIn && Date.now() - lastSignIn < tenMinutes) setVerifiedUntil(lastSignIn + tenMinutes)
        }
        void recognizeRecentLogin()
    }, [])

    const verifyPassword = async (candidate: string) => {
        if (!candidate) throw new Error("Enter your current password.")
        const { error } = await supabase.auth.signInWithPassword({ email, password: candidate })
        if (error) throw new Error("The current password is incorrect.")
        const expiresAt = Date.now() + 10 * 60 * 1000
        setVerifiedUntil(expiresAt)
        return expiresAt
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match." })
            return
        }
        if (password.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters." })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            await verifyPassword(currentPassword)
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMessage({ type: 'success', text: "Password updated successfully!" })
            setPassword("")
            setConfirmPassword("")
            setCurrentPassword("")
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : "Failed to update password." })
        } finally {
            setLoading(false)
        }
    }

    const handleSensitiveActionVerification = async () => {
        if (isRecentlyVerified) {
            setDeleteDialogOpen(false)
            toast({ title: "Identity already confirmed", description: "Your recent verification remains valid for this sensitive action." })
            return
        }
        setVerifying(true)
        try {
            await verifyPassword(verificationPassword)
            setVerificationPassword("")
            setDeleteDialogOpen(false)
            toast({ title: "Identity confirmed", description: "Verification is valid for 10 minutes. No account data has been deleted." })
        } catch (error) {
            toast({ title: "Verification failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
        } finally {
            setVerifying(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Security & Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="current-email">Account Email</Label>
                            <Input id="current-email" value={email} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Confirm your current password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Preferences
                    </CardTitle>
                    <CardDescription>
                        Manage your language and regional settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                            id="language"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="en"
                        >
                            <option value="en">English (US)</option>
                            <option value="en-gb">English (UK)</option>
                            <option value="fr">French</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                            id="timezone"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="wat"
                        >
                            <option value="wat">West Africa Time (WAT)</option>
                            <option value="gmt">Greenwich Mean Time (GMT)</option>
                            <option value="est">Eastern Standard Time (EST)</option>
                        </select>
                    </div>
                    <Button variant="outline">Save Preferences</Button>
                </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanently delete your account and all associated data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Confirm your identity before reviewing account deletion. Verification expires after 10 minutes.
                    </p>
                    {isRecentlyVerified && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            <ShieldCheck className="h-4 w-4" /> Identity recently verified
                        </div>
                    )}
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <LockKeyhole className="mr-2 h-4 w-4" />
                        {isRecentlyVerified ? "Continue to Deletion Review" : "Verify Identity"}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setVerificationPassword("") }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm your identity</DialogTitle>
                        <DialogDescription>
                            {isRecentlyVerified
                                ? "Your recent login is still valid. Continue without entering your password again."
                                : "Enter your current password before continuing to the account-deletion review."}
                        </DialogDescription>
                    </DialogHeader>
                    {!isRecentlyVerified && (
                        <div className="space-y-2 py-2">
                            <Label htmlFor="verification-password">Current Password</Label>
                            <Input
                                id="verification-password"
                                type="password"
                                autoComplete="current-password"
                                value={verificationPassword}
                                onChange={(event) => setVerificationPassword(event.target.value)}
                                onKeyDown={(event) => { if (event.key === "Enter") void handleSensitiveActionVerification() }}
                                placeholder="Enter your password"
                                autoFocus
                            />
                        </div>
                    )}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        This step only verifies your identity. It does not delete your account or any associated records.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={verifying}>Cancel</Button>
                        <Button variant="destructive" onClick={() => void handleSensitiveActionVerification()} disabled={verifying || (!isRecentlyVerified && !verificationPassword)}>
                            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRecentlyVerified ? "Continue" : "Verify Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
