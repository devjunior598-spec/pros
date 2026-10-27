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
      "Search and filter rental listings by location, price, size, and amenities.",
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-700",
    border: "border-blue-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Secure Applications",
    description:
      "Submit rental applications and supporting documents through the platform. Review who can access your information before sharing sensitive documents.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-700",
    border: "border-cyan-500/20",
  },
  {
    icon: CreditCard,
    title: "Online Rent Payment",
    description:
      "Track rent activity and payment records. Online payment processing will be available after a U.S. provider is configured.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-700",
    border: "border-violet-500/20",
  },
  {
    icon: Wrench,
    title: "Maintenance Requests",
    description:
      "Log repair requests with photos directly from your dashboard. Follow request status updates from your dashboard.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-700",
    border: "border-emerald-500/20",
  },
];

const landlordFeatures = [
  {
    icon: BarChart3,
    title: "Portfolio Dashboard",
    description:
      "Review your properties, occupancy, recorded rent activity, and maintenance requests from one dashboard.",
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-700",
    border: "border-blue-500/20",
  },
  {
    icon: Users,
    title: "Tenant Management",
    description:
      "View tenant profiles, lease history, payment records, and communication logs in one place. Easily approve, reject, or renew tenancy agreements.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-700",
    border: "border-cyan-500/20",
  },
  {
    icon: FileText,
    title: "Automated Billing",
    description:
      "Set rent schedules and organize reminders, invoices, and payment records in one workspace.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-700",
    border: "border-violet-500/20",
  },
  {
    icon: Globe,
    title: "Service Marketplace",
    description:
      "Browse approved provider profiles when service-provider onboarding is available for your area.",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-700",
    border: "border-orange-500/20",
  },
];

const platformFeatures = [
  {
    icon: BrainCircuit,
    title: "Rental Workspace",
    subtitle: "Practical tools for daily operations",
    description:
      "Property teams can keep listing details, lease records, and rental activity together. Review lease language and local requirements with qualified professionals when needed.",
    badge: "Property Tools",
    badgeBg: "border-violet-500/30 bg-violet-500/10 text-violet-700",
    gradient: "from-violet-50 to-blue-50",
    accent: "text-violet-700",
    flip: false,
  },
  {
    icon: TrendingUp,
    title: "Portfolio Analytics",
    subtitle: "Know your numbers inside and out",
    description:
      "Review portfolio activity, occupancy, payment records, and maintenance trends in the available dashboard views.",
    badge: "Analytics",
    badgeBg: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700",
    gradient: "from-cyan-50 to-blue-50",
    accent: "text-cyan-700",
    flip: true,
  },
  {
    icon: Smartphone,
    title: "Mobile-friendly Website",
    subtitle: "Use PRMS from your phone or desktop",
    description:
      "Open the PRMS website from a phone, tablet, or desktop browser to review listings, messages, and property activity.",
    badge: "Responsive Web",
    badgeBg: "border-blue-500/30 bg-blue-500/10 text-blue-700",
    gradient: "from-blue-50 to-violet-50",
    accent: "text-blue-700",
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

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-700 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              For Tenants
            </span>
          </motion.div>

          <motion.h2
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4"
          >
            Find, Apply &amp;{" "}
            <span className="text-blue-700">
              Live with Confidence
            </span>
          </motion.h2>
          <motion.p
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-slate-700 text-lg max-w-2xl mx-auto mb-16"
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
                  initial={false}
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 3}
                  className={`rounded-2xl border ${feat.border} bg-white hover:bg-white transition-all duration-300 p-6 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg leading-snug">{feat.title}</h3>
                  <p className="text-slate-700 text-base leading-7">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── For Landlords ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-700 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              For Landlords
            </span>
          </motion.div>

          <motion.h2
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4"
          >
            Manage Your Portfolio{" "}
            <span className="text-blue-700">
              Like a Pro
            </span>
          </motion.h2>
          <motion.p
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-slate-700 text-lg max-w-2xl mx-auto mb-16"
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
                  initial={false}
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 3}
                  className={`rounded-2xl border ${feat.border} bg-white hover:bg-white transition-all duration-300 p-6 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg leading-snug">{feat.title}</h3>
                  <p className="text-slate-700 text-base leading-7">{feat.description}</p>
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
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              Platform-Wide
            </span>
          </motion.div>

          <motion.h2
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4"
          >
            Built for{" "}
            <span className="text-blue-700">
              Everyone
            </span>
          </motion.h2>
          <motion.p
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="text-center text-slate-700 text-lg max-w-2xl mx-auto mb-20"
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
                  initial={false}
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
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                      {feat.title}
                    </h3>
                    <p className={`text-base font-semibold ${feat.accent}`}>
                      {feat.subtitle}
                    </p>
                    <p className="text-slate-700 leading-relaxed">{feat.description}</p>
                  </motion.div>

                  {/* Visual card */}
                  <motion.div
                    variants={imgMotion}
                    className={feat.flip ? "lg:col-start-1 lg:row-start-1" : ""}
                  >
                    <div
                      className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${feat.gradient} p-10 flex flex-col items-center justify-center gap-6 min-h-[260px]`}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                        <Icon className={`w-10 h-10 ${feat.accent}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-900 font-bold text-xl">{feat.title}</p>
                        <p className={`text-sm mt-1 ${feat.accent}`}>{feat.subtitle}</p>
                      </div>
                      {/* Decorative dots */}
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, di) => (
                          <div
                            key={di}
                            className={`w-2 h-2 rounded-full ${
                              di === 2 ? "bg-white" : "bg-white"
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
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 border border-slate-200 p-6 sm:p-12 text-center"
          >


            <div className="relative z-10 space-y-6">
              <span className="inline-flex items-center gap-2 border border-blue-400/30 bg-blue-400/10 text-blue-700 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
                Ready to get started?
              </span>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
                Start managing{" "}
                <span className="text-blue-700">
                  smarter
                </span>
              </h2>

              <p className="text-slate-700 text-lg max-w-xl mx-auto">
                Unlock every feature with a free PRMS account. No credit card required
                to get started.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 rounded-xl text-white font-bold px-8 py-3 transition-colors duration-200"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-white rounded-xl text-slate-900 font-bold px-8 py-3 transition-colors duration-200"
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
