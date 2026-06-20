"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    PieChart,
    LineChart,
    Download,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp
} from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground">Comprehensive insights into your property portfolio performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Generate PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-none shadow-sm dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Occupancy Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">94.2%</div>
                        <p className="text-green-600 text-xs mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +2.1% this year
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Net Yield</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">8.4%</div>
                        <p className="text-green-600 text-xs mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Above market avg
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Maintenance Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₦124,000</div>
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +5% this month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Tenant Retention</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">2.4 Years</div>
                        <p className="text-muted-foreground text-xs mt-1">Average lease duration</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm dark:bg-gray-950 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                        <CardDescription>Monthly income distribution across your portfolio.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                            <BarChart3 className="h-24 w-24 opacity-10" />
                            <p className="text-sm italic">Historical revenue charts will appear here as more data is collected.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm dark:bg-gray-950 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Portfolio Distribution</CardTitle>
                        <CardDescription>Income share by property type and location.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                            <PieChart className="h-24 w-24 opacity-10" />
                            <p className="text-sm italic">Portfolio allocation visualizations will be visible once active rentals exceed 5 properties.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute left-0 top-0 h-full w-2 bg-white/20" />
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Tax Statement Generator
                            </CardTitle>
                            <CardDescription className="text-blue-100">Download your FY 2023 financial summary for tax purposes.</CardDescription>
                        </div>
                        <TrendingUp className="h-12 w-12 opacity-20" />
                    </div>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button variant="default" className="bg-white text-blue-600 hover:bg-blue-50 font-bold">
                        Download Now
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold">
                        Preview Summary
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
