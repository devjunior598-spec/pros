"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Building2, Home, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const choices = [
  { title: "Single Unit Property", description: "One apartment, one house, one room, one duplex or one independent rental.", href: "/dashboard/properties/add/single", icon: Home, accent: "from-blue-600 to-cyan-500", bullets: ["One rental agreement", "Individual pricing", "Fast listing setup"] },
  { title: "Multi-Unit Property", description: "Apartment buildings, estates, hostels, shopping plazas, office buildings and commercial properties.", href: "/dashboard/properties/add/multi", icon: Building2, accent: "from-indigo-600 to-blue-600", bullets: ["Unlimited rental units", "Building-level amenities", "Portfolio analytics"] },
]

export function PropertyTypeSelection() {
  return <div className="mx-auto max-w-5xl space-y-8 pb-16">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-7 text-white shadow-xl sm:p-10">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="relative max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium"><Sparkles className="h-3.5 w-3.5" />Professional property setup</div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What would you like to list?</h1><p className="mt-3 text-blue-100">Choose the workflow that matches your property. You can manage every listing from the same PRMS portfolio.</p></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">{choices.map((choice, index) => <motion.div key={choice.title} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:index*.08}} whileHover={{y:-4}} className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-xl"><div className={`h-2 bg-gradient-to-r ${choice.accent}`} /><div className="p-6 sm:p-8"><div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${choice.accent} text-white shadow-lg`}><choice.icon className="h-8 w-8" /></div><h2 className="text-2xl font-bold">{choice.title}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{choice.description}</p><div className="my-6 space-y-2 border-y py-5">{choice.bullets.map((bullet) => <div key={bullet} className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-blue-600" />{bullet}</div>)}</div><Button asChild size="lg" className="w-full"><Link href={choice.href}>Continue <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></Button></div></motion.div>)}</div>
  </div>
}
