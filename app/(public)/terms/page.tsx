import { PublicPageShell } from "@/components/public-page-shell";

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
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
          <p className="text-slate-700 text-base leading-7">
            PRMS (Property & Rent Management System) is a platform owned and operated by{" "}
            <span className="text-slate-900 font-semibold">Junior Property Technologies</span>. By
            accessing or using the PRMS platform — including our website, mobile application, and
            associated services — you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service and all applicable laws and regulations. If you do not
            agree with any part of these terms, you are prohibited from using or accessing this
            platform. These terms constitute a legally binding agreement between you and Junior
            Property Technologies.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            <span className="text-slate-700 font-medium">Last Updated:</span>{" "}
            <span className="text-slate-900">October 26, 2026</span>
          </p>
        </div>

        <div className="border-t border-slate-200 mb-10" />

        {/* Section 2 — Use of License */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Use of License</h2>
          <p className="text-slate-700 text-base leading-7">
            Subject to your compliance with these Terms, Junior Property Technologies grants you a
            limited, non-exclusive, non-transferable, revocable license to access and use the PRMS
            platform solely for lawful personal or commercial property management purposes. This
            license covers browsing, publishing, and inquiring about property listings, as well as
            managing real estate properties, tenancies, and associated rent records. PRMS does not
            process property sale payments or create purchase contracts.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            The following actions are expressly prohibited under this license:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700 text-base leading-7">
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
          <p className="text-slate-700 text-base leading-7 mt-3">
            Any breach of this license will result in the immediate termination of your account and
            may subject you to legal liability.
          </p>
        </div>

        <div className="border-t border-slate-200 mb-10" />

        {/* Section 3 — User Responsibilities */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Responsibilities</h2>
          <p className="text-slate-700 text-base leading-7">
            All users of the PRMS platform bear personal responsibility for the accuracy, legality,
            and integrity of the information they provide. By registering and using the platform,
            you agree to the following obligations:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700 text-base leading-7">
            <li>
              You must provide accurate, current, and complete information during registration and
              keep your profile details up to date at all times.
            </li>
            <li>
              <span className="text-slate-900 font-semibold">Landlords</span> are required to complete
              the Know Your Customer (KYC) verification process before listing any property or
              receiving payments through the platform. Failure to complete KYC will result in
              restricted access to key platform features.
            </li>
            <li>
              <span className="text-slate-900 font-semibold">Tenants</span> are solely responsible for
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
          <p className="text-slate-700 text-base leading-7 mt-3">
            Junior Property Technologies reserves the right to suspend or permanently terminate any
            account found to be in violation of these responsibilities, without prior notice and
            without liability to you.
          </p>
        </div>

        <div className="border-t border-slate-200 mb-10" />

        {/* Section 4 — Payment Terms */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Payment Terms</h2>
          <p className="text-slate-700 text-base leading-7">
            Payment processing is available only when a supported U.S. payment provider is enabled
            for the account. Until then, users should follow the payment instructions in their rental
            agreement. Any enabled processor will present its own terms before a transaction.
          </p>
          <p className="mt-3 text-slate-700 text-base leading-7">
            Fees, payment methods, refunds, and dispute handling must be shown in the applicable
            transaction and rental agreement before U.S. payment processing is enabled.
          </p>
        </div>

        <div className="border-t border-slate-200 mb-10" />

        {/* Section 5 — Limitation of Liability */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Limitation of Liability</h2>
          <p className="text-slate-700 text-base leading-7">
            PRMS acts solely as a technology platform that facilitates connections between landlords
            and tenants, and is not a party to any tenancy agreement, lease, or property
            transaction. Accordingly, Junior Property Technologies shall not be liable for any
            disputes, disagreements, losses, or damages arising between landlords and tenants, or
            related to any property listed on the platform.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            The PRMS platform is provided on an{" "}
            <span className="text-slate-900 font-semibold">"as is"</span> and{" "}
            <span className="text-slate-900 font-semibold">"as available"</span> basis, without
            warranties of any kind, whether express or implied. Junior Property Technologies
            expressly disclaims all implied warranties including, but not limited to, implied
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            To the maximum extent permitted by applicable law, the total cumulative liability of
            Junior Property Technologies to any user for any claim arising under or related to
            these Terms — whether in contract, tort, statute, or any other theory — shall not
            exceed the total fees actually paid by that user to PRMS in the{" "}
            <span className="text-slate-900 font-semibold">three (3) calendar months</span> immediately
            preceding the event giving rise to such claim.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            In no event shall Junior Property Technologies be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, goodwill,
            or business interruption, even if advised of the possibility of such damages.
          </p>
        </div>

        <div className="border-t border-slate-200 mb-10" />

        {/* Section 6 — Governing Law */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. Governing Law</h2>
          <p className="text-slate-700 text-base leading-7">
            These draft terms are intended for U.S. use and remain subject to applicable federal,
            state, and local law. Rental and consumer requirements vary by location. The platform
            operator should have this section reviewed and completed for its U.S. place of business
            before customer launch.
          </p>
          <p className="text-slate-700 text-base leading-7 mt-3">
            If you have any questions regarding these Terms of Service, please contact us at{" "}
            <a
              href="/contact"
              className="text-cyan-700 hover:text-cyan-700 underline underline-offset-2 transition-colors"
            >
              contact page
            </a>
            .
          </p>
        </div>

      </div>
    </PublicPageShell>
  );
}
