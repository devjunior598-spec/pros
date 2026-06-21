"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import PublicPageShell from "@/components/public-page-shell";

const faqs = [
  {
    id: 1,
    question: "How do I list my property?",
    answer:
      "Sign up as a Landlord, complete your KYC verification, then click 'Post Property' in your Landlord Dashboard. You'll be guided through a step-by-step listing process — upload photos, set your rent price, define amenities, and publish. Your listing goes live instantly after review.",
  },
  {
    id: 2,
    question: "Is the payment system secure?",
    answer:
      "Absolutely. All transactions on PRMS are protected with 256-bit SSL encryption — the same standard used by global banks. We do not store any card details on our servers. Payments are processed through PCI-DSS-compliant gateways, ensuring your financial data is always safe.",
  },
  {
    id: 3,
    question: "How are tenants verified?",
    answer:
      "Every tenant goes through our rigorous KYC (Know Your Customer) process. This includes government-issued identity document verification, BVN checks, employment/income validation, and reference screening. Landlords can view a tenant's verified profile before accepting any application.",
  },
  {
    id: 4,
    question: "What happens if I have a maintenance issue?",
    answer:
      "Submit a maintenance request directly from your Tenant Dashboard by describing the issue and attaching photos if needed. Your landlord is notified instantly via email and in-app alert. You can track the status of your request in real time and communicate with your landlord or assigned service provider through our built-in messaging system.",
  },
  {
    id: 5,
    question: "How do I pay my rent?",
    answer:
      "Rent payments are made directly from your Tenant Dashboard using your preferred payment method — debit/credit card or bank transfer. All payment history is automatically logged and receipts are generated instantly. You can also set up automated reminders so you never miss a due date.",
  },
  {
    id: 6,
    question: "Can I cancel my listing?",
    answer:
      "Yes, landlords can deactivate or remove a property listing at any time from the Landlord Dashboard. Simply navigate to 'My Properties', select the listing, and click 'Deactivate' or 'Delete'. Active tenancy agreements are not affected — you'll be prompted to review any ongoing arrangements before cancellation.",
  },
  {
    id: 7,
    question: "How does the service marketplace work?",
    answer:
      "Our in-app Service Marketplace connects you with pre-vetted, background-checked service providers — plumbers, electricians, cleaners, security personnel, and more. Browse by category, view provider ratings and reviews, request a custom quote, and pay securely in-app once the work is completed. All providers are insured and accountable.",
  },
  {
    id: 8,
    question: "Is PRMS available outside Lagos?",
    answer:
      "Yes! PRMS is now live in 12+ cities across Nigeria including Abuja, Port Harcourt, Ibadan, Kano, Enugu, Kaduna, and more. We're expanding rapidly — new cities are onboarded every quarter. If your city isn't listed yet, you can join our waitlist and we'll notify you the moment we launch near you.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen
          ? "border-blue-500/40 bg-white/[0.06] shadow-lg shadow-blue-900/20"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/20"
      } backdrop-blur-sm`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={`text-base font-semibold leading-snug transition-colors duration-200 ${
            isOpen ? "text-white" : "text-blue-100/80 group-hover:text-white"
          }`}
        >
          {faq.question}
        </span>
        <span
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-blue-500/50 bg-blue-600/20 rotate-180"
              : "border-white/15 bg-white/5 group-hover:border-blue-500/40 group-hover:bg-blue-600/10"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors duration-200 ${
              isOpen ? "text-blue-400" : "text-blue-200/60"
            }`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="h-px w-full bg-white/[0.08] mb-4" />
              <p className="text-blue-100/65 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <PublicPageShell
      pageTitle="Frequently Asked Questions"
      pageSubtitle="Everything you need to know about using PRMS as a landlord, tenant, or service provider."
      badge="❓ FAQ"
    >
      {/* ── FAQ Accordion ─────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              index={index}
              isOpen={openId === faq.id}
              onToggle={() => toggle(faq.id)}
            />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-12 px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-[#081A3A] to-violet-950/40 backdrop-blur-sm p-8 md:p-12 text-center"
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-6 mx-auto">
                <HelpCircle className="w-7 h-7 text-blue-400" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3">
                Still have{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  questions?
                </span>
              </h2>
              <p className="text-blue-100/60 text-sm md:text-base mb-8 max-w-md mx-auto">
                Our support team is available Monday–Friday, 8 am–6 pm WAT.
                We typically respond within a few hours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Email link */}
                <a
                  href="mailto:support@prms.ng"
                  className="inline-flex items-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 rounded-xl text-white font-bold px-6 py-3 transition-all duration-200 text-sm"
                >
                  <Mail className="w-4 h-4 text-blue-300" />
                  support@prms.ng
                </a>

                {/* Contact page button */}
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold px-6 py-3 transition-all duration-200 text-sm shadow-lg shadow-blue-900/40"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
