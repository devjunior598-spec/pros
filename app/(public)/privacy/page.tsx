import { PublicPageShell } from "@/components/public-page-shell";

export default function PrivacyPage() {
  return (
    <PublicPageShell
      pageTitle="Privacy Policy"
      pageSubtitle="Your privacy matters to us. Here's exactly how we collect, use, and protect your data."
      badge="🔒 Privacy"
    >
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Section 1 — Information We Collect */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            To provide you with a secure, personalised, and fully functional property management
            experience, PRMS collects several categories of information. We collect only what is
            necessary for the purposes described in this policy, and we handle all data with the
            highest standards of care.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">Account Information:</span> Your full
              name, email address, and phone number provided at registration.
            </li>
            <li>
              <span className="text-white font-semibold">Property Details:</span> Property
              addresses, descriptions, rental amounts, lease terms, and any associated documents you
              upload to the platform.
            </li>
            <li>
              <span className="text-white font-semibold">Payment Information:</span> Transaction
              records and tokenised payment credentials. We do not store raw card numbers — all
              sensitive payment data is handled exclusively by our certified payment partners.
            </li>
            <li>
              <span className="text-white font-semibold">Device & Usage Data:</span> IP address,
              browser type, operating system, pages visited, time spent on pages, and other
              diagnostic and analytics data generated during your use of the platform.
            </li>
            <li>
              <span className="text-white font-semibold">KYC Documents:</span> Government-issued
              identity documents (such as National ID, Driver's Licence, or International
              Passport) and proof of property ownership, collected from landlords as part of our
              mandatory Know Your Customer verification process.
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 2 — How We Use Your Information */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            We use the information we collect for legitimate, specific purposes related to delivering
            and improving the PRMS platform. Your data is never used for purposes that are
            incompatible with the reason it was collected.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">Provide and improve our services:</span>{" "}
              To operate the platform, personalise your experience, debug issues, and develop new
              features.
            </li>
            <li>
              <span className="text-white font-semibold">Process rent payments:</span> To
              facilitate, record, and reconcile financial transactions between landlords and tenants
              on the platform.
            </li>
            <li>
              <span className="text-white font-semibold">Send notifications:</span> To deliver
              transactional alerts (e.g., payment confirmations, rent reminders, lease renewals) and
              — where you have opted in — product updates and announcements.
            </li>
            <li>
              <span className="text-white font-semibold">Verify identities (KYC):</span> To
              authenticate the identity of landlords and confirm property ownership, ensuring a
              safe and trustworthy environment for all platform participants.
            </li>
            <li>
              <span className="text-white font-semibold">Generate anonymized analytics:</span> To
              understand aggregate usage patterns and make data-driven decisions about platform
              improvements. Individual users are never identifiable in our analytics outputs.
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 3 — Information Sharing */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">3. Information Sharing</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            We do not sell, trade, or rent your personal information to any third party for
            marketing or commercial purposes. Your data is yours, and we treat it that way.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            However, we may share specific information with the following categories of trusted
            third parties, strictly on a need-to-know basis and only to the extent necessary to
            perform their services:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">Payment processors</span> (Paystack and
              Flutterwave): To securely authorise and settle rent payment transactions. These
              partners are bound by their own privacy and data security obligations.
            </li>
            <li>
              <span className="text-white font-semibold">KYC verification partners:</span> To
              validate the identity documents and property ownership records submitted by landlords
              during the onboarding process.
            </li>
            <li>
              <span className="text-white font-semibold">Legal authorities:</span> Where we are
              compelled to do so by applicable law, court order, or government regulation, or where
              disclosure is necessary to protect the rights, property, or safety of PRMS, our users,
              or the public.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            All third parties with whom we share data are contractually required to handle it in
            accordance with applicable data protection laws and to use it only for the purposes for
            which it was disclosed.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 4 — Data Security */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">4. Data Security</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            Protecting your data is a core responsibility we take seriously. PRMS employs a
            multi-layered security architecture designed to safeguard your information against
            unauthorised access, disclosure, alteration, and destruction.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">256-bit TLS encryption in transit:</span>{" "}
              All data transmitted between your device and our servers is encrypted using
              industry-standard Transport Layer Security (TLS 1.2/1.3), ensuring it cannot be
              intercepted in transit.
            </li>
            <li>
              <span className="text-white font-semibold">AES-256 encryption at rest:</span> All
              stored data — including documents, user records, and payment references — is encrypted
              at rest using AES-256, one of the strongest encryption standards available.
            </li>
            <li>
              <span className="text-white font-semibold">Regular security audits:</span> We conduct
              periodic internal and third-party security assessments, including penetration testing
              and vulnerability scanning, to proactively identify and remediate potential weaknesses.
            </li>
            <li>
              <span className="text-white font-semibold">Incident response plan:</span> We maintain
              a documented incident response plan to ensure any security breach is detected,
              contained, and reported promptly, in accordance with applicable data breach
              notification regulations.
            </li>
            <li>
              <span className="text-white font-semibold">Two-factor authentication (2FA):</span>{" "}
              We strongly recommend — and have made available — two-factor authentication for all
              user accounts, adding an additional layer of protection beyond your password.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            While we implement robust security measures, no method of transmission over the internet
            or electronic storage is 100% secure. We encourage users to maintain strong, unique
            passwords and to enable 2FA on their accounts.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 5 — Your Rights */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">5. Your Rights</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            You retain meaningful control over your personal data at all times. As a user of the
            PRMS platform, you have the following rights with respect to your information:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">Right of Access:</span> You may request a
              copy of all personal data we hold about you at any time.
            </li>
            <li>
              <span className="text-white font-semibold">Right to Rectification:</span> If any
              information we hold about you is inaccurate or incomplete, you have the right to
              request that it be corrected.
            </li>
            <li>
              <span className="text-white font-semibold">Right to Erasure:</span> Subject to legal
              retention obligations, you may request the deletion of your personal data and account
              from our systems.
            </li>
            <li>
              <span className="text-white font-semibold">Right to Data Portability:</span> You may
              request a structured, machine-readable export of your personal data.
            </li>
            <li>
              <span className="text-white font-semibold">Right to Object:</span> You may object to
              specific processing activities, such as receiving marketing communications, at any
              time.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            To exercise any of these rights, please submit a written request to{" "}
            <a
              href="mailto:privacy@prms.ng"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              privacy@prms.ng
            </a>
            . We are committed to responding to all valid data subject requests within{" "}
            <span className="text-white font-semibold">30 calendar days</span> of receipt. In
            complex cases, we may require additional time and will notify you accordingly.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 6 — Cookies */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">6. Cookies</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            PRMS uses cookies and similar tracking technologies to enhance the functionality,
            performance, and user experience of the platform. A cookie is a small text file stored
            on your device that helps us recognise you and remember your preferences.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            We use two categories of cookies:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              <span className="text-white font-semibold">Essential cookies:</span> These are
              strictly necessary for the platform to function correctly. They manage your login
              session, maintain authentication state, and ensure security features work as intended.
              These cookies cannot be disabled without significantly impairing your use of the
              platform.
            </li>
            <li>
              <span className="text-white font-semibold">Optional analytics cookies:</span> These
              collect anonymised data about how users interact with the platform — such as pages
              visited and features used — to help us understand usage patterns and improve our
              product. These cookies are entirely optional.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            You can disable optional analytics cookies at any time through your browser settings.
            Most browsers also allow you to delete existing cookies or block cookies from being set
            in the future. Please note that disabling certain cookies may affect the functionality
            of some platform features.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            For further information about how we use cookies or to update your preferences, please
            contact us at{" "}
            <a
              href="mailto:privacy@prms.ng"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              privacy@prms.ng
            </a>
            .
          </p>
        </div>

      </div>
    </PublicPageShell>
  );
}
