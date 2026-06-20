import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Building, Users, CreditCard, Shield, Search, FileText, Wrench } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                Everything You Need to Rent with Confidence
                            </h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Whether you're looking for your perfect home or managing your property portfolio,
                                PRMS provides the tools to make it simple, secure, and efficient.
                            </p>
                        </div>
                        <div className="space-x-4">
                            <Link href="/signup">
                                <Button size="lg">Get Started</Button>
                            </Link>
                            <Link href="/listings">
                                <Button variant="outline" size="lg">Browse Listings</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tenants Section */}
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                            For Tenants
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Find Your Dream Home
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            We make renting easy, transparent, and hassle-free.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <Search className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Smart Search</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Filter by location, price, amenities, and more to find exactly what you're looking for.
                                </CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <FileText className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Digital Leases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Sign verified lease agreements online. No more paperwork headaches.
                                </CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CreditCard className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Secure Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Pay rent safely online with automated receipts and history tracking.
                                </CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Wrench className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Maintenance Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Report issues directly to your landlord and track repair status in real-time.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Landlords Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                            For Landlords
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Manage Your Properties Like a Pro
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Streamline your operations and maximize your rental income.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <Building className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold">Property Portfolio</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Manage all your units from a single dashboard. Track occupancy, lease expiries, and unit details.
                            </p>
                        </div>
                        <div className="flex flex-col items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <Users className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold">Tenant Screening</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Find reliable tenants with background checks and credit history (coming soon).
                            </p>
                        </div>
                        <div className="flex flex-col items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold">Automated Rent Collection</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Set up recurring payments and auto-reminders so you never chase rent again.
                            </p>
                        </div>
                        <div className="flex flex-col items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <Shield className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold">Financial Reporting</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Track income and expenses easily. Generate reports only when you need them.
                            </p>
                        </div>
                        <div className="flex flex-col items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold">Maintenance Coordination</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Receive and prioritize maintenance requests. Assign tasks to vendors efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 border-t">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                            Ready to Upgrade Your Rental Experience?
                        </h2>
                        <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                            Join thousands of happy tenants and landlords on PRMS today.
                        </p>
                        <div className="space-x-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto">Create Free Account</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
