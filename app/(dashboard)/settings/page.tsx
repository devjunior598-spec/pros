"use client"

import { ProfileSettings } from "@/components/profile-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import VerificationCenterPage from "@/app/(dashboard)/verification/page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Key, Bell, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
    const { user, loading } = useAuth()
    const searchParams = useSearchParams()
    const requestedTab = searchParams.get("tab")
    const initialTab = ["profile", "account", "notifications", "identity"].includes(requestedTab || "")
        ? requestedTab!
        : "profile"

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Please log in to view settings.</div>
    }

    return (
        <div className="flex-1 space-y-4 px-3 py-4 md:p-8 md:pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                </div>
            </div>

            <Tabs defaultValue={initialTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 max-w-xl bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="identity" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Identity</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <ProfileSettings userId={user.id} />
                </TabsContent>

                <TabsContent value="account" className="mt-6">
                    <AccountSettings userId={user.id} email={user.email || ""} />
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                    <NotificationSettings userId={user.id} />
                </TabsContent>

                <TabsContent value="identity" className="mt-6">
                    <VerificationCenterPage />
                </TabsContent>
            </Tabs>
        </div>
    )
}
