"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { PublicPageShell } from "@/components/public-page-shell"

const faqs = [
  { question: "How do I list a property?", answer: "Create a landlord account, add the property address and details, upload photos, and choose whether to publish the listing. Include the state and ZIP code so renters can identify the location." },
  { question: "Which locations does PRMS support?", answer: "The U.S. version is set up for properties in the United States. Availability of listings depends on the inventory added to the platform." },
  { question: "How are rental applications handled?", answer: "Applicants can submit information and supporting documents through a listing. Landlords review applications and decide what screening criteria to use, subject to applicable federal, state, and local requirements." },
  { question: "Can tenants pay rent through PRMS?", answer: "Payment processing is not available until a U.S. payment provider is configured for the account. Until then, PRMS can be used to track rent activity, but tenants should follow the payment instructions in their lease." },
  { question: "How do I handle a maintenance issue?", answer: "Tenants can submit a maintenance request from their dashboard and follow its status. Landlords can review requests and coordinate work with their property team." },
  { question: "Can I remove or unpublish a listing?", answer: "Yes. A landlord can edit a property and change its publication or availability status from the property dashboard." },
  { question: "Does PRMS provide tenant screening or legal advice?", answer: "PRMS provides tools for managing property information and applications. It does not make screening decisions or provide legal advice. Requirements vary by jurisdiction." },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <PublicPageShell pageTitle="Frequently Asked Questions" pageSubtitle="Answers about managing U.S. rental properties with PRMS." badge="Help center">
      <section className="mx-auto max-w-4xl space-y-3 px-4 py-14 sm:px-6">
        {faqs.map((faq, index) => {
          const open = openIndex === index
          return (
            <article key={faq.question} className="overflow-hidden rounded-xl border border-border bg-white">
              <button type="button" onClick={() => setOpenIndex(open ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-prms-navy" aria-expanded={open}>
                {faq.question}<ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">{faq.answer}</p>}
            </article>
          )
        })}
      </section>
    </PublicPageShell>
  )
}
