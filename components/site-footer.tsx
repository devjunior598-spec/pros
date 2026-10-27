import Link from "next/link"
import { Logo } from "@/components/logo"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-white to-blue-50/45">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo href="/" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-prms-slate">
            PRMS helps U.S. landlords, tenants, and property teams keep rental operations organized.
          </p>
          <p className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-prms-blue">Built for clearer rental decisions</p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-prms-slate">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-prms-slate">
            <li><Link href="/about" className="transition hover:text-prms-navy">About</Link></li>
            <li><Link href="/features" className="transition hover:text-prms-navy">Features</Link></li>
            <li><Link href="/contact" className="transition hover:text-prms-navy">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-prms-slate">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-prms-slate">
            <li><Link href="/listings" className="transition hover:text-prms-navy">Properties</Link></li>
            <li><Link href="/faq" className="transition hover:text-prms-navy">FAQ</Link></li>
            <li><Link href="/privacy" className="transition hover:text-prms-navy">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-prms-slate">Support</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-prms-slate">
            <li><Link href="/login" className="transition hover:text-prms-navy">Login</Link></li>
            <li><Link href="/signup" className="transition hover:text-prms-navy">Create account</Link></li>
            <li><Link href="/terms" className="transition hover:text-prms-navy">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-border px-4 py-6 text-sm text-prms-slate sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} PRMS. Built for serious property rental management.</span>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-prms-slate/80">United States</span>
      </div>
    </footer>
  )
}
