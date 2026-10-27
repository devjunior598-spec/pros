"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Settings,
    Shield,
    Bell,
    Database,
    Save,
    Lock,
    Globe,
    History,
    RefreshCw,
    Activity,
    LogOut,
    Loader2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

type SystemSettings = {
    site_name: string
    support_email: string
    maintenance_mode: boolean
    commission_rate: number
    min_withdrawal: number
    two_factor_required: boolean
    auto_payouts_enabled: boolean
    require_admin_payment_approval: boolean
}

export default function AdminSettingsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [settings, setSettings] = useState<SystemSettings>({
        site_name: "House Do PRMS",
        support_email: "support@housedo.com",
        maintenance_mode: false,
        commission_rate: 5,
        min_withdrawal: 5000,
        two_factor_required: true,
        auto_payouts_enabled: false,
        require_admin_payment_approval: true,
    })

    const fetchSettings = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/settings")
            const data = await res.json()
            if (data.settings) {
                setSettings(data.settings)
            }
        } catch (error: any) {
            console.error("Error loading settings:", error)
            toast({
                title: "Error",
                description: "Failed to load platform settings",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Failed to save settings")

            toast({
                title: "Success",
                description: data.message || "Platform configuration updated successfully.",
            })
        } catch (error: any) {
            toast({
                title: "Save Error",
                description: error.message || "Could not save platform settings.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Configure global platform parameters and security access.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 shadow-sm"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Configuration
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6 flex overflow-x-auto whitespace-nowrap">
                    <TabsTrigger value="general" className="rounded-lg gap-2">General</TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-lg gap-2">Payouts & Fees</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg gap-2">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Platform Configuration</CardTitle>
                            <CardDescription>Global settings for the PRMS platform interface and support contact.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="site_name">Site Name</Label>
                                    <Input
                                        id="site_name"
                                        value={settings.site_name}
                                        onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support_email">Support Email</Label>
                                    <Input
                                        id="support_email"
                                        type="email"
                                        value={settings.support_email}
                                        onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Maintenance Mode</Label>
                                    <div className="text-xs text-muted-foreground">Restrict public sign-in and viewing while updates are deployed.</div>
                                </div>
                                <Switch
                                    checked={settings.maintenance_mode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save General Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Commissions & Withdrawal Limits</CardTitle>
                            <CardDescription>Configure platform charges and payout rules.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Standard Platform Commission (%)</Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        value={settings.commission_rate}
                                        onChange={(e) => setSettings({ ...settings, commission_rate: Number(e.target.value) || 0 })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min_withdrawal">Minimum Landlord Withdrawal ($)</Label>
                                    <Input
                                        id="min_withdrawal"
                                        type="number"
                                        value={settings.min_withdrawal}
                                        onChange={(e) => setSettings({ ...settings, min_withdrawal: Number(e.target.value) || 0 })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border bg-amber-50 p-4 dark:bg-amber-950/20"><div className="space-y-0.5"><Label className="text-base font-semibold">Admin settlement approval</Label><div className="text-xs text-muted-foreground">Hold verified tenant payments until an administrator releases the landlord settlement.</div></div><Switch checked={settings.require_admin_payment_approval} onCheckedChange={(checked) => setSettings({ ...settings, require_admin_payment_approval: checked })} /></div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Update Financial Policy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Security & Access Controls</CardTitle>
                            <CardDescription>Manage security policies and authentication requirements.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-sm">Two-Factor Authentication</div>
                                        <div className="text-xs text-muted-foreground">Mandatory 2FA protection for administrative console accounts.</div>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.two_factor_required}
                                    onCheckedChange={(checked) => setSettings({ ...settings, two_factor_required: checked })}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Security Rules
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
