import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

const TermsOfService: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Terms of Service — Fineprnt";
    const desc =
      "Fineprnt Terms of Service: your rights, responsibilities, and how our contract clarity app works.";
    let meta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    const canonicalHref = `${window.location.origin}/termsofservice`;
    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalHref);
  }, []);

  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (hash) {
      setTimeout(() => {
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      {/* Spacer to clear fixed marketing header */}
      <div className="h-24 md:h-40" aria-hidden />
      <main className="container mx-auto px-4 pb-10">
        <article className="max-w-3xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Fineprnt Terms of Service</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Effective Date: August 23, 2025
            </p>
            <p className="text-sm text-muted-foreground">
              Operator: Symbian Labs Inc. (“we,” “us,” “our”)
            </p>
            <p className="text-sm text-muted-foreground">
              Contact:{" "}
              <a href="mailto:support@fineprnt.com" className="underline">
                support@fineprnt.com
              </a>
            </p>
          </header>

          <section id="quick-summary">
            <h2 className="text-xl font-semibold">Quick Summary</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Fineprnt helps you understand contracts in plain English.</li>
              <li>You own your documents and chats. Delete them any time.</li>
              <li>We don’t sell your data. Payments run securely through Stripe.</li>
              <li>
                AI answers may be wrong — don’t treat them as legal or financial
                advice.
              </li>
              <li>Subscriptions renew automatically unless you cancel.</li>
              <li>We can suspend accounts that break the rules.</li>
            </ul>
          </section>

          <section id="acceptance">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By using Fineprnt, you agree to these Terms. If you don’t agree,
              don’t use the Service. You must be at least 13 years old and
              legally able to enter contracts in your state.
            </p>
          </section>

          <section id="your-content">
            <h2 className="text-xl font-semibold">2. Your Content</h2>
            <p>
              You own the contracts and questions you upload. By using Fineprnt,
              you give us permission to process your content so we can provide
              the Service (OCR, parsing, search, chat).
            </p>
            <p>
              When you delete a document or chat, we remove it from our systems.
              Deleted content cannot be recovered.
            </p>
          </section>

          <section id="acceptable-use">
            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p>Don’t use Fineprnt to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Upload illegal content, malware, or things you don’t have rights to share.</li>
              <li>Misrepresent AI answers as professional legal or financial advice.</li>
              <li>Try to break, overload, or misuse the Service.</li>
            </ul>
          </section>

          <section id="ai-disclaimer">
            <h2 className="text-xl font-semibold">4. AI Outputs Disclaimer</h2>
            <p>
              Fineprnt uses AI to help explain documents. AI isn’t perfect and
              may be wrong or incomplete. Outputs are for informational purposes
              only — not legal, financial, or professional advice.
            </p>
          </section>

          <section id="payments">
            <h2 className="text-xl font-semibold">5. Plans, Fees, and Payment</h2>
            <p>
              Subscriptions are billed in advance via Stripe and renew
              automatically each month until you cancel. You can cancel anytime
              from your account settings. We don’t offer refunds for partial
              months.
            </p>
          </section>

          <section id="changes">
            <h2 className="text-xl font-semibold">6. Changes to Service</h2>
            <p>
              We may improve or change features over time. If we make major
              changes, we’ll give you notice.
            </p>
          </section>

          <section id="privacy">
            <h2 className="text-xl font-semibold">7. Privacy</h2>
            <p>
              Our{" "}
              <Link to="/privacypolicy" className="underline">
                Privacy Policy
              </Link>{" "}
              explains how we handle your data.
            </p>
          </section>

          <section id="termination">
            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p>
              You can stop using Fineprnt anytime. We may suspend or close
              accounts that violate these Terms.
            </p>
          </section>

          <section id="disclaimer">
            <h2 className="text-xl font-semibold">9. Disclaimers & Limitations</h2>
            <p className="text-sm">
              Fineprnt is provided “as is.” We can’t guarantee error-free or
              always-available service. To the fullest extent allowed by law,
              our liability is limited to the amount you paid us in the 12
              months before a claim arose.
            </p>
          </section>

          <section id="law">
            <h2 className="text-xl font-semibold">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Delaware, USA. Disputes
              will be resolved in Delaware courts.
            </p>
          </section>

          <footer className="text-sm text-muted-foreground">
            <p>
              Questions? Email us at{" "}
              <a href="mailto:support@fineprnt.com" className="underline">
                support@fineprnt.com
              </a>
              .
            </p>
          </footer>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
};

export default TermsOfService;
