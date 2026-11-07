"use client";

export default function TermsContent() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12" style={{ color: "var(--text)" }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--sunset-warm)" }}>
        Terms of Service
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Last updated: November 2, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            1. Who We Are
          </h2>
          <p>
            The Mall of Projects (&quot;The Mall,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by{" "}
            <strong style={{ color: "var(--text)" }}>LFH Productions LLC</strong>, doing business as
            The Mall of Projects. The Mall is a social platform that provides storefront space and
            community features for creators, builders, and entrepreneurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            2. Agreement to Terms
          </h2>
          <p>
            By creating an account, subscribing to any plan, or using The Mall in any way, you agree
            to be bound by these Terms of Service, our{" "}
            <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a>, and all
            applicable laws and regulations. If you do not agree to these terms, do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            3. The Platform
          </h2>
          <p className="mb-3">The Mall consists of two areas:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong style={{ color: "var(--text)" }}>The Floor</strong> — a human-only social
              space. No AI agents, bots, or automated accounts are permitted in the public feed.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Stores</strong> — individual storefronts
              leased by Store Owners. Each store is independently operated by its owner.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            4. Accounts &amp; Eligibility
          </h2>
          <p className="mb-3">
            You must be at least 13 years old to create an account. You must provide a valid email
            address and create a password. You are responsible for maintaining the security of your
            account credentials. You are responsible for all activity that occurs under your account.
          </p>
          <p>
            After registration, you may build a profile as either a{" "}
            <strong style={{ color: "var(--text)" }}>Shopper</strong> or a{" "}
            <strong style={{ color: "var(--text)" }}>Store Owner</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            5. Subscriptions &amp; Billing
          </h2>
          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Plans</h3>
          <p className="mb-3">The Mall offers the following subscription plans:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong style={{ color: "var(--text)" }}>Shopper — Mall+:</strong> $9.99/month. Unlocks commenting, messaging, following, and full shared-space access.</li>
            <li><strong style={{ color: "var(--text)" }}>Store Owner — Connect Existing:</strong> $19.99/month, $99.99/6 months, or $149.99/year. Link an existing project to The Mall.</li>
            <li><strong style={{ color: "var(--text)" }}>Store Owner — Start Fresh:</strong> $29.99/month. Includes a blank store page and an AI-powered building assistant.</li>
          </ul>

          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Auto-Renewal</h3>
          <p className="mb-4">
            <strong style={{ color: "var(--text)" }}>All subscriptions automatically renew</strong> at
            the end of each billing period at the then-current rate. By subscribing, you authorize
            The Mall to charge your payment method on a recurring basis. You will be charged at the
            beginning of each renewal period.
          </p>

          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Cancellation</h3>
          <p className="mb-4">
            You may cancel your subscription at any time through your Stripe billing portal. Upon
            cancellation, your subscription remains active through the end of your current paid
            period. After that, your access to paid features will end. Store Owners who cancel will
            have their store taken offline at the end of their paid period.
          </p>

          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Refunds</h3>
          <p className="mb-4">
            <strong style={{ color: "var(--text)" }}>All subscription payments are non-refundable</strong>,
            except where required by law. If you believe you were charged in error, contact us
            within 7 days of the charge.
          </p>

          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Price Changes</h3>
          <p>
            We may change subscription pricing at any time. Existing subscribers will be notified at
            least 30 days before any price increase takes effect. Continued use after the price
            change constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            6. Store Leases &amp; Store Owner Responsibilities
          </h2>
          <p className="mb-3">
            Store Owners pay a recurring subscription (&quot;lease&quot;) to operate a storefront on
            The Mall.
          </p>
          <p className="mb-3">
            <strong style={{ color: "var(--text)" }}>
              The Mall does not process, manage, or take any portion of transactions that occur
              within your store.
            </strong>{" "}
            Store Owners connect their own payment processors and are solely responsible for their
            own sales, refunds, taxes, and compliance.
          </p>
          <p className="mb-3">As a Store Owner, you are responsible for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All products, services, and content listed in your store</li>
            <li>Your own payment processing, refunds, and customer disputes</li>
            <li>Compliance with all applicable laws, regulations, and tax obligations</li>
            <li>Any AI or LLM tools you connect to build or operate your store</li>
            <li>Ensuring your store does not contain illegal, fraudulent, harmful, or infringing content</li>
            <li>Maintaining accurate and non-deceptive product or service descriptions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            7. Disclaimer of Third-Party Transactions
          </h2>
          <p className="mb-3" style={{ color: "var(--text)" }}>
            <strong>
              THE MALL IS A PLATFORM, NOT A PARTY TO ANY TRANSACTION BETWEEN STORE OWNERS AND
              THEIR CUSTOMERS.
            </strong>
          </p>
          <p className="mb-3">
            We do not control, endorse, or guarantee the quality, safety, legality, or accuracy of
            any product, service, listing, or content provided by Store Owners. We are not responsible
            for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Any transaction, purchase, or payment between you and a Store Owner</li>
            <li>Product quality, delivery, defects, or misrepresentation</li>
            <li>Refunds, returns, or chargebacks related to store transactions</li>
            <li>Any dispute between a Store Owner and their customer</li>
            <li>Any loss, damage, or injury arising from products or services sold through a store</li>
          </ul>
          <p className="mt-3">
            Any dispute regarding a store transaction must be resolved directly between the Store
            Owner and the customer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            8. Prohibited Conduct
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deploying AI agents, bots, or automated accounts on The Floor</li>
            <li>Selling illegal goods or services</li>
            <li>Harassment, hate speech, or threats</li>
            <li>Spam, scams, or deceptive practices</li>
            <li>Impersonating other users or entities</li>
            <li>Attempting to circumvent platform security or access controls</li>
            <li>Scraping, crawling, or automated data collection without authorization</li>
            <li>Posting content that infringes on intellectual property rights</li>
            <li>Using The Mall to facilitate money laundering or fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            9. Content &amp; Intellectual Property
          </h2>
          <p className="mb-3">
            You retain ownership of all content you post or upload to The Mall. By posting content
            on The Floor or in your store, you grant The Mall a non-exclusive, royalty-free,
            worldwide license to display, reproduce, and distribute that content on the platform.
            We do not claim ownership of your work.
          </p>
          <p>
            We reserve the right to remove any content that violates these terms without notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            10. DMCA / Copyright
          </h2>
          <p>
            If you believe content on The Mall infringes your copyright, contact us with a
            description of the copyrighted work, the location of the infringing content on our
            platform, and your contact information. We will review and act on valid takedown
            requests in accordance with the Digital Millennium Copyright Act (DMCA).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            11. Indemnification
          </h2>
          <p>
            You agree to indemnify, defend, and hold harmless LFH Productions LLC, its officers,
            directors, employees, and agents from and against any and all claims, damages, losses,
            liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of
            or related to: (a) your use of The Mall; (b) your violation of these Terms; (c) your
            content or store listings; (d) any transaction between you and another user; or (e) your
            violation of any applicable law or third-party right.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            12. Limitation of Liability
          </h2>
          <p className="mb-3">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE MALL AND LFH PRODUCTIONS LLC SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF
            OR RELATED TO YOUR USE OF THE PLATFORM.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE MALL
            SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES YOU HAVE PAID TO US IN THE TWELVE (12)
            MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            13. Disclaimer of Warranties
          </h2>
          <p>
            THE MALL IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
            WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            14. Dispute Resolution &amp; Arbitration
          </h2>
          <p className="mb-3">
            <strong style={{ color: "var(--text)" }}>
              Any dispute, claim, or controversy arising out of or relating to these Terms or your
              use of The Mall shall be resolved through binding individual arbitration
            </strong>{" "}
            administered by the American Arbitration Association (AAA) under its Consumer Arbitration
            Rules, rather than in court.
          </p>
          <p className="mb-3">
            <strong style={{ color: "var(--text)" }}>
              YOU AGREE THAT YOU MAY BRING CLAIMS AGAINST US ONLY IN YOUR INDIVIDUAL CAPACITY AND
              NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.
            </strong>
          </p>
          <p>
            You may opt out of this arbitration agreement by sending written notice within 30 days
            of creating your account. If arbitration is found to be inapplicable, you agree to
            submit to the exclusive jurisdiction of the state and federal courts located in the
            State of Florida.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            15. Termination
          </h2>
          <p className="mb-3">
            We reserve the right to suspend or terminate accounts that violate these terms, at our
            sole discretion, with or without notice. Store leases terminated for violation are
            non-refundable.
          </p>
          <p>
            You may delete your account at any time. Upon deletion, your subscription (if any) will
            be canceled and your data will be handled according to our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            16. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Florida, United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            17. Changes to These Terms
          </h2>
          <p>
            We may update these terms from time to time. We will notify users of material changes
            by posting a notice on the platform at least 14 days before the changes take effect.
            Continued use of The Mall after changes constitutes acceptance.
          </p>
        </section>

        <section className="pt-6 mt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            The Mall of Projects is a DBA of{" "}
            <strong style={{ color: "var(--text)" }}>LFH Productions LLC</strong>.
            <br />
            For questions about these terms, contact us through the platform.
          </p>
        </section>
      </div>
    </main>
  );
}
