import React from "react";
import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

const PrivacyPolicy: React.FC = () => {
  React.useEffect(() => {
    const title = "Fineprnt Privacy Policy";
    const description =
      "Fineprnt Privacy Policy: how we handle your documents, data, and rights as a user.";
    document.title = title;

    let meta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    let link = document.querySelector(
      "link[rel=\"canonical\"]"
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;

    const ld = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Fineprnt Privacy Policy",
      url: window.location.href,
      description,
    } as const;
    let script = document.getElementById("ld-privacy");
    if (!script) {
      script = document.createElement("script");
      (script as HTMLScriptElement).type = "application/ld+json";
      script.id = "ld-privacy";
      document.head.appendChild(script);
    }
    (script as HTMLScriptElement).textContent = JSON.stringify(ld);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Spacer to clear fixed marketing header */}
      <div className="h-24 md:h-40" aria-hidden />

      <main role="main" className="px-4 pb-10">
        <article className="container mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Fineprnt Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Effective Date: August 23, 2025
            </p>
            <p className="text-sm text-muted-foreground">
              Operator: Symbian Labs Inc. (“we,” “us,” or “our”)
            </p>
            <p className="text-sm text-muted-foreground">
              Contact:{" "}
              <a className="underline" href="mailto:privacy@fineprnt.com">
                privacy@fineprnt.com
              </a>{" "}
              •{" "}
              <a className="underline" href="mailto:support@fineprnt.com">
                support@fineprnt.com
              </a>
            </p>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Quick Summary</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>We never sell your data. Period.</li>
              <li>
                You control your documents and chats — delete them any time, and
                they’re gone.
              </li>
              <li>
                We only share data with trusted partners who help us run
                Fineprnt (like Stripe for payments).
              </li>
              <li>
                We don’t use your content to train AI. Your data stays yours.
              </li>
              <li>
                Fineprnt is for adults. Not for kids under 13.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">1. What We Collect</h2>
            <p className="text-sm mb-2">
              To give you clarity on your contracts, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Account info:</strong> your name, email, login details.
              </li>
              <li>
                <strong>Content:</strong> the documents you upload (leases,
                bills, job offers, subscriptions), plus your questions and
                chats.
              </li>
              <li>
                <strong>Device & usage:</strong> basic logs like browser type,
                errors, and which features you use.
              </li>
              <li>
                <strong>Payments:</strong> handled by Stripe. We never see your
                full card number.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">2. How We Use It</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>To process your documents so you can ask questions in plain English.</li>
              <li>To improve Fineprnt’s features and keep things running smoothly.</li>
              <li>To communicate with you about your account or updates.</li>
              <li>To process payments securely.</li>
            </ul>
            <p className="text-sm mt-2">
              We do <strong>not</strong> sell or rent your data. We do{" "}
              <strong>not</strong> use your content for training AI models.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">3. Who We Share With</h2>
            <p className="text-sm">
              Only trusted partners who help us operate Fineprnt:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Stripe – secure payments</li>
              <li>Supabase – database & storage</li>
              <li>Vercel – hosting</li>
              <li>OpenAI & Mistral – AI processing (no training on your data)</li>
              <li>Resend – email delivery</li>
              <li>Google Analytics – product analytics (no ads)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">4. Security</h2>
            <p className="text-sm">
              We use encryption, access controls, and monitoring to keep your
              data safe. If something ever goes wrong, we’ll let you know as soon
              as possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">5. Retention & Deletion</h2>
            <p className="text-sm">
              You can delete your docs and chats at any time in the app. Once
              deleted, they’re gone from our systems. We don’t keep backups you
              can restore from.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">6. Your Choices</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Delete your documents or account at any time.</li>
              <li>Unsubscribe from emails using the link inside them.</li>
              <li>
                Email{" "}
                <a className="underline" href="mailto:privacy@fineprnt.com">
                  privacy@fineprnt.com
                </a>{" "}
                with any privacy questions or requests.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">7. Kids’ Privacy</h2>
            <p className="text-sm">
              Fineprnt isn’t for kids under 13. If we learn a child has signed
              up, we’ll delete their account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">8. Changes</h2>
            <p className="text-sm">
              We may update this policy occasionally. If the changes are
              important, we’ll email you or show a notice in the app.
            </p>
          </section>

          <footer className="text-sm text-muted-foreground">
            <p>Questions? Reach us at:</p>
            <p>
              <a className="underline" href="mailto:privacy@fineprnt.com">
                privacy@fineprnt.com
              </a>{" "}
              or{" "}
              <a className="underline" href="mailto:support@fineprnt.com">
                support@fineprnt.com
              </a>
            </p>
          </footer>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default PrivacyPolicy;
