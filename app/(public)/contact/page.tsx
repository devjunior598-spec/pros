"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically integrate with an API or Supabase Edge Function
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="container py-20 flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Message Sent!</h1>
                <p className="text-muted-foreground mt-4 max-w-md">
                    Thank you for reaching out to PRMS. Our team has received your inquiry and will get back to you within 24-48 business hours.
                </p>
                <Button className="mt-8" onClick={() => setSubmitted(false)}>
                    Send another message
                </Button>
            </div>
        )
    }

    return (
        <div className="container py-12 md:py-24">
            <div className="flex flex-col gap-12 lg:flex-row">
                <div className="lg:w-1/3 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
                        <p className="text-muted-foreground mt-4 text-lg">
                            Have questions about a property or our services? We're here to help.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Email</h4>
                                <p className="text-sm text-muted-foreground">support@prms.ng</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Phone</h4>
                                <p className="text-sm text-muted-foreground">+234 800 000 0000</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Office</h4>
                                <p className="text-sm text-muted-foreground">
                                    Victoria Island, Lagos,<br />
                                    Nigeria
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-2/3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send us a message</CardTitle>
                            <CardDescription>
                                Fill out the form below and we'll connect you with the right person.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input placeholder="John Doe" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input type="email" placeholder="john@example.com" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input placeholder="Inquiry about a property" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea
                                        placeholder="Tell us how we can help..."
                                        className="min-h-[150px]"
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full sm:w-auto px-8">
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
