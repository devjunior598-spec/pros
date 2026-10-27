import Link from "next/link"
import { ArrowRight, Building2, ClipboardList, Home, Wrench } from "lucide-react"
import { PublicPageShell } from "@/components/public-page-shell"

const capabilities = [
  { icon: Home, title: "Rental listings", text: "Publish U.S. properties with city, state, ZIP code, rent, and home details." },
  { icon: ClipboardList, title: "Applications and leases", text: "Keep rental applications, lease records, and property documents together." },
  { icon: Wrench, title: "Property operations", text: "Track maintenance requests, rent activity, and upcoming lease events." },
  { icon: Building2, title: "Portfolio overview", text: "Give property teams one workspace for buildings, units, and tenants." },
]

export default function AboutPage() {
  return (
    <PublicPageShell
      pageTitle="About PRMS"
      pageSubtitle="A practical workspace for rental property operations in the United States."
      badge="Built for rental teams"
    >
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Our purpose</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-prms-navy sm:text-4xl">
              Make the work behind every rental easier to manage.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              PRMS brings property listings, applications, leases, rent activity, and maintenance into a shared workspace for landlords, tenants, and property teams. The U.S. version uses dollars and U.S. address fields, including state and ZIP code.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Product availability depends on the services configured for each account. Property owners and tenants remain responsible for reviewing their agreements and applicable local requirements.
            </p>
            <Link href="/features" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Explore the platform <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold text-prms-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
