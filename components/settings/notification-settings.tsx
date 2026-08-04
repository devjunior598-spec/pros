"use client"

import { useEffect, useState } from "react"
import { Bell, Loader2, Mail, Save, Smartphone } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type Preferences = {
    emailAlerts: boolean
    maintenanceUpdates: boolean
    paymentReminders: boolean
    marketingEmails: boolean
    smsAlerts: boolean
    pushNotifications: boolean
}

const defaults: Preferences = {
    emailAlerts: true,
    maintenanceUpdates: true,
    paymentReminders: true,
    marketingEmails: false,
    smsAlerts: false,
    pushNotifications: true,
}

const toDatabase = (settings: Preferences) => ({
    email_alerts: settings.emailAlerts,
    maintenance_updates: settings.maintenanceUpdates,
    payment_reminders: settings.paymentReminders,
    marketing_emails: settings.marketingEmails,
    sms_alerts: settings.smsAlerts,
    push_notifications: settings.pushNotifications,
})

export function NotificationSettings({ userId }: { userId: string }) {
    const { toast } = useToast()
    const [settings, setSettings] = useState(defaults)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        let active = true
        const loadPreferences = async () => {
            const { data, error } = await supabase
                .from("user_notification_preferences")
                .select("email_alerts, maintenance_updates, payment_reminders, marketing_emails, sms_alerts, push_notifications")
                .eq("user_id", userId)
                .maybeSingle()

            if (!active) return
            if (error) {
                toast({ title: "Could not load preferences", description: error.message, variant: "destructive" })
            } else if (data) {
                setSettings({
                    emailAlerts: data.email_alerts,
                    maintenanceUpdates: data.maintenance_updates,
                    paymentReminders: data.payment_reminders,
                    marketingEmails: data.marketing_emails,
                    smsAlerts: data.sms_alerts,
                    pushNotifications: data.push_notifications,
                })
            }
            setLoading(false)
        }
        void loadPreferences()
        return () => { active = false }
    }, [toast, userId])

    const handleToggle = (key: keyof Preferences) => {
        setSettings(previous => ({ ...previous, [key]: !previous[key] }))
        setDirty(true)
    }

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase.from("user_notification_preferences").upsert({
            user_id: userId,
            ...toDatabase(settings),
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        setSaving(false)

        if (error) {
            toast({ title: "Preferences not saved", description: error.message, variant: "destructive" })
            return
        }
        setDirty(false)
        toast({ title: "Preferences saved", description: "Your notification choices now apply across your devices." })
    }

    if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>

    const preferenceRow = (id: keyof Preferences, title: string, description: string, disabled = false) => (
        <div className="flex items-center justify-between gap-6 border-b pb-4 last:border-0 last:pb-0">
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-base">{title}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch id={id} checked={settings[id]} onCheckedChange={() => handleToggle(id)} disabled={disabled || saving} />
        </div>
    )

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Email Notifications</CardTitle>
                    <CardDescription>Choose what PRMS emails you about.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {preferenceRow("emailAlerts", "Account Alerts", "Essential security and authentication notices cannot be disabled.", true)}
                    {preferenceRow("maintenanceUpdates", "Maintenance Updates", "Updates to maintenance requests and assigned work.")}
                    {preferenceRow("paymentReminders", "Payment Reminders", "Upcoming, received, and overdue rent payment notices.")}
                    {preferenceRow("marketingEmails", "Marketing & News", "Product announcements, new features, and PRMS news.")}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" />Push & SMS Notifications</CardTitle>
                    <CardDescription>Control mobile and in-app delivery channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {preferenceRow("pushNotifications", "Push Notifications", "Alerts from PRMS in your supported browser or mobile app.")}
                    {preferenceRow("smsAlerts", "SMS Alerts", "Important account and payment alerts by text message.")}
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">{dirty ? "You have unsaved changes." : "All changes are saved."}</p>
                    <Button onClick={() => void handleSave()} disabled={saving || !dirty}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {saving ? "Saving…" : "Save Preferences"}
                    </Button>
                </CardFooter>
            </Card>

            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Delivery also depends on verified contact details and permission settings on your device.
            </div>
        </div>
    )
}
