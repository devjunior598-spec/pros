import PublicPageShell from "@/components/public-page-shell";

export default function TermsPage() {
  return (
    <PublicPageShell
      pageTitle="Terms of Service"
      pageSubtitle="Please read these terms carefully before using the PRMS platform."
      badge="📋 Legal"
    >
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Section 1 — Introduction */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            PRMS (Property & Rent Management System) is a platform owned and operated by{" "}
            <span className="text-white font-semibold">Junior Property Technologies</span>. By
            accessing or using the PRMS platform — including our website, mobile application, and
            associated services — you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service and all applicable laws and regulations. If you do not
            agree with any part of these terms, you are prohibited from using or accessing this
            platform. These terms constitute a legally binding agreement between you and Junior
            Property Technologies.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            <span className="text-blue-200/50 font-medium">Last Updated:</span>{" "}
            <span className="text-white">February 11, 2026</span>
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 2 — Use of License */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">2. Use of License</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            Subject to your compliance with these Terms, Junior Property Technologies grants you a
            limited, non-exclusive, non-transferable, revocable license to access and use the PRMS
            platform solely for lawful personal or commercial property management purposes. This
            license is strictly limited to managing, tracking, and administering real estate
            properties, tenancies, and associated rent payments.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            The following actions are expressly prohibited under this license:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>Reselling, sublicensing, or redistributing access to the platform or its data.</li>
            <li>
              Scraping, crawling, or systematically extracting content or data from the platform by
              any automated means.
            </li>
            <li>
              Reverse engineering, decompiling, disassembling, or attempting to derive the source
              code of any part of the platform.
            </li>
            <li>
              Using the platform to build a competing product or service, or to benchmark it against
              a competing product.
            </li>
            <li>
              Modifying, adapting, or creating derivative works based on the platform or its
              underlying technology.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            Any breach of this license will result in the immediate termination of your account and
            may subject you to legal liability.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 3 — User Responsibilities */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">3. User Responsibilities</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            All users of the PRMS platform bear personal responsibility for the accuracy, legality,
            and integrity of the information they provide. By registering and using the platform,
            you agree to the following obligations:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              You must provide accurate, current, and complete information during registration and
              keep your profile details up to date at all times.
            </li>
            <li>
              <span className="text-white font-semibold">Landlords</span> are required to complete
              the Know Your Customer (KYC) verification process before listing any property or
              receiving payments through the platform. Failure to complete KYC will result in
              restricted access to key platform features.
            </li>
            <li>
              <span className="text-white font-semibold">Tenants</span> are solely responsible for
              making rent payments on or before the agreed due dates. Habitual late payments may
              negatively impact your tenant profile and standing on the platform.
            </li>
            <li>
              You must not impersonate any other person or entity, or misrepresent your affiliation
              with any person or organisation.
            </li>
            <li>
              You must not use the platform to engage in fraud, harassment, unlawful discrimination,
              or any activity that violates applicable law.
            </li>
          </ul>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            Junior Property Technologies reserves the right to suspend or permanently terminate any
            account found to be in violation of these responsibilities, without prior notice and
            without liability to you.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 4 — Payment Terms */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">4. Payment Terms</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            All rent payments and financial transactions facilitated through PRMS are processed via
            secure, PCI-DSS-compliant payment gateways. By initiating a payment on the platform,
            you authorise PRMS to transmit your payment details to our designated payment
            processors for the purpose of completing that transaction.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-blue-100/70 text-sm leading-relaxed">
            <li>
              PRMS charges a small service fee per transaction to cover payment processing and
              platform operational costs. The exact fee amount will always be clearly displayed to
              you on the payment confirmation screen before you authorise any payment.
            </li>
            <li>
              All fees are non-refundable except in cases where a transaction fails due to a
              confirmed platform error, in which case a full refund of any incorrectly charged fees
              will be processed within 5–7 business days.
            </li>
            <li>
              PRMS does not store full payment card numbers. All sensitive payment data is tokenised
              and handled exclusively by our certified payment partners.
            </li>
            <li>
              You agree that all payment disputes between landlords and tenants are the
              responsibility of the respective parties and must be resolved directly, subject to the
              Limitation of Liability section below.
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 5 — Limitation of Liability */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            PRMS acts solely as a technology platform that facilitates connections between landlords
            and tenants, and is not a party to any tenancy agreement, lease, or property
            transaction. Accordingly, Junior Property Technologies shall not be liable for any
            disputes, disagreements, losses, or damages arising between landlords and tenants, or
            related to any property listed on the platform.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            The PRMS platform is provided on an{" "}
            <span className="text-white font-semibold">"as is"</span> and{" "}
            <span className="text-white font-semibold">"as available"</span> basis, without
            warranties of any kind, whether express or implied. Junior Property Technologies
            expressly disclaims all implied warranties including, but not limited to, implied
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            To the maximum extent permitted by applicable law, the total cumulative liability of
            Junior Property Technologies to any user for any claim arising under or related to
            these Terms — whether in contract, tort, statute, or any other theory — shall not
            exceed the total fees actually paid by that user to PRMS in the{" "}
            <span className="text-white font-semibold">three (3) calendar months</span> immediately
            preceding the event giving rise to such claim.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            In no event shall Junior Property Technologies be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, goodwill,
            or business interruption, even if advised of the possibility of such damages.
          </p>
        </div>

        <div className="border-t border-white/10 mb-10" />

        {/* Section 6 — Governing Law */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">6. Governing Law</h2>
          <p className="text-blue-100/70 text-sm leading-relaxed">
            These Terms of Service and any dispute or claim arising out of or in connection with
            them (including non-contractual disputes or claims) shall be governed by and construed
            in accordance with the laws of the{" "}
            <span className="text-white font-semibold">Federal Republic of Nigeria</span>, without
            regard to its conflict of law principles.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            Any legal action or proceeding arising under or relating to these Terms shall be brought
            exclusively in the courts of{" "}
            <span className="text-white font-semibold">Lagos State, Nigeria</span>, and both
            parties irrevocably consent to the personal jurisdiction and venue of such courts. You
            waive any objection to the laying of venue of any such proceeding in Lagos State and
            any objection that Lagos State is an inconvenient or inappropriate forum.
          </p>
          <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
            If you have any questions regarding these Terms of Service, please contact us at{" "}
            <a
              href="mailto:legal@prms.ng"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              legal@prms.ng
            </a>
            .
          </p>
        </div>

      </div>
    </PublicPageShell>
  );
}
