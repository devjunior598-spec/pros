"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react"

export function NotificationSettings() {
    const [settings, setSettings] = useState({
        emailAlerts: true,
        maintenanceUpdates: true,
        paymentReminders: true,
        marketingEmails: false,
        smsAlerts: false,
        pushNotifications: true
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = () => {
        // Here you would normally save to the backend, e.g., a user_preferences table
        alert("Notification preferences saved successfully!")
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Email Notifications
                    </CardTitle>
                    <CardDescription>
                        Choose what we email you about.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="emailAlerts" className="text-base">Account Alerts</Label>
                            <p className="text-sm text-muted-foreground">Receive emails about your account security and authentication.</p>
                        </div>
                        <Switch
                            id="emailAlerts"
                            checked={settings.emailAlerts}
                            onCheckedChange={() => handleToggle('emailAlerts')}
                            disabled // usually required
                        />
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="maintenanceUpdates" className="text-base">Maintenance Updates</Label>
                            <p className="text-sm text-muted-foreground">Get notified when there's an update on your maintenance requests.</p>
                        </div>
                        <Switch
                            id="maintenanceUpdates"
                            checked={settings.maintenanceUpdates}
                            onCheckedChange={() => handleToggle('maintenanceUpdates')}
                        />
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="paymentReminders" className="text-base">Payment Reminders</Label>
                            <p className="text-sm text-muted-foreground">Receive reminders for upcoming and overdue rent payments.</p>
                        </div>
                        <Switch
                            id="paymentReminders"
                            checked={settings.paymentReminders}
                            onCheckedChange={() => handleToggle('paymentReminders')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketingEmails" className="text-base">Marketing & News</Label>
                            <p className="text-sm text-muted-foreground">Receive updates on new features and PRMS news.</p>
                        </div>
                        <Switch
                            id="marketingEmails"
                            checked={settings.marketingEmails}
                            onCheckedChange={() => handleToggle('marketingEmails')}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Push & SMS Notifications
                    </CardTitle>
                    <CardDescription>
                        Manage your mobile notification preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="pushNotifications" className="text-base">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive push notifications from the browser or mobile app.</p>
                        </div>
                        <Switch
                            id="pushNotifications"
                            checked={settings.pushNotifications}
                            onCheckedChange={() => handleToggle('pushNotifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="smsAlerts" className="text-base">SMS Alerts</Label>
                            <p className="text-sm text-muted-foreground">Receive highly important alerts via text message (charges may apply).</p>
                        </div>
                        <Switch
                            id="smsAlerts"
                            checked={settings.smsAlerts}
                            onCheckedChange={() => handleToggle('smsAlerts')}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} className="mt-4">Save Notification Preferences</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
