"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Key, Globe, Clock, AlertTriangle } from "lucide-react"

interface AccountSettingsProps {
    userId: string
    email: string
}

export function AccountSettings({ userId, email }: AccountSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

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
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMessage({ type: 'success', text: "Password updated successfully!" })
            setPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to update password." })
        } finally {
            setLoading(false)
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
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
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
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                </CardContent>
            </Card>
        </div>
    )
}
