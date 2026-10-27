import Link from "next/link"
import { ArrowRight, MessageSquare, UserRound } from "lucide-react"
import { PublicPageShell } from "@/components/public-page-shell"

export default function ContactPage() {
  return (
    <PublicPageShell pageTitle="Contact PRMS" pageSubtitle="Get help with your rental account or learn about the U.S. platform." badge="Support">
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-7 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-6 w-6" /></span>
            <h2 className="mt-5 text-xl font-semibold text-prms-navy">Already use PRMS?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to manage your properties, applications, documents, and account settings.</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </article>
          <article className="rounded-2xl border border-border bg-white p-7 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquare className="h-6 w-6" /></span>
            <h2 className="mt-5 text-xl font-semibold text-prms-navy">U.S. launch inquiries</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The previous regional contact details have been removed. Add your verified U.S. support email and phone before publishing this page for customers.</p>
            <Link href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Create an account <ArrowRight className="h-4 w-4" /></Link>
          </article>
        </div>
      </section>
    </PublicPageShell>
  )
}
