import Link from "next/link"

export function SiteFooter() {
    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800">
            <div className="container py-8 sm:py-12 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <div className="font-bold text-xl uppercase tracking-tighter">PRMS</div>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            The most trusted platform for property management in Nigeria.
                            Built for landlords and tenants who value efficiency and transparency.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/listings" className="hover:text-white transition-colors">Browse Listings</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link href="/signup" className="hover:text-white transition-colors">Join as Landlord</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} PRMS. Owned by JUNIOR PROPERTY TECHNOLOGIES.
                    <br className="sm:hidden" />
                    Built by Junior Dev Tech Solutions.
                </div>
            </div>
        </footer>
    )
}
