import React from "react";
import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

const PrivacyPolicy: React.FC = () => {
  React.useEffect(() => {
    const title = "omniclause Privacy Policy"; // <60 chars
    const description = "omniclause Privacy Policy for US users: data use, retention, security, and your rights."; // <=160 chars
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = window.location.href;

    // JSON-LD
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'omniclause Privacy Policy',
      url: window.location.href,
      description,
    } as const;
    let script = document.getElementById('ld-privacy');
    if (!script) {
      script = document.createElement('script');
      (script as HTMLScriptElement).type = 'application/ld+json';
      script.id = 'ld-privacy';
      document.head.appendChild(script);
    }
    (script as HTMLScriptElement).textContent = JSON.stringify(ld);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      <main role="main" className="px-4 py-10">
        <article className="container mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">omniclause Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-2">Effective Date: August 15, 2025</p>
            <p className="text-sm text-muted-foreground">Owner/Operator: Symbian Labs Inc. ("Symbian Labs," "we," "us," or "our")</p>
            <p className="text-sm text-muted-foreground">Service: omniclause (the "Service"), a retrieval-augmented chat application that enables users to upload and converse with medical contracts in plain English.</p>
            <p className="text-sm text-muted-foreground">Contact (Privacy): <a className="underline" href="mailto:privacy@omniclause.com">privacy@omniclause.com</a> • Contact (Support): <a className="underline" href="mailto:support@omniclause.com">support@omniclause.com</a></p>
          </header>

          <aside className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Table of contents</h2>
            <nav className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-2">
              <a className="hover:text-foreground" href="#quick-summary">Quick Summary</a>
              <a className="hover:text-foreground" href="#scope-roles">1. Scope & Roles</a>
              <a className="hover:text-foreground" href="#information-we-collect">2. Information We Collect</a>
              <a className="hover:text-foreground" href="#purposes">3. How We Use Information (Purposes)</a>
              <a className="hover:text-foreground" href="#legal-bases">4. Legal Bases (US Context)</a>
              <a className="hover:text-foreground" href="#cookies-analytics">5. Cookies & Analytics</a>
              <a className="hover:text-foreground" href="#data-sharing">6. Data Sharing & Subprocessors</a>
              <a className="hover:text-foreground" href="#data-location">7. Data Location, Transfers, & Residency</a>
              <a className="hover:text-foreground" href="#security">8. Security</a>
              <a className="hover:text-foreground" href="#retention-deletion">9. Retention & Deletion</a>
              <a className="hover:text-foreground" href="#privacy-rights">10. Your Privacy Choices & Rights</a>
              <a className="hover:text-foreground" href="#payment-processing">11. Payment Processing</a>
              <a className="hover:text-foreground" href="#childrens-privacy">12. Children’s Privacy</a>
              <a className="hover:text-foreground" href="#automated-decision-making">13. Automated Decision-Making</a>
              <a className="hover:text-foreground" href="#your-responsibilities">14. Your Responsibilities</a>
              <a className="hover:text-foreground" href="#data-integrity">15. Data Integrity & Minimization</a>
              <a className="hover:text-foreground" href="#changes">16. Changes to This Policy</a>
              <a className="hover:text-foreground" href="#contact">17. Contact Us</a>
              <a className="hover:text-foreground" href="#appendix">Appendix: Current Subprocessors</a>
            </nav>
          </aside>

          <section id="quick-summary" className="prose prose-sm sm:prose base-foreground max-w-none mb-8">
            <h2 className="text-2xl font-semibold mb-3">Quick Summary</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We operate in the United States and target US markets only.</li>
              <li>We do not sell personal data and do not use third-party advertising cookies.</li>
              <li>Users should not upload PHI or patient data. The Service is designed for contracts (e.g., Medicare/Medicaid, payer/provider agreements) and other non-patient documents.</li>
              <li>We store documents, OCR output, embeddings, and chat history until you delete them.</li>
              <li>Subprocessors include Vercel, Supabase, OpenAI, Mistral (Document AI), Stripe, Resend, and Google Analytics.</li>
              <li>Security program is evolving; SOC 2 and HIPAA control alignment are in progress (the Service is not intended for PHI).</li>
              <li>You can delete your documents and chats in-app; we currently do not maintain backups.</li>
            </ul>
          </section>

          <section id="scope-roles" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">1. Scope & Roles</h2>
            <p>This Privacy Policy explains how Symbian Labs processes Personal Information in connection with your use of omniclause. It applies to business customers, their end users (e.g., employees/contractors), and individual practitioners in the United States.</p>
            <p className="mt-3"><strong>Not for PHI:</strong> omniclause is not intended for, and should not be used to process, Protected Health Information (PHI) under HIPAA. You agree not to upload PHI, patient data, or other sensitive personal information unrelated to contract analysis. We are not a “Business Associate” under HIPAA unless we enter into a signed BAA stating otherwise.</p>
          </section>

          <section id="information-we-collect" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold mt-4">Account & Organization Data</h3>
            <p>Name, email address, organization affiliation, role, and account preferences. Authentication and authorization data (e.g., org_user, org_admin, platform_admin).</p>
            <h3 className="text-lg font-semibold mt-4">Content You Provide to the Service</h3>
            <p>Documents you upload (e.g., contracts), including OCR output, transformed text, chunks, and vector embeddings. Chat interactions, including prompts, responses, and conversation history. Metadata about documents and chats (e.g., timestamps, titles, file types).</p>
            <h3 className="text-lg font-semibold mt-4">Telemetry & Operational Data</h3>
            <p>Event logs (e.g., API calls, errors), device/browser type, pages or features used, timestamps. Cookie and similar data limited to essential and analytics (Google Analytics).</p>
            <h3 className="text-lg font-semibold mt-4">Payment & Billing</h3>
            <p>Processed by Stripe. We receive limited billing metadata (e.g., last 4 digits, card brand, status) and do not store full card numbers.</p>
            <p className="mt-2">We do not collect information from children. See Section 12.</p>
          </section>

          <section id="purposes" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">3. How We Use Information (Purposes)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and improve the Service, including OCR, RAG, search, and chat functionality.</li>
              <li>Create embeddings and indexes from your documents to enable conversational retrieval.</li>
              <li>Authenticate and authorize users, manage teams/organizations, and secure accounts.</li>
              <li>Monitor performance, diagnose issues, and maintain availability (telemetry and error logs).</li>
              <li>Process payments, invoicing, and account administration.</li>
              <li>Provide product updates and transactional or feature communications.</li>
              <li>Comply with legal obligations and enforce our agreements and acceptable use requirements (e.g., no PHI).</li>
            </ul>
            <p className="mt-2">We do not use your content or personal data to train our internal models. We configure our AI vendors (OpenAI and Mistral Document AI) not to use your data for model training.</p>
          </section>

          <section id="legal-bases" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">4. Legal Bases (US Context)</h2>
            <p>While US law does not generally require enumerating purposes by legal basis (outside specific state regimes), our processing is grounded in: (a) contractual necessity to deliver the Service you request; (b) legitimate interests in operating, securing, and improving the Service; and (c) legal compliance.</p>
          </section>

          <section id="cookies-analytics" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">5. Cookies & Analytics</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Essential cookies are used for secure sign-in and session continuity.</li>
              <li>Analytics cookies: We use Google Analytics to understand feature usage and improve the Service.</li>
              <li>No third-party advertising cookies.</li>
              <li>You can adjust your browser settings to limit cookies and/or use Google’s Analytics opt-out add-on.</li>
              <li>
                Global Privacy Control/Do-Not-Track: Implementation is in progress; given we do not sell or share personal information for targeted advertising, these signals do not change core processing. We may update this section as we finalize technical support.
              </li>
            </ul>
          </section>

          <section id="data-sharing" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">6. Data Sharing & Subprocessors</h2>
            <p>We do not sell personal data. We share information only with service providers/subprocessors that help us operate omniclause:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Vercel (application hosting and delivery)</li>
              <li>Supabase (database, auth, storage, role-based access, audit logs)</li>
              <li>OpenAI (LLM for chat/RAG inference; configured no training on your data)</li>
              <li>Mistral Document AI (OCR and document intelligence; configured no training on your data)</li>
              <li>Stripe (payments; tokenized; we don’t store full card data)</li>
              <li>Resend (transactional email)</li>
              <li>Google Analytics (product analytics; no ads)</li>
            </ul>
            <p className="mt-2">Professional advisers (e.g., auditors, legal counsel) under confidentiality. Authorities when required by law or to protect rights, safety, and the integrity of the Service.</p>
            <p className="mt-2">We may update our subprocessors from time to time. Material changes will be reflected in this Policy (and, where required, we will provide notice).</p>
          </section>

          <section id="data-location" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">7. Data Location, Transfers, & Residency</h2>
            <p>We operate for US markets only and process data in the United States. If a provider stores or transmits data outside your state, it remains subject to contractual confidentiality and security obligations.</p>
          </section>

          <section id="security" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">8. Security</h2>
            <p>We implement administrative, technical, and physical safeguards appropriate to the nature of the data, including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Encryption in transit (TLS) and encryption at rest for stored content.</li>
              <li>Role-based access controls (RBAC) (org_user, org_admin, platform_admin).</li>
              <li>Audit logging and monitoring via Supabase and our platform admin controls.</li>
              <li>Least-privilege access, single sign-on/2FA support (where enabled), and environment segregation.</li>
            </ul>
            <p className="mt-2"><strong>Assurance roadmap:</strong> SOC 2 and HIPAA control alignment are in progress. While HIPAA controls are being aligned, the Service is not intended for PHI, and you agree not to upload it.</p>
            <p className="mt-2"><strong>Incident response:</strong> If we learn of a security incident affecting your data, we will notify you without undue delay consistent with applicable law and our contractual obligations, and we will provide information to help you meet any legal duties.</p>
          </section>

          <section id="retention-deletion" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">9. Retention & Deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Default retention: We retain documents, OCR output, chunks, embeddings, chats, prompts/responses, and operational logs until you delete them or your account is closed.</li>
              <li>Your controls: You can rename and delete documents and chats in the application; when you delete, we remove the associated derived artifacts (OCR output, chunks, embeddings, and related chat content) from our primary systems.</li>
              <li>Backups: We do not currently maintain backups; deleted content cannot be restored.</li>
              <li>Logs: Limited operational logs may persist as needed for security, fraud prevention, and legal compliance.</li>
            </ul>
            <p className="mt-2">We may retain minimal information as required by law, dispute resolution, or enforcement of agreements.</p>
          </section>

          <section id="privacy-rights" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">10. Your Privacy Choices & Rights</h2>
            <p>In-product controls: Upload, manage, and delete your content in the app’s standard CRUD interface. You may also request account deletion via <a className="underline" href="mailto:privacy@omniclause.com">privacy@omniclause.com</a>.</p>
            <p className="mt-2">US State Privacy Rights (e.g., CA, CO, CT, VA, UT): Depending on your state, you may have rights to access, correct, delete, obtain a portable copy, or appeal a rights decision. To exercise these rights, email privacy@omniclause.com with your request, state of residence, and a verifiable means of confirming your identity and account ownership. We do not “sell” personal information or “share” it for cross-context behavioral advertising as defined by the CPRA.</p>
            <p className="mt-2">If your request is denied, you may appeal by replying to our decision email. If unresolved, you may contact your state attorney general.</p>
          </section>

          <section id="payment-processing" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">11. Payment Processing</h2>
            <p>Payments are handled by Stripe. Stripe acts as an independent controller for payment information. We receive only limited billing metadata and do not store full credit card numbers.</p>
          </section>

          <section id="childrens-privacy" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">12. Children’s Privacy</h2>
            <p>omniclause is intended for adults in professional settings. We do not knowingly collect personal information from children under 13. If you believe a child has provided us information, contact <a className="underline" href="mailto:privacy@omniclause.com">privacy@omniclause.com</a> and we will delete it.</p>
          </section>

          <section id="automated-decision-making" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">13. Automated Decision-Making</h2>
            <p>We do not use automated decision-making that produces legal or similarly significant effects about you (e.g., no automated eligibility, pricing, or access determinations). Access is provisioned under enterprise agreements or paid plans.</p>
          </section>

          <section id="your-responsibilities" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">14. Your Responsibilities</h2>
            <p>You are responsible for ensuring you have the rights and permissions to upload content to omniclause. You must not upload PHI, patient data, or other personal information that is not necessary for contract analysis. You also agree not to upload content that violates applicable laws or third-party rights.</p>
          </section>

          <section id="data-integrity" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">15. Data Integrity & Minimization</h2>
            <p>We encourage customers to upload only what is necessary to accomplish contract analysis (e.g., public contracts or B2B agreements). We do not perform automatic redaction today; consider removing unnecessary personal identifiers before upload.</p>
          </section>

          <section id="changes" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">16. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the Service or by email. The “Effective Date” above indicates when the latest version took effect.</p>
          </section>

          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">17. Contact Us</h2>
            <p>Privacy & Rights Requests: <a className="underline" href="mailto:privacy@omniclause.com">privacy@omniclause.com</a></p>
            <p>Support: <a className="underline" href="mailto:support@omniclause.com">support@omniclause.com</a></p>
            <p className="mt-2 text-sm text-muted-foreground">Governing Law: This Policy and any disputes related to it are governed by the laws of the State of Delaware, excluding its conflicts of laws principles.</p>
          </section>

          <section id="appendix" className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Appendix: Current Subprocessors (as of Aug 15, 2025)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vercel, Inc. – Application hosting and delivery (US)</li>
              <li>Supabase – Database, authentication, storage, audit logs (US/EU regions as configured; our deployment targets US)</li>
              <li>OpenAI – LLM inference for chat/RAG (configured no training; US endpoints)</li>
              <li>Mistral (Document AI) – OCR/document intelligence (configured no training)</li>
              <li>Stripe, Inc. – Payment processing (tokenized)</li>
              <li>Resend – Transactional email delivery</li>
              <li>Google LLC (Analytics) – Product analytics (no advertising features)</li>
            </ul>
            <p className="mt-2">We will keep this list up to date and may add or replace vendors to support uptime, performance, or feature needs. Material changes will be reflected in an updated Policy (and additional notice where legally required).</p>
          </section>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default PrivacyPolicy;
