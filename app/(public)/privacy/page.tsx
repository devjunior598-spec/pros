export default function PrivacyPage() {
    return (
        <div className="container py-12 md:py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Last Updated: February 11, 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, list a property, or submit a rental application. This may include your name, email address, phone number, and financial information related to rent payments.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide, maintain, and improve our services.</li>
                        <li>Verify user identity and property listings.</li>
                        <li>Facilitate communication between landlords and tenants.</li>
                        <li>Process payments and prevent fraud.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">3. Information Sharing</h2>
                    <p>
                        We share information between landlords and tenants only as necessary to facilitate the rental process. We do not sell your personal information to third parties.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">4. Data Security</h2>
                    <p>
                        We use industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">5. Your Choices</h2>
                    <p>
                        You may update your account information at any time by logging into your account settings. You can also request the deletion of your account by contacting our support team.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">6. Cookies</h2>
                    <p>
                        We use cookies to enhance your experience on our website. You can set your browser to refuse all or some browser cookies, but some parts of the site may then be inaccessible or not function properly.
                    </p>
                </section>
            </div>
        </div>
    )
}
