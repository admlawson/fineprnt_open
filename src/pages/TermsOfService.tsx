import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

 type TocItem = { id: string; label: string; children?: TocItem[] };
const toc: TocItem[] = [
  { id: "quick-summary", label: "Quick Summary" },
  { id: "acceptance-of-terms", label: "1) Acceptance of Terms" },
  { id: "us-only-no-phi", label: "2) US-Only Service; No PHI" },
  { id: "accounts-and-access", label: "3) Accounts and Access" },
  {
    id: "your-content-and-license",
    label: "4) Your Content & License",
    children: [
      { id: "ownership", label: "4.1 Ownership" },
      { id: "license-to-operate", label: "4.2 License to Operate the Service" },
      { id: "deletion", label: "4.3 Deletion" },
    ],
  },
  { id: "acceptable-use", label: "5) Acceptable Use" },
  { id: "ai-outputs-no-advice", label: "6) AI Outputs; No Advice" },
  { id: "third-party-services-subprocessors", label: "7) Third-Party Services & Subprocessors" },
  { id: "plans-fees-payment", label: "8) Plans, Fees, and Payment" },
  { id: "service-changes-beta", label: "9) Service Changes; Beta" },
  { id: "privacy", label: "10) Privacy" },
  { id: "security", label: "11) Security" },
  { id: "confidentiality", label: "12) Confidentiality" },
  { id: "intellectual-property-feedback", label: "13) Intellectual Property; Feedback" },
  { id: "compliance-export-sanctions", label: "14) Compliance; Export; Sanctions" },
  { id: "term-suspension-termination", label: "15) Term; Suspension; Termination" },
  { id: "warranties-disclaimers", label: "16) Warranties & Disclaimers" },
  { id: "indemnification", label: "17) Indemnification" },
  { id: "limitation-of-liability", label: "18) Limitation of Liability" },
  { id: "changes-to-terms", label: "19) Changes to the Terms" },
  { id: "governing-law-venue", label: "20) Governing Law; Venue" },
  { id: "miscellaneous", label: "21) Miscellaneous" },
];

const TermsOfService: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // SEO: title, meta description, canonical
    document.title = "Terms of Service — fineprnt";
    const desc =
      "fineprnt Terms of Service for US-only professional use. No PHI; AI outputs informational; Stripe billing; contracts-focused.";
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
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.hash]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  const renderToc = (items: TocItem[]) => (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="text-sm">
          <a
            href={`#${item.id}`}
            onClick={(e) => handleAnchorClick(e, item.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.label}
          </a>
          {item.children && (
            <ul className="mt-2 space-y-1 pl-4 border-l border-border/60">
              {item.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={`#${child.id}`}
                    onClick={(e) => handleAnchorClick(e, child.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="container mx-auto px-4 py-10">
        {/* Mobile TOC */}
        <nav aria-label="On this page" className="mb-6 md:hidden rounded-lg border border-border bg-card/60 p-4">
          <h2 className="text-sm font-semibold mb-2">On this page</h2>
          {renderToc(toc)}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Desktop TOC */}
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-24 rounded-xl border border-border bg-card/60 p-4">
              <h2 className="text-sm font-semibold mb-2">On this page</h2>
              {renderToc(toc)}
            </div>
          </aside>

          <article className="md:col-span-9">
            <section id="top" className="surface-glass rounded-2xl border border-border p-6 md:p-10">
              <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">fineprnt Terms of Service</h1>
                <p className="mt-2 text-muted-foreground">
                  Effective Date: August 15, 2025
                </p>
                <p className="mt-1 text-muted-foreground">
                  Owner/Operator: Symbian Labs Inc. ("Symbian Labs," "we," "us," or "our")
                </p>
                <p className="mt-1 text-muted-foreground">
                  Service: fineprnt (the "Service"), a retrieval-augmented chat application that enables users to upload and converse with medical contracts in plain English.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Privacy: See our <Link to="/privacypolicy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>, which is incorporated by reference.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Contact: <a href="mailto:support@fineprnt.com" className="underline underline-offset-4">support@fineprnt.com</a> (support) • <a href="mailto:privacy@fineprnt.com" className="underline underline-offset-4">privacy@fineprnt.com</a> (privacy)
                </p>
              </header>

              <section id="quick-summary" className="space-y-3">
                <h2 className="text-xl font-semibold">Quick Summary (not a substitute for the full terms)</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>US-only service; professional use. Do not upload PHI or patient data.</li>
                  <li>You own your content; you grant us a limited license to host/process it (including OCR, chunks, embeddings).</li>
                  <li>Service is provided "as is." AI outputs can be inaccurate; you’re responsible for human review.</li>
                  <li>Fees are billed via Stripe; subscriptions auto-renew unless canceled; no refunds for partial periods.</li>
                  <li>We may change features; we won’t materially reduce core functionality without notice.</li>
                  <li>Governing law: Delaware; venue: courts in Delaware.</li>
                  <li>Liability is limited; you indemnify us for your Content and prohibited uploads (e.g., PHI).</li>
                </ul>
              </section>

              <section id="acceptance-of-terms" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">1) Acceptance of Terms</h2>
                <p>
                  By accessing or using the Service, you agree to these Terms of Service (the "Terms"). If you use the Service on behalf of a company or entity, you represent that you have authority to bind that entity and "you" refers to that entity. If you do not agree, do not use the Service.
                </p>
                <p>
                  Professional use only. The Service is intended for adults in professional settings. You must be at least the age required to enter binding contracts in your jurisdiction and, in any case, not under 13 years old.
                </p>
              </section>

              <section id="us-only-no-phi" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">2) US-Only Service; No PHI</h2>
                <p>
                  The Service is designed for US markets only and for contract/document analysis—not for clinical use. You must not upload protected health information (PHI), patient data, or other sensitive personal information unrelated to contract analysis. We are not your HIPAA Business Associate unless we sign a separate Business Associate Agreement (BAA).
                </p>
              </section>

              <section id="accounts-and-access" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">3) Accounts and Access</h2>
                <p>
                  You must provide accurate registration information and keep it up to date. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. We support role-based access controls (e.g., org_user, org_admin, platform_admin). We may suspend or terminate access for suspected misuse, security risks, or violations of these Terms.
                </p>
              </section>

              <section id="your-content-and-license" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">4) Your Content & License to Symbian Labs</h2>
                <section id="ownership" className="space-y-2">
                  <h3 className="text-lg font-semibold">4.1 Ownership</h3>
                  <p>
                    As between you and us, you retain all rights to Content you upload or submit to the Service (e.g., contracts, related files, and your chat inputs/outputs).
                  </p>
                </section>
                <section id="license-to-operate" className="space-y-2">
                  <h3 className="text-lg font-semibold">4.2 License to Operate the Service</h3>
                  <p>
                    You grant Symbian Labs a non-exclusive, worldwide, royalty-free license to host, copy, process, transform, analyze, transmit, display, and create technical derivatives of your Content solely to provide and improve the Service’s functionality to you (including OCR, chunking, vector embeddings, indexing, and caching necessary for retrieval-augmented generation and search).
                  </p>
                </section>
                <section id="deletion" className="space-y-2">
                  <h3 className="text-lg font-semibold">4.3 Deletion</h3>
                  <p>
                    When you delete documents or chats in-app, we remove associated derived artifacts (OCR output, chunks, embeddings, connected chat content) from our primary systems. We do not maintain backups; deleted content cannot be restored. Operational logs may persist as reasonably necessary for security and compliance.
                  </p>
                </section>
              </section>

              <section id="acceptable-use" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">5) Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload PHI, patient data, or information you do not have rights to process.</li>
                  <li>Upload unlawful, infringing, or harmful content (malware, exploits, etc.).</li>
                  <li>Attempt to bypass security or access non-public areas or other users’ data.</li>
                  <li>Reverse engineer, scrape at scale, or use automated means that overload the Service.</li>
                  <li>Use outputs to create competing foundation models or to benchmark in a misleading way.</li>
                  <li>Misrepresent outputs as professional legal/medical advice or rely on outputs without human review.</li>
                </ul>
                <p>We may investigate and enforce violations, including suspension or termination.</p>
              </section>

              <section id="ai-outputs-no-advice" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">6) AI Outputs; No Legal or Medical Advice</h2>
                <p>
                  The Service uses AI/LLM-driven features that may produce probabilistic outputs which can be inaccurate, incomplete, or outdated. Outputs are provided for informational purposes only and do not constitute legal, medical, or compliance advice. You are solely responsible for independent review and professional judgment before relying on or acting upon outputs.
                </p>
              </section>

              <section id="third-party-services-subprocessors" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">7) Third-Party Services & Subprocessors</h2>
                <p>
                  To operate the Service, we use third-party providers (e.g., Vercel, Supabase, OpenAI, Mistral Document AI, Stripe, Resend, Google Analytics). Your use of payment services is subject to Stripe’s terms. We may update subprocessors from time to time. See the Privacy Policy for details.
                </p>
              </section>

              <section id="plans-fees-payment" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">8) Plans, Fees, and Payment</h2>
                <p>
                  Fees, plan limits, and features are described in the Service or an order form. Unless stated otherwise:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium">Billing & Auto-Renewal:</span> Subscriptions bill in advance and auto-renew for successive terms (monthly or annually) at then-current rates unless you cancel before the renewal date.
                  </li>
                  <li>
                    <span className="font-medium">Taxes:</span> Fees are exclusive of taxes; you’re responsible for any applicable taxes.
                  </li>
                  <li>
                    <span className="font-medium">No Refunds:</span> Except where required by law, fees are non-refundable, including for partial periods, downgrades, or unused features.
                  </li>
                  <li>
                    <span className="font-medium">Failed Payments:</span> We may suspend or terminate access for unpaid invoices after reasonable notice.
                  </li>
                </ul>
                <p>Payments are processed by Stripe; we do not store full card numbers.</p>
              </section>

              <section id="service-changes-beta" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">9) Service Changes; Beta Features</h2>
                <p>
                  We may add, remove, or modify features. We will not materially reduce core functionality of a paid plan during the term without reasonable notice. Features labeled Beta, Preview, or Experimental may be unstable, unsupported, or subject to additional terms and can be discontinued at any time. Use them at your own risk.
                </p>
              </section>

              <section id="privacy" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">10) Privacy</h2>
                <p>
                  Our Privacy Policy explains how we collect and use information. By using the Service, you consent to our data practices described there, including the use of Google Analytics for product analytics and our configuration with AI vendors not to use your data for model training. See the <Link to="/privacypolicy" className="underline underline-offset-4">Privacy Policy</Link>.
                </p>
              </section>

              <section id="security" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">11) Security</h2>
                <p>
                  We implement administrative, technical, and physical safeguards appropriate to the Service, including encryption at rest/in transit, RBAC, and audit logging via Supabase, along with internal admin controls. SOC 2 and HIPAA control alignment are in progress. While that roadmap matures, the Service is not intended for PHI.
                </p>
                <p>
                  If we become aware of a security incident affecting your Content, we will notify you without undue delay consistent with law and our contractual obligations.
                </p>
              </section>

              <section id="confidentiality" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">12) Confidentiality</h2>
                <p>
                  Each party may access the other party’s Confidential Information. The receiving party will use it only to perform under these Terms and will protect it with at least the same care it uses for its own similar information (and not less than reasonable care). Exclusions include information that is public, independently developed, or rightfully obtained without duty of confidentiality.
                </p>
              </section>

              <section id="intellectual-property-feedback" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">13) Intellectual Property; Feedback</h2>
                <p>
                  We and our licensors own all rights in and to the Service and underlying technology. These Terms do not transfer any Symbian Labs IP to you. If you provide Feedback (suggestions, improvements), you grant us a perpetual, irrevocable, worldwide, royalty-free license to use it without restriction, without any obligation to you.
                </p>
              </section>

              <section id="compliance-export-sanctions" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">14) Compliance; Export; Sanctions</h2>
                <p>
                  You will comply with applicable laws (including data protection, anti-corruption, and export control/sanctions). You represent that you are not located in, under the control of, or a national/resident of any country or party subject to US sanctions.
                </p>
              </section>

              <section id="term-suspension-termination" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">15) Term; Suspension; Termination</h2>
                <p>
                  These Terms apply from your first use of the Service and continue until terminated. Either party may terminate for material breach not cured within 30 days’ written notice. We may suspend or restrict access immediately for security reasons or violations of these Terms. Upon termination, your right to access the Service ends; you should delete/export Content you need before termination. We may retain minimal data as required by law or for legitimate business purposes (e.g., billing records, security logs).
                </p>
              </section>

              <section id="warranties-disclaimers" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">16) Warranties & Disclaimers</h2>
                <p>
                  You represent that you have all necessary rights to your Content and that your use of the Service will comply with these Terms and applicable laws.
                </p>
                <p className="text-muted-foreground">
                  THE SERVICE AND OUTPUTS ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
                </p>
              </section>

              <section id="indemnification" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">17) Indemnification</h2>
                <p>
                  You will indemnify, defend, and hold harmless Symbian Labs and its affiliates, officers, directors, employees, and agents from and against any claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) your Content; (b) your use of the Service in violation of these Terms (including uploading PHI or prohibited data); or (c) your violation of law or third-party rights.
                </p>
                <p>
                  We will indemnify you for third-party claims alleging that the unmodified Service (excluding your Content, your integrations, or third-party services) infringes a US patent, copyright, or trademark, provided you promptly notify us, allow us to control the defense, and cooperate. Our obligation does not apply to claims based on combinations not supplied by us, use after notice of alleged infringement, or use contrary to documentation. For any such claim, we may procure rights, modify the Service, or terminate access with a pro-rata refund of prepaid, unused fees.
                </p>
              </section>

              <section id="limitation-of-liability" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">18) Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, GOODWILL, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY.
                </p>
                <p>
                  EXCEPT FOR (i) YOUR PAYMENT OBLIGATIONS; (ii) YOUR INDEMNIFICATION OBLIGATIONS; OR (iii) YOUR BREACH OF SECTION 5 (ACCEPTABLE USE) OR SECTION 12 (CONFIDENTIALITY), EACH PARTY’S TOTAL LIABILITY ARISING OUT OF OR RELATED TO THE SERVICE WILL NOT EXCEED THE FEES PAID OR PAYABLE BY YOU TO SYMBIAN LABS FOR THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY. Some jurisdictions do not allow certain limitations; in such cases, liability is limited to the maximum extent permitted by law.
                </p>
              </section>

              <section id="changes-to-terms" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">19) Changes to the Terms</h2>
                <p>
                  We may update these Terms from time to time. Material changes will be notified through the Service or by email. Continued use of the Service after the updated Terms become effective constitutes acceptance.
                </p>
              </section>

              <section id="governing-law-venue" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">20) Governing Law; Venue</h2>
                <p>
                  These Terms are governed by the laws of the State of Delaware, excluding conflict-of-law rules. The parties consent to the exclusive jurisdiction and venue of the state and federal courts located in Delaware for any dispute not subject to arbitration (if the parties later agree to arbitration in a separate agreement, that agreement will control).
                </p>
              </section>

              <section id="miscellaneous" className="mt-8 space-y-3">
                <h2 className="text-xl font-semibold">21) Miscellaneous</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium">Entire Agreement; Order of Precedence.</span> These Terms, the Privacy Policy, and any order form or master agreement between you and us are the entire agreement. In case of conflict, an executed order form or master agreement controls, then these Terms, then the Privacy Policy.
                  </li>
                  <li>
                    <span className="font-medium">Assignment.</span> You may not assign these Terms without our prior written consent; we may assign to an affiliate or in connection with a merger, acquisition, or asset transfer.
                  </li>
                  <li>
                    <span className="font-medium">Force Majeure.</span> Neither party is liable for delays or failures due to events beyond reasonable control.
                  </li>
                  <li>
                    <span className="font-medium">Notices.</span> We may provide notices via the Service or email to your account email; you may provide legal notices to <a href="mailto:legal@fineprnt.com" className="underline underline-offset-4">legal@fineprnt.com</a> (or as otherwise designated) and a copy to <a href="mailto:support@fineprnt.com" className="underline underline-offset-4">support@fineprnt.com</a>.
                  </li>
                  <li>
                    <span className="font-medium">Severability; Waiver.</span> If any provision is unenforceable, the remainder remains in effect. Failure to enforce a provision is not a waiver.
                  </li>
                </ul>
              </section>

              <div className="mt-10">
                <a
                  href="#top"
                  onClick={(e) => handleAnchorClick(e, "top")}
                  className="text-sm underline underline-offset-4 hover:text-foreground"
                >
                  Back to top
                </a>
              </div>
            </section>
          </article>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
};

export default TermsOfService;
