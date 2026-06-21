"use client";

import { PublicPageShell } from "@/components/public-page-shell";
import { motion, type Variants } from "motion/react";
import {
  Search,
  ShieldCheck,
  CreditCard,
  Wrench,
  BarChart3,
  Users,
  FileText,
  Globe,
  BrainCircuit,
  TrendingUp,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const tenantFeatures = [
  {
    icon: Search,
    title: "Smart Property Search",
    description:
      "AI-powered filters let you find verified properties by location, price, size, and amenities in seconds — no more scrolling through fake listings.",
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Secure Applications",
    description:
      "Submit rental applications with encrypted documents. Your personal data is protected at every step and shared only with verified landlords.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    icon: CreditCard,
    title: "Online Rent Payment",
    description:
      "Pay rent securely via card, bank transfer, or USSD directly on the platform. Get instant receipts and payment history — no more cash disputes.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    icon: Wrench,
    title: "Maintenance Requests",
    description:
      "Log repair requests with photos directly from your dashboard. Track status updates in real time and get notified when your issue is resolved.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
  },
];

const landlordFeatures = [
  {
    icon: BarChart3,
    title: "Portfolio Dashboard",
    description:
      "See all your properties, occupancy rates, revenue, and maintenance tickets in one unified dashboard — with real-time data refreshed every minute.",
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: Users,
    title: "Tenant Management",
    description:
      "View tenant profiles, lease history, payment records, and communication logs in one place. Easily approve, reject, or renew tenancy agreements.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    icon: FileText,
    title: "Automated Billing",
    description:
      "Set up rent schedules once and let PRMS handle reminders, invoicing, and receipts automatically. Reduce late payments by up to 40%.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    icon: Globe,
    title: "Service Marketplace",
    description:
      "Access a vetted network of plumbers, electricians, painters, and cleaners directly through the platform to fulfill maintenance requests fast.",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    border: "border-orange-500/20",
  },
];

const platformFeatures = [
  {
    icon: BrainCircuit,
    title: "AI Assistant",
    subtitle: "Smarter decisions, powered by data",
    description:
      "Our built-in AI assistant helps landlords price properties competitively, flags suspicious tenant behaviour, and helps tenants understand lease clauses in plain language. It learns from millions of Nigerian rental data points to give you contextual, accurate advice.",
    badge: "AI-Powered",
    badgeBg: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    gradient: "from-violet-600/20 to-blue-600/10",
    accent: "text-violet-400",
    flip: false,
  },
  {
    icon: TrendingUp,
    title: "Real-time Analytics",
    subtitle: "Know your numbers inside and out",
    description:
      "Track occupancy trends, rental yield, payment performance, and maintenance costs with interactive charts. Export reports for accountants or investors in one click. Set KPIs and get weekly email summaries of your portfolio health.",
    badge: "Analytics",
    badgeBg: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    gradient: "from-cyan-600/20 to-blue-600/10",
    accent: "text-cyan-400",
    flip: true,
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    subtitle: "Full power in your pocket",
    description:
      "The PRMS mobile app for iOS and Android gives you instant access to your dashboard, tenant messages, payment notifications, and maintenance updates. Landlords can approve applications and respond to issues on the go — no laptop required.",
    badge: "iOS & Android",
    badgeBg: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    gradient: "from-blue-600/20 to-violet-600/10",
    accent: "text-blue-400",
    flip: false,
  },
];

// ─── Animation ────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const, delay: i * 0.1 },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <PublicPageShell
      pageTitle="Platform Features"
      pageSubtitle="Everything you need to manage, rent, and grow your property portfolio in one powerful platform."
      badge="⚡ Features"
    >
      {/* ── For Tenants ───────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-700/10 blur-3xl" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              For Tenants
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4"
          >
            Find, Apply &amp;{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Live with Confidence
            </span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-blue-100/60 text-lg max-w-2xl mx-auto mb-16"
          >
            PRMS removes every friction point from renting — from discovery to move-in
            and beyond.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tenantFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 3}
                  className={`rounded-2xl border ${feat.border} bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 p-6 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg leading-snug">{feat.title}</h3>
                  <p className="text-blue-100/60 text-sm leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── For Landlords ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              For Landlords
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4"
          >
            Manage Your Portfolio{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Like a Pro
            </span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-blue-100/60 text-lg max-w-2xl mx-auto mb-16"
          >
            From a single apartment to a 50-unit complex, PRMS scales with your
            ambitions.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {landlordFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 3}
                  className={`rounded-2xl border ${feat.border} bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 p-6 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg leading-snug">{feat.title}</h3>
                  <p className="text-blue-100/60 text-sm leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Platform-wide ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              Platform-Wide
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4"
          >
            Built for{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Everyone
            </span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-blue-100/60 text-lg max-w-2xl mx-auto mb-20"
          >
            Platform-level capabilities that power both sides of the rental
            relationship.
          </motion.p>

          <div className="space-y-16">
            {platformFeatures.map((feat, i) => {
              const Icon = feat.icon;
              const textMotion = feat.flip ? fadeInRight : fadeIn;
              const imgMotion = feat.flip ? fadeIn : fadeInRight;

              return (
                <motion.div
                  key={feat.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className={`grid lg:grid-cols-2 gap-10 items-center ${
                    feat.flip ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Text */}
                  <motion.div
                    variants={textMotion}
                    className={`space-y-5 ${feat.flip ? "lg:col-start-2" : ""}`}
                  >
                    <span
                      className={`inline-flex items-center gap-2 border text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest ${feat.badgeBg}`}
                    >
                      {feat.badge}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      {feat.title}
                    </h3>
                    <p className={`text-base font-semibold ${feat.accent}`}>
                      {feat.subtitle}
                    </p>
                    <p className="text-blue-100/65 leading-relaxed">{feat.description}</p>
                  </motion.div>

                  {/* Visual card */}
                  <motion.div
                    variants={imgMotion}
                    className={feat.flip ? "lg:col-start-1 lg:row-start-1" : ""}
                  >
                    <div
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${feat.gradient} backdrop-blur-sm p-10 flex flex-col items-center justify-center gap-6 min-h-[260px]`}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
                        <Icon className={`w-10 h-10 ${feat.accent}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-xl">{feat.title}</p>
                        <p className={`text-sm mt-1 ${feat.accent}`}>{feat.subtitle}</p>
                      </div>
                      {/* Decorative dots */}
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, di) => (
                          <div
                            key={di}
                            className={`w-2 h-2 rounded-full ${
                              di === 2 ? "bg-white/60" : "bg-white/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700/40 via-blue-800/30 to-cyan-800/30 border border-white/10 backdrop-blur-sm p-12 text-center"
          >
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <span className="inline-flex items-center gap-2 border border-blue-400/30 bg-blue-400/10 text-blue-300 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
                Ready to get started?
              </span>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Start managing{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  smarter
                </span>
              </h2>

              <p className="text-blue-100/70 text-lg max-w-xl mx-auto">
                Unlock every feature with a free PRMS account. No credit card required
                to get started.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold px-8 py-3 transition-colors duration-200"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 rounded-xl text-white font-bold px-8 py-3 transition-colors duration-200"
                >
                  Browse Listings
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
