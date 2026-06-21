"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  Send,
  Zap,
} from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";

const contactDetails = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support@prms.ng",
    href: "mailto:support@prms.ng",
    color: "blue" as const,
    iconBg: "bg-blue-600/20",
    iconBorder: "border-blue-500/30",
    iconColor: "text-blue-400",
    hoverBorder: "hover:border-blue-500/30",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+234 800 PRMS NG",
    href: "tel:+2348007767764",
    color: "emerald" as const,
    iconBg: "bg-emerald-600/20",
    iconBorder: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/30",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
    href: "https://maps.google.com/?q=14+Admiralty+Way+Lekki+Phase+1+Lagos",
    color: "violet" as const,
    iconBg: "bg-violet-600/20",
    iconBorder: "border-violet-500/30",
    iconColor: "text-violet-400",
    hoverBorder: "hover:border-violet-500/30",
  },
];

const subjects = [
  { value: "", label: "Select a subject…" },
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
  { value: "report", label: "Report an Issue" },
];

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate async submission
    await new Promise((res) => setTimeout(res, 1800));
    setLoading(false);
    setSuccess(true);
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/30 focus:outline-none focus:border-blue-500 focus:bg-white/[0.07] transition-all duration-200 text-sm";

  const labelClass = "block text-xs font-semibold text-blue-200/60 mb-1.5 uppercase tracking-wider";

  return (
    <PublicPageShell
      pageTitle="Get In Touch"
      pageSubtitle="Our team is here to help. Reach out for support, partnerships, or general inquiries."
      badge="📬 Contact"
    >
      <section className="py-16 px-4 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">

            {/* ── Left column: contact info ─────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              {contactDetails.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
                  className={`flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm ${item.hoverBorder} hover:bg-white/[0.07] transition-all duration-200 group block`}
                >
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${item.iconBg} border ${item.iconBorder}`}
                  >
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-200/50 uppercase tracking-wider mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-white/90 text-sm font-medium group-hover:text-white transition-colors duration-200 leading-snug">
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              ))}

              {/* Response time badge */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
                className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] backdrop-blur-sm"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/25">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-amber-300/90 text-sm font-semibold">
                  ⚡ We reply within{" "}
                  <span className="text-amber-300">24 hours</span>
                </p>
              </motion.div>

              {/* Decorative card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
                className="relative overflow-hidden rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-900/30 to-violet-900/20 backdrop-blur-sm p-6 mt-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <p className="text-sm text-blue-100/60 leading-relaxed relative z-10">
                  Whether you're a landlord, tenant, or service provider — our
                  support team is ready to guide you through every step of your
                  PRMS journey.
                </p>
              </motion.div>
            </div>

            {/* ── Right column: contact form ────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-8">
                {!success ? (
                  <>
                    <div className="mb-7">
                      <h3 className="text-xl font-black tracking-tight text-white mb-1">
                        Send us a{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          message
                        </span>
                      </h3>
                      <p className="text-blue-200/50 text-sm">
                        Fill in the form below and we'll get back to you shortly.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="name" className={labelClass}>
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="e.g. Adaeze Okonkwo"
                          value={form.name}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>

                      {/* Subject */}
                      <div>
                        <label htmlFor="subject" className={labelClass}>
                          Subject
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={form.subject}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none cursor-pointer`}
                        >
                          {subjects.map((s) => (
                            <option
                              key={s.value}
                              value={s.value}
                              disabled={s.value === ""}
                              className="bg-[#0d2255] text-white"
                            >
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label htmlFor="message" className={labelClass}>
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          placeholder="Tell us how we can help you…"
                          value={form.message}
                          onChange={handleChange}
                          className={`${inputClass} resize-none`}
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white font-bold px-6 py-3.5 transition-all duration-200 shadow-lg shadow-blue-900/40 text-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* ── Success state ── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white mb-3">
                      Message Sent!
                    </h3>
                    <p className="text-blue-100/60 text-sm leading-relaxed max-w-xs mb-8">
                      Thanks for reaching out. Our team has received your message
                      and will respond to{" "}
                      <span className="text-blue-300 font-medium">
                        {form.email}
                      </span>{" "}
                      within 24 hours.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 text-xs font-semibold">
                        We typically reply in a few hours
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setForm(initialForm);
                      }}
                      className="mt-8 inline-flex items-center gap-2 border border-white/15 bg-white/8 hover:bg-white/12 rounded-xl text-white/80 hover:text-white font-semibold px-5 py-2.5 transition-all duration-200 text-sm"
                    >
                      Send another message
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
