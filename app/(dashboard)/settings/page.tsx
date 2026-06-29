"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ProfileSettings } from "@/components/profile-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Key, Bell } from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        let mounted = true
        const getUserInfo = async (signal: AbortSignal) => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user && !signal.aborted) {
                    setUser(user)
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error loading user data:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }

        getUserInfo()
        return () => mounted = false
    }, [])

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

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 p-1">
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
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <ProfileSettings userId={user.id} />
                </TabsContent>

                <TabsContent value="account" className="mt-6">
                    <AccountSettings userId={user.id} email={user.email} />
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}

