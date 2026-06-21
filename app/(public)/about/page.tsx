"use client";

import PublicPageShell from "@/components/public-page-shell";
import { motion } from "motion/react";
import { ShieldCheck, Home, Users, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { label: "Year Founded", value: "2023" },
  { label: "Cities Active", value: "12" },
  { label: "Properties Listed", value: "1,200+" },
  { label: "Happy Users", value: "5,000+" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Security",
    description:
      "Every listing is verified by our team before going live. We use end-to-end encryption and identity checks to protect both tenants and landlords.",
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: Home,
    title: "Quality Listings",
    description:
      "We hold every property to a strict quality standard — accurate photos, honest descriptions, and fair pricing are non-negotiable on PRMS.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "PRMS is built on the relationships between neighbours, landlords, and tenants. We foster a community where everyone feels respected and heard.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    icon: Target,
    title: "Transparency",
    description:
      "No hidden fees. No surprise charges. Our pricing, processes, and policies are always clear so you can make informed decisions with confidence.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
  },
];

const team = [
  {
    initials: "CO",
    name: "Chinedu Okeke",
    role: "CEO & Co-Founder",
    bio: "Former real-estate attorney with 10 years of experience navigating Lagos property law. Chinedu founded PRMS after witnessing firsthand how broken the rental market was for everyday Nigerians.",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    initials: "AY",
    name: "Amina Yusuf",
    role: "CTO",
    bio: "Full-stack engineer and ex-Andela fellow who led product engineering at two fintech startups. Amina architects every technical layer of PRMS — from the API to the mobile app.",
    gradient: "from-violet-600 to-blue-500",
  },
  {
    initials: "DO",
    name: "David Olatunji",
    role: "Head of Operations",
    bio: "Logistics and operations specialist who scaled operations at a leading Nigerian logistics firm. David oversees agent onboarding, property verification, and customer success across all 12 cities.",
    gradient: "from-cyan-600 to-emerald-500",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.1 },
  }),
};

export default function AboutPage() {
  return (
    <PublicPageShell
      pageTitle="About PRMS"
      pageSubtitle="Building Nigeria's most trusted property management platform, one verified listing at a time."
      badge="🏢 Our Story"
    >
      {/* ── Mission ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-700/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-violet-700/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              Our Mission
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-16"
          >
            Reimagining{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Rental Experiences
            </span>{" "}
            in Nigeria
          </motion.h2>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — founding story */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
              className="space-y-5 text-blue-100/70 text-[1.05rem] leading-relaxed"
            >
              <p>
                PRMS was born in Lagos in 2023 out of a simple frustration: finding a
                decent, verified rental property in Nigeria was unnecessarily painful.
                Listings were fake, agents were unreliable, and tenants had no recourse
                when things went wrong.
              </p>
              <p>
                Our founders decided to build the platform they wished had existed.
                PRMS started as a small directory of verified Lekki apartments and has
                since grown into a full property management ecosystem spanning 12
                Nigerian cities.
              </p>
              <p>
                Today PRMS handles everything from the first listing photo to the final
                rent receipt. We verify every property, screen every landlord, and give
                tenants the tools to pay securely, raise maintenance issues, and renew
                leases — all without leaving the platform.
              </p>
              <p>
                We believe property management in Africa deserves the same level of
                trust and polish as the best global platforms. That belief drives every
                feature we ship.
              </p>
            </motion.div>

            {/* Right — stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 2}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-colors duration-300 p-6 flex flex-col items-center justify-center text-center"
                >
                  <p className="text-4xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-blue-100/60 text-sm font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
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
              What We Stand For
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl font-black tracking-tight text-white mb-14"
          >
            Our Core{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Values
            </span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, i) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={val.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 2}
                  className={`rounded-2xl border ${val.border} bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 p-6 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${val.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${val.iconColor}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg">{val.title}</h3>
                  <p className="text-blue-100/60 text-sm leading-relaxed">{val.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
              The People Behind PRMS
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="text-center text-3xl md:text-4xl font-black tracking-tight text-white mb-14"
          >
            Meet Our{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Founding Team
            </span>
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 p-8 flex flex-col items-center text-center gap-4"
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                  {member.initials}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{member.name}</h3>
                  <p className="text-blue-400 text-sm font-semibold mt-0.5">{member.role}</p>
                </div>
                <p className="text-blue-100/60 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700/40 via-blue-800/30 to-violet-800/40 border border-white/10 backdrop-blur-sm p-12 text-center"
          >
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <span className="inline-flex items-center gap-2 border border-blue-400/30 bg-blue-400/10 text-blue-300 text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-widest">
                Get Started Today
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Ready to join{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  PRMS?
                </span>
              </h2>
              <p className="text-blue-100/70 text-lg max-w-xl mx-auto">
                Join thousands of tenants and landlords already using Nigeria's most
                trusted property management platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold px-8 py-3 transition-colors duration-200"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 rounded-xl text-white font-bold px-8 py-3 transition-colors duration-200"
                >
                  Browse Properties
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
