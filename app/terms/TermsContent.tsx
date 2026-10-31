"use client";

export default function TermsContent() {
  return (
    <main
      className="max-w-3xl mx-auto px-6 py-12"
      style={{ color: "var(--text)" }}
    >
      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: "var(--sunset-warm)" }}
      >
        Terms of Service
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Last updated: October 31, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            1. Who We Are
          </h2>
          <p>
            The Mall of Projects (&quot;The Mall,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by{" "}
            <strong style={{ color: "var(--text)" }}>LFH Productions LLC</strong>, doing business as
            The Mall of Projects. The Mall is a social platform that provides
            storefront space and community features for creators, builders, and
            entrepreneurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            2. The Platform
          </h2>
          <p className="mb-3">
            The Mall consists of two areas:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong style={{ color: "var(--text)" }}>The Floor</strong> — a human-only social
              space. No AI agents, bots, or automated accounts are permitted in the
              public feed.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Stores</strong> — individual storefronts
              leased by Store Owners. Each store is independently operated by its
              owner.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            3. Accounts &amp; Profiles
          </h2>
          <p className="mb-3">
            You must provide a valid email address and create a password to register.
            After registration, you may build a profile as either a <strong style={{ color: "var(--text)" }}>Shopper</strong> or
            a <strong style={{ color: "var(--text)" }}>Store Owner</strong>. You are responsible for
            maintaining the security of your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            4. Store Leases
          </h2>
          <p className="mb-3">
            Store Owners pay a recurring subscription (&quot;lease&quot;) to operate a
            storefront on The Mall. Leases are available in monthly, 6-month, and
            yearly terms. Lease pricing is published on the platform at the time of
            subscription.
          </p>
          <p className="mb-3">
            <strong style={{ color: "var(--text)" }}>The Mall does not process, manage, or take
            any portion of transactions that occur within your store.</strong> Store
            Owners connect their own payment processors and are solely responsible
            for their own sales, refunds, taxes, and compliance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            5. Store Owner Responsibilities
          </h2>
          <p className="mb-3">
            As a Store Owner, you are responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All products, services, and content listed in your store</li>
            <li>Your own payment processing, refunds, and customer disputes</li>
            <li>Compliance with all applicable laws and regulations</li>
            <li>Any AI or LLM tools you connect to build or operate your store</li>
            <li>Ensuring your store does not contain illegal, fraudulent, or harmful content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            6. Prohibited Conduct
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deploying AI agents, bots, or automated accounts on The Floor</li>
            <li>Selling illegal goods or services</li>
            <li>Harassment, hate speech, or threats</li>
            <li>Spam, scams, or deceptive practices</li>
            <li>Impersonating other users or entities</li>
            <li>Attempting to circumvent platform security or access controls</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            7. Advertising
          </h2>
          <p>
            Advertising on The Floor is managed exclusively by The Mall. Unauthorized
            advertising, promotional spam, or solicitation in the social feed is
            prohibited. Premium ad placements are available through The Mall.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            8. Content &amp; Intellectual Property
          </h2>
          <p>
            You retain ownership of all content you post or upload to The Mall. By
            posting content on The Floor or in your store, you grant The Mall a
            non-exclusive, royalty-free license to display that content on the
            platform. We do not claim ownership of your work.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            9. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these
            terms. Store leases that are terminated for violation are non-refundable.
            You may cancel your lease at any time; access continues through the end
            of your paid period.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            10. Limitation of Liability
          </h2>
          <p>
            The Mall provides storefront space and community features &quot;as is.&quot; We
            are not responsible for transactions between Store Owners and their
            customers, the quality or legality of products sold in stores, or any
            disputes arising from store transactions. Our liability is limited to the
            amount of lease fees you have paid to The Mall.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            11. Changes to These Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of The Mall
            after changes constitutes acceptance. We will notify users of material
            changes.
          </p>
        </section>

        <section
          className="pt-6 mt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
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
