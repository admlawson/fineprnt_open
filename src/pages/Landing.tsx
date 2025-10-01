import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Helmet } from 'react-helmet-async';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import {
  FileText,
  FileImage,
  File,
  MessageSquare,
  Search,
  CheckCircle2,
  Lock,
  LineChart,
  Scan,
  Table,
  Link as LinkIcon,
  Quote,
  ShieldCheck,
  Github,
  Box as PackageIcon,
  Cloud,
  Rocket,
} from 'lucide-react';

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // Parallax offset (respects prefers-reduced-motion)
  const [offsetY, setOffsetY] = React.useState(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const heroRef = React.useRef<HTMLDivElement | null>(null);

  // "How it works" chat-demo state
  const [howTab, setHowTab] = React.useState<'lease' | 'bill' | 'offer' | 'subscription'>('lease');
  // Detect compact landscape to adjust hero spacing/positions
  const [isLandscapeCompact, setIsLandscapeCompact] = React.useState(false);

  const convos: Record<'lease' | 'bill' | 'offer' | 'subscription', { user: string; bot: string }[]> = {
    lease: [
      { user: 'i have a gold fish and his name is bubbles', bot: '“Tenant may not permit, even temporarily, any pet on the Property (including but not limited to any mammal, reptile, bird, fish, rodent, or insect)” unless otherwise agreed in writing [p3, "9. PETS: A."].' },
      { user: 'When is rent due?', bot: 'Rent is due on the 1st with a 5-day grace period [p.1].' },
    ],
    bill: [
      { user: 'What am I being charged for?', bot: '$125 ER facility fee [p.2].' },
      { user: 'Is there a duplicate charge?', bot: 'Yes — the lab panel appears twice; one is a duplicate [p.3].' },
    ],
    offer: [
      { user: 'What does this non-compete mean?', bot: 'You can’t work for competitors for 12 months within 50 miles [p.3].' },
      { user: 'When do options vest?', bot: '25% after 12 months, then monthly over 36 months [p.5].' },
    ],
    subscription: [
      { user: 'How do I cancel?', bot: 'Notice required 30 days before renewal [p.5].' },
      { user: 'Any hidden fees?', bot: 'A $15 reactivation fee applies if you pause and return [p.2].' },
    ],
  };

  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => setReduceMotion(mql.matches);
    set();
    mql.addEventListener?.('change', set);
    return () => mql.removeEventListener?.('change', set);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) return;
    const onScroll = () => setOffsetY(window.scrollY || 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduceMotion]);

  // Layout watcher for landscape phones (short height)
  React.useEffect(() => {
    const update = () => {
      const landscape = window.innerWidth > window.innerHeight;
      const short = window.innerHeight <= 460; // iPhone landscape heights
      setIsLandscapeCompact(landscape && short);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);


  // Hash-based auto scroll
  const location = useLocation();
  React.useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  // Small CSS for gentle shake + reduced motion
  const shakeY = reduceMotion ? 0 : Math.min(8, offsetY * 0.03); // tiny parallax for stacks

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Fineprnt - Open-Source Document Analysis</title>
        <meta name="description" content="AI-powered contract and document analysis with citations. Upload documents, ask questions, get answers with receipts." />
        <meta property="og:title" content="Fineprnt - Open-Source Document Analysis" />
        <meta property="og:description" content="Upload documents, ask questions, get answers with receipts. Open-source AI-powered contract analysis with citations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={`${window.location.origin}/images/og.jpg`} />
        <meta property="og:site_name" content="Fineprnt" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fineprnt - Open-Source Document Analysis" />
        <meta name="twitter:description" content="Upload documents, ask questions, get answers with receipts. Open-source AI-powered contract analysis with citations." />
        <meta name="twitter:image" content={`${window.location.origin}/images/og.jpg`} />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Fineprnt',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            url: window.location.origin,
            description: 'AI-powered contract and document analysis with citations. Upload documents, ask questions, get answers with receipts.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            author: {
              '@type': 'Organization',
              name: 'Fineprnt'
            },
            keywords: ['ai', 'contracts', 'document-analysis', 'rag', 'open-source', 'legal-tech']
          })}
        </script>
      </Helmet>
      
      {/* Local styles for animation */}
      <style>{`
        @keyframes gentleShake { 
          0%,100% { transform: translateY(0) rotate(0deg); } 
          25% { transform: translateY(-2px) rotate(-1.2deg);} 
          50% { transform: translateY(1px) rotate(0.8deg);} 
          75% { transform: translateY(-1px) rotate(-0.6deg);} 
        }
        .shake { animation: gentleShake 3.8s ease-in-out infinite; }
        .shake.delay-1 { animation-delay: .5s; }
        .shake.delay-2 { animation-delay: 1s; }
        .shake.delay-3 { animation-delay: 1.5s; }
        @media (prefers-reduced-motion: reduce) { .shake { animation: none !important; } }
      `}</style>

      <MarketingHeader />

      <main role="main" id="content">
        {/* ===================== HERO ===================== */}
        <section
          ref={heroRef}
          aria-label="Fineprnt — open, transparent clarity on any contract"
          className={`relative overflow-hidden ${isLandscapeCompact ? 'h-[88vh] pt-24' : 'h-[100vh] sm:h-[90vh] md:h-[85vh] pt-10 sm:pt-14 md:pt-16'}`}
        >
          {/* Floating icon stacks - reduced to one side */}
          <div
            className={`pointer-events-none absolute top-20 sm:top-24 hidden lg:flex flex-col z-0 opacity-30 ${isLandscapeCompact ? 'gap-4' : 'gap-6'}`}
            style={{ transform: `translateY(${shakeY}px)`, left: isLandscapeCompact ? '0.5rem' : '1.75rem' }}
            aria-hidden
          >
            <IconCard label="PDF" className="shake" Icon={FileText} />
            <IconCard label="JPG" className="shake delay-2" Icon={FileImage} />
            <IconCard label="DOC" className="shake delay-1" Icon={File} />
          </div>

          {/* Center content */}
          <div className="relative h-full flex items-center justify-center z-10">
            <div
              className="mx-auto max-w-3xl text-center px-6 sm:px-8 md:px-12"
              style={{ transform: reduceMotion ? undefined : `translateY(${offsetY * -0.05}px)` }}
            >
              {/* Brand */}
              <div className="mb-4">
                <div className={`font-courier text-2xl md:text-3xl font-bold ${resolvedTheme==='dark'?'text-white':'text-black'}`}>
                  Fineprnt
                </div>
                <div className={`w-16 h-0.5 mx-auto mt-1 ${resolvedTheme==='dark'?'bg-white':'bg-black'}`} />
              </div>

              {/* Shorter headline */}
              <h1 className={`font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl ${resolvedTheme==='dark'?'text-white':'text-black'}`}>
                Understand any contract in seconds.
              </h1>

              {/* 1-sentence subhead */}
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                Ask in plain English. We answer with page & section receipts.
              </p>

              {/* Focused CTAs */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="relative">
                  <Button onClick={() => navigate('/app')} className="w-full sm:w-auto">
                    Use Fineprnt Cloud
                  </Button>
                  <div className="absolute -top-2 -right-2 rounded-full bg-secondary text-secondary-foreground text-xs px-2 py-0.5 shadow-sm">
                    Coming Soon
                  </div>
                </div>
                <div className="relative">
                  <Button variant="ghost" className="w-full sm:w-auto" onClick={() => window.open('https://github.com/admlawson/fineprnt_open','_blank')}>
                    View on GitHub
                  </Button>
                  <div className="absolute -top-2 -right-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5 shadow-sm">
                    Open Source
                  </div>
                </div>
              </div>

              {/* Compact trust bar */}
              <p className="mt-6 text-xs sm:text-sm text-muted-foreground">
                Clarity <span className="mx-2 opacity-40">•</span>
                Citations <span className="mx-2 opacity-40">•</span>
                Plain English <span className="mx-2 opacity-40">•</span>
                Open
              </p>
            </div>
          </div>

          {/* Optional divider fade */}
          <div className="hero-fade z-[1]" />
        </section>

        {/* ===================== GTM: THREE WAYS ===================== */}
        <section id="gtm" className="py-14 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <Badge variant="secondary">Use Fineprnt your way</Badge>
              <h2 className="mt-3 text-3xl font-bold">Three ways to get clarity</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Open-source core, developer-friendly SDK, and a hosted Cloud app for everyone else.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Open Source */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary text-primary-foreground">
                    <Github size={22} />
                  </div>
                  <CardTitle>Open Source</CardTitle>
                  <CardDescription>Free, transparent, community-driven</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> MIT licensed</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Self-host in minutes</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Same engine as Cloud</li>
                  </ul>
                  <Button className="w-full" variant="outline" onClick={() => window.open('https://github.com/admlawson/fineprnt_open', '_blank')}>
                    View repo
                  </Button>
                </CardContent>
              </Card>

              {/* SDK */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary text-secondary-foreground text-xs px-3 py-1 shadow-soft">
                  Coming Soon
                </div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-background border">
                    <PackageIcon size={20} />
                  </div>
                  <CardTitle>API + SDK</CardTitle>
                  <CardDescription>Drop-in parsing + RAG for your app</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> OCR, chunking, embeddings</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Two-lane answers w/ citations</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Type-safe TS APIs</li>
                  </ul>
                  <Button className="w-full" disabled>
                    <Rocket className="mr-2 h-4 w-4" /> Join waitlist (soon)
                  </Button>
                </CardContent>
              </Card>

              {/* Cloud */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary text-secondary-foreground text-xs px-3 py-1 shadow-soft">
                  Coming Soon
                </div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10 text-primary border">
                    <Cloud size={22} />
                  </div>
                  <CardTitle>Fineprnt Cloud</CardTitle>
                  <CardDescription>For non-technical users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> No setup required</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Secure uploads</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Always up-to-date</li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate('/app')}>Fineprnt Cloud</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS ===================== */}
        <section id="how-it-works" className="px-4 py-14 section-muted has-top-divider">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <Badge variant="secondary">How it works</Badge>
              <h2 className="mt-3 text-3xl font-bold">Upload → Ask → Get receipts</h2>
              <p className="mt-2 text-muted-foreground">Plain English in, clause-level citations out.</p>
            </div>

            <div className="rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Title bar with mac stoplights + tabs */}
              <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur-sm px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden />
                </div>

                {/* Tabs (desktop) */}
                <div className="-mx-2 hidden sm:flex gap-1">
                  {([
                    { key: 'lease', label: 'Lease' },
                    { key: 'bill', label: 'Bill' },
                    { key: 'offer', label: 'Job Offer' },
                    { key: 'subscription', label: 'Subscription' },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setHowTab(t.key)}
                      className={`rounded-md px-3 py-1 text-sm ${howTab === t.key ? 'underline font-semibold' : 'opacity-70 hover:opacity-100'}`}
                      aria-pressed={howTab === t.key}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Mobile select */}
                <div className="sm:hidden">
                  <label className="sr-only" htmlFor="how-tab">Choose example</label>
                  <select
                    id="how-tab"
                    value={howTab}
                    onChange={(e) => setHowTab(e.target.value as 'lease' | 'bill' | 'offer' | 'subscription')}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="lease">Lease</option>
                    <option value="bill">Bill</option>
                    <option value="offer">Job Offer</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
              </div>

              {/* Chat body */}
              <div className="p-4 bg-background/50">
                <ul className="space-y-3">
                  {convos[howTab].map((m, i) => (
                    <li key={i} className="flex flex-col gap-2">
                      {/* User bubble */}
                      <div className="ml-auto max-w-[85%] rounded-2xl border bg-primary text-primary-foreground px-4 py-2 text-sm">
                        <span className="opacity-90">{m.user}</span>
                      </div>
                      {/* Fineprnt bubble */}
                      <div className="mr-auto max-w-[85%] rounded-2xl border bg-muted px-4 py-2 text-sm">
                        <span className="opacity-90">{m.bot}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Every answer includes a page/section citation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== DIFFERENTIATOR FLOW ===================== */}
        <section id="how-we-work" className="px-6 py-20">
          <div className="mx-auto max-w-[1000px] text-center">
            <h2 className="font-modern text-3xl font-bold tracking-tight sm:text-4xl">
              What makes Fineprnt trustworthy
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              A purpose-built pipeline for documents — not a generic chat UI.
            </p>
          </div>

          {/* Horizontal flow with arrows */}
          <div className="relative mt-12 flex flex-col items-center gap-8 md:mt-16 md:flex-row md:justify-between md:gap-4">
            <FlowStep icon={<Scan className="h-6 w-6" />} title="OCR & ingestion" text="Any format → clean, searchable text." />
            <Connector />
            <FlowStep icon={<Table className="h-6 w-6" />} title="Extraction & structuring" text="Clauses, tables, riders, references indexed." />
            <Connector />
            <FlowStep icon={<LinkIcon className="h-6 w-6" />} title="Relational understanding" text="Obligations, fees, deadlines linked." />
            <Connector />
            <FlowStep icon={<Quote className="h-6 w-6" />} title="Clause‑level receipts" text="Every claim shows its source." />
            <Connector />
            <FlowStep icon={<ShieldCheck className="h-6 w-6" />} title="Two-lane reasoning" text="Document facts vs. general guidance." />
          </div>

          <p className="mt-12 text-center text-sm italic text-muted-foreground">
            GPT guesses. Fineprnt proves it.
          </p>
        </section>

        {/* ===================== FEATURE HIGHLIGHTS ===================== */}
        <section id="features" className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Why people use Fineprnt</h2>
              <p className="text-muted-foreground mt-2">Contracts are confusing. Fineprnt makes them clear.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: LineChart, title: 'Clarity in seconds', description: 'Upload, ask, and get plain-English answers fast.' },
                { icon: Search, title: 'Receipts you can trust', description: 'Every answer points to the exact clause and page.' },
                { icon: MessageSquare, title: 'No legalese required', description: 'Ask in everyday language. We do the heavy lifting.' },
              ].map((feature, index) => (
                <Card key={index} className="group border-0 shadow-soft hover:shadow-medium transition">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary text-primary-foreground">
                      <feature.icon size={24} aria-hidden="true" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== FAQ (kept) ===================== */}
        <section id="faq" className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">FAQ</h2>
              <p className="text-muted-foreground mt-2">Everything you need to know about Fineprnt.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What file types do you support?</AccordionTrigger>
                <AccordionContent>PDF, DOC, JPG, and more.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I upload multiple files at once?</AccordionTrigger>
                <AccordionContent>Not yet — one combined upload per document.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is this legal advice?</AccordionTrigger>
                <AccordionContent>No. Fineprnt is not a substitute for a lawyer.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Is my data safe?</AccordionTrigger>
                <AccordionContent>Yes. Files are encrypted in transit and at rest.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        <section className="py-20 px-4 bg-gradient-primary">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Never sign blind again.</h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Open source for builders. Cloud for everyone else.
            </p>
            <div className="flex items-center justify-center gap-3 flex-col sm:flex-row">
              <Button size="lg" variant="secondary" onClick={() => navigate('/app')}>Fineprnt Cloud</Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://github.com/admlawson/fineprnt_open', '_blank')}>
                <Github className="mr-2 h-5 w-5" /> Star on GitHub
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

/** Small presentational icon card for the hero */
function IconCard({
  label,
  className = '',
  Icon,
}: {
  label: string;
  className?: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className={`relative flex h-20 w-16 flex-col items-center justify-center rounded-lg border px-2 py-3 shadow-sm bg-background ${className}`}>
      <Icon className="h-8 w-8 opacity-80" aria-hidden />
      <span className="mt-1 text-[10px] font-semibold opacity-80" aria-hidden>
        {label}
      </span>
    </div>
  );
}

function FlowStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="relative z-10 flex w-full max-w-[220px] flex-col items-center text-center md:max-w-[180px]">
      <div className="grid h-12 w-12 place-items-center rounded-xl border bg-background shadow-sm">
        {icon}
      </div>
      <h3 className="mt-3 font-modern text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="hidden md:block flex-1 h-px border-t border-dashed border-border mx-2" aria-hidden />
  );
}
