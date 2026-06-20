
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Home, Target } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
    const values = [
        {
            icon: Shield,
            title: "Trust & Security",
            description: "We verify every landlord and property to ensure a safe rental experience for everyone."
        },
        {
            icon: Home,
            title: "Quality Listings",
            description: "Our platform only features properties that meet our high standards for comfort and livability."
        },
        {
            icon: Users,
            title: "Community First",
            description: "We're building more than a marketplace; we're building a community of reliable tenants and landlords."
        },
        {
            icon: Target,
            title: "Transparency",
            description: "No hidden fees or surprises. We believe in clear communication and honest transactions."
        }
    ]

    const teamMembers = [
        {
            name: "Chinedu Okeke",
            role: "CEO & Co-Founder",
            bio: "Former real estate agent with a passion for solving housing challenges in Nigeria."
        },
        {
            name: "Amina Yusuf",
            role: "CTO",
            bio: "Tech veteran focused on building secure and scalable platforms for everyday users."
        },
        {
            name: "David Olatunji",
            role: "Head of Operations",
            bio: "Ensures smooth day-to-day operations and excellent customer support."
        }
    ]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative w-full py-12 md:py-24 lg:py-32 bg-muted overflow-hidden">
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                            Reimagining Rental <span className="text-primary">Experiences</span>
                        </h1>
                        <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
                            We are on a mission to simplify the property rental process in Nigeria, making it secure, transparent, and hassle-free.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <Link href="/listings">
                                <Button size="lg">Browse Listings</Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" size="lg">Contact Us</Button>
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Abstract Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 bg-primary rounded-full blur-3xl -z-0"></div>
            </section>

            {/* Mission Section */}
            <section className="w-full py-12 md:py-24 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Mission</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Finding a home should be an exciting journey, not a stressful one. At House Do, we are leveraging technology to bridge the gap between tenants and landlords.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We provide a platform where authenticity is guaranteed, payments are secure, and property management is effortless. Whether you are looking for your next home or managing your investment, we are here to support you every step of the way.
                            </p>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-xl border">
                            <img
                                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                                alt="Modern building"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="w-full py-12 md:py-24 bg-muted/50">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Core Values</h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            The principles that guide everything we do.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {values.map((value, index) => (
                            <Card key={index} className="bg-card border-none shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-2">
                                        <value.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">{value.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {value.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="w-full py-12 md:py-24 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Meet the Team</h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            The dedicated individuals working to change the real estate landscape.
                        </p>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {teamMembers.map((member, index) => (
                            <Card key={index} className="overflow-hidden">
                                <div className="h-48 bg-muted flex items-center justify-center">
                                    {/* Placeholder for team image */}
                                    <Users className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                                <CardHeader className="text-center">
                                    <CardTitle>{member.name}</CardTitle>
                                    <CardDescription className="font-medium text-primary">{member.role}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center text-muted-foreground">
                                    {member.bio}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to get started?</h2>
                        <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
                            Join thousands of users who trust House Do for their property needs.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/signup">
                                <Button variant="secondary" size="lg" className="text-primary font-bold">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
