"use client"

import { useState } from "react"
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
    LogOut
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Configure global platform parameters and security.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6 flex overflow-x-auto whitespace-nowrap">
                    <TabsTrigger value="general" className="rounded-lg gap-2">General</TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-lg gap-2">Payouts & Fees</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg gap-2">Security</TabsTrigger>
                    <TabsTrigger value="integrations" className="rounded-lg gap-2">Integrations</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Platform Configuration</CardTitle>
                            <CardDescription>Global settings for the PRMS platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="site_name">Site Name</Label>
                                    <Input id="site_name" defaultValue="House Do PRMS" rounded-xl />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support_email">Support Email</Label>
                                    <Input id="support_email" defaultValue="support@housedo.com" rounded-xl />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <div className="text-xs text-muted-foreground">Disable frontend access for all users except admins.</div>
                                </div>
                                <Switch />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
                                    <Save className="h-4 w-4" /> Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Commissions & Limits</CardTitle>
                            <CardDescription>Configure platform charges and withdrawal policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Standard Commission (%)</Label>
                                    <Input id="commission" type="number" defaultValue="5" rounded-xl />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min_withdrawal">Min Withdrawal (₦)</Label>
                                    <Input id="min_withdrawal" type="number" defaultValue="5000" rounded-xl />
                                </div>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">Update Rates</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Security & Access Control</CardTitle>
                            <CardDescription>Manage password policies and admin access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-sm">Two-Factor Authentication</div>
                                        <div className="text-[10px] text-muted-foreground">Force 2FA for all administrative accounts.</div>
                                    </div>
                                </div>
                                <Badge variant="secondary">Mandatory</Badge>
                            </div>
                            {/* More security items... */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
