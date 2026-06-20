"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQPage() {
    const faqs = [
        {
            question: "How do I list my property?",
            answer: "To list a property, you first need to sign up as a Landlord. Once your account is created, you can access your dashboard and click the 'Post Property' button to fill out the property details and upload images."
        },
        {
            question: "Is the payment system secure?",
            answer: "Yes, PRMS uses encrypted payment gateways to process all transactions. We do not store your full card details on our servers, and all rent payments are tracked within the system for your security."
        },
        {
            question: "How are tenants verified?",
            answer: "Landlords can review tenant profiles and rental applications directly through the dashboard. We encourage landlords to perform their own due diligence, but our platform provides a structured way to collect necessary documentation."
        },
        {
            question: "What happens if I have a maintenance issue?",
            answer: "Tenants can submit maintenance requests directly through their dashboard. Landlords are notified immediately and can track the progress of the repair within the system."
        },
        {
            question: "How do I pay my rent?",
            answer: "Once your application is approved and the lease starts, you will see your upcoming bills in your Tenant Dashboard. You can pay securely using your preferred payment method (Card, Transfer, etc.) via the 'Pay Now' button."
        },
        {
            question: "Can I cancel my listing?",
            answer: "Yes, landlords can update the status of their properties at any time. You can mark a property as 'draft', 'rented', or 'unavailable' from your property management dashboard."
        }
    ]

    return (
        <div className="container py-12 md:py-24 max-w-3xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
                <p className="text-muted-foreground text-lg">
                    Everything you need to know about using the PRMS platform.
                </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-semibold">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="mt-16 p-8 bg-secondary/30 rounded-2xl text-center">
                <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                    We're here to help you get the most out of PRMS.
                </p>
                <a href="/contact">
                    <button className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                        Contact Support
                    </button>
                </a>
            </div>
        </div>
    )
}
