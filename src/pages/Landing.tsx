import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import {
  FileText,
  FileImage,
  File,            // NEW: generic file icon for DOC
  MessageSquare,
  Zap,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  LineChart,
  Scan,
  Table,
  Link as LinkIcon,
  Quote,
  ShieldCheck,
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

  // SEO
  React.useEffect(() => {
    const title = 'Fineprnt — Any Document. Any Question. Clarity in Seconds.';
    const description =
      'Don’t get caught in the fine print. Upload any contract. Ask in plain English. Get answers backed by actual receipts (citations).';
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

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Fineprnt',
      applicationCategory: 'ConsumerApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '20', priceCurrency: 'USD' },
      url: window.location.origin,
      description,
    } as const;
    let script = document.getElementById('ld-org');
    if (!script) {
      script = document.createElement('script');
      (script as HTMLScriptElement).type = 'application/ld+json';
      script.id = 'ld-org';
      document.head.appendChild(script);
    }
    (script as HTMLScriptElement).textContent = JSON.stringify(ld);
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
        {/* HERO (icons-only, no video/image) */}
        <section
          ref={heroRef}
          aria-label="Fineprnt — clarity on any contract in seconds"
          className={`relative overflow-hidden ${isLandscapeCompact ? 'h-[88vh] pt-24' : 'h-[100vh] sm:h-[90vh] md:h-[85vh] pt-10 sm:pt-14 md:pt-16'}`}
        >
          {/* Floating icon stacks */}
          <div
            className={`pointer-events-none absolute top-20 sm:top-24 hidden sm:flex flex-col z-0 ${isLandscapeCompact ? 'gap-4' : 'gap-6'}`}
            style={{ transform: `translateY(${shakeY}px)`, left: isLandscapeCompact ? '0.5rem' : '1.75rem' }}
            aria-hidden
          >
            <IconCard label="PDF" className="shake" Icon={FileText} />
            <IconCard label="JPG" className="shake delay-2" Icon={FileImage} />
            <IconCard label="DOC" className="shake delay-1" Icon={File} />
          </div>
          <div
            className={`pointer-events-none absolute top-24 sm:top-28 hidden sm:flex flex-col z-0 ${isLandscapeCompact ? 'gap-4' : 'gap-6'}`}
            style={{ transform: `translateY(${-shakeY}px)`, right: isLandscapeCompact ? '0.5rem' : '1.75rem' }}
            aria-hidden
          >
            <IconCard label="DOC" className="shake delay-3" Icon={File} />
            <IconCard label="PDF" className="shake" Icon={FileText} />
            <IconCard label="JPG" className="shake delay-1" Icon={FileImage} />
          </div>

          {/* Center content */}
          <div className="relative h-full flex items-center justify-center z-10">
            <div
              className={`mx-auto max-w-3xl text-center px-6 ${isLandscapeCompact ? 'sm:px-6' : 'sm:px-8'} md:px-12`}
              style={{ transform: reduceMotion ? undefined : `translateY(${offsetY * -0.05}px)` }}
            >
              {/* Fineprnt Logo */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <div className={`font-courier text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold ${
                  resolvedTheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Fineprnt
                </div>
                <div className={`w-14 sm:w-16 md:w-20 h-0.5 mx-auto mt-1 ${
                  resolvedTheme === 'dark' ? 'bg-white' : 'bg-black'
                }`} />
              </div>

              <h1 className={`font-bold tracking-tight leading-tight ${isLandscapeCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl'} ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                Any Document. Any Question. Clarity in Seconds.
              </h1>

              <p className={`mt-2 sm:mt-3 md:mt-4 ${isLandscapeCompact ? 'text-[11px]' : 'text-xs sm:text-sm md:text-base'} max-w-xl sm:max-w-2xl mx-auto leading-relaxed ${
                resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/80'
              }`}>
                Don’t get caught in the fine print. Upload any contract. Ask in plain English. Get answers backed by actual receipts (citations).
              </p>

              <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <Button size="default" className="w-full sm:w-auto text-sm sm:text-base" onClick={() => navigate('/app')}>
                  Get started for free
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See how it works
                </Button>
              </div>

              <div className={`mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm ${
                resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'
              }`}>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span>Clarity in seconds</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span>Receipts (citations)</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span>Plain English</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span>Peace of mind</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional divider fade */}
          <div className="hero-fade z-[1]" />
        </section>

        {/* HOW IT WORKS — macOS chat window with tabs */}
        <section id="how-it-works" className="px-4 py-14 section-muted has-top-divider">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <Badge variant="secondary">How it works</Badge>
              <h2 className="mt-3 text-3xl font-bold">So simple it feels like cheating</h2>
              <p className="mt-2 text-muted-foreground">Upload → Ask → Get the truth with receipts.</p>
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
                  Answers include receipts with page/section references. Upload any contract; ask anything.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFERENTIATOR FLOW */}
        <section id="how-we-work" className="px-6 py-20">
          <div className="mx-auto max-w-[1000px] text-center">
            <h2 className="font-modern text-3xl font-bold tracking-tight sm:text-4xl">
              How Fineprnt actually works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Not just another GPT wrapper. Fineprnt processes your document step‑by‑step, preserving structure and delivering receipts you can trust.
            </p>
          </div>

          {/* Horizontal flow with arrows */}
          <div className="relative mt-12 flex flex-col items-center gap-8 md:mt-16 md:flex-row md:justify-between md:gap-4">
            <FlowStep icon={<Scan className="h-6 w-6" />} title="OCR & ingestion" text="Any format (PDF, DOC, JPG). Scans converted to clean, searchable text." />
            <Connector />
            <FlowStep icon={<Table className="h-6 w-6" />} title="Extraction & structuring" text="Clauses, tables, riders and references pulled out and indexed for citation." />
            <Connector />
            <FlowStep icon={<LinkIcon className="h-6 w-6" />} title="Relational understanding" text="Links obligations, fees, and deadlines across sections for real context." />
            <Connector />
            <FlowStep icon={<Quote className="h-6 w-6" />} title="Clause‑level receipts" text="Every answer shows the exact page & section it came from." />
            <Connector />
            <FlowStep icon={<ShieldCheck className="h-6 w-6" />} title="Purpose‑built reasoning" text="Tuned for contracts — no hallucinated chit‑chat, just facts." />
          </div>

          <p className="mt-12 text-center text-sm italic text-muted-foreground">
            GPT guesses. Fineprnt proves it.
          </p>
        </section>

        {/* FEATURES */}
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

        {/* FEATURES */}
        <section id="features" className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-10">
              <Badge variant="secondary">Features</Badge>
              <h2 className="mt-3 text-3xl font-bold">Everything you need, completely free</h2>
              <p className="mt-2 text-muted-foreground">Fineprnt is open-source and free to use. Upload documents, ask questions, and get precise answers with citations.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {/* Document Processing */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition">
                <CardHeader>
                  <CardTitle>Document Processing</CardTitle>
                  <CardDescription>Upload any document type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">Unlimited<span className="text-sm font-normal text-muted-foreground"> documents</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> PDF, images, and more</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Automatic OCR and text extraction</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Smart semantic chunking</li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate('/app')}>Start uploading</Button>
                </CardContent>
              </Card>

              {/* AI Chat */}
              <Card className="border-0 shadow-medium ring-1 ring-primary/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1 shadow-soft">Core Feature</div>
                <CardHeader>
                  <CardTitle>AI Chat Assistant</CardTitle>
                  <CardDescription>Ask questions in plain English</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">Unlimited<span className="text-sm font-normal text-muted-foreground"> chat</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Natural language queries</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Precise answers with citations</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Page references included</li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate('/app')}>Start chatting</Button>
                </CardContent>
              </Card>

              {/* Open Source */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition">
                <CardHeader>
                  <CardTitle>Open Source</CardTitle>
                  <CardDescription>Free and self-hostable</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">100%<span className="text-sm font-normal text-muted-foreground"> free</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> No hidden costs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Self-hostable</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Community driven</li>
                  </ul>
                  <Button className="w-full" variant="outline" onClick={() => window.open('https://github.com/admlawson/fineprnt_open', '_blank')}>View on GitHub</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">What people say</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                { name: 'Independent Renter', quote: 'I almost missed a $250 fee in my lease. Fineprnt flagged it with the exact page. Sold.' },
                { name: 'New Hire', quote: 'The offer looked great until the non-compete. Fineprnt put the fine print in plain English.' },
              ].map((t, index) => (
                <Card key={index} className="border-0 shadow-soft">
                  <CardContent className="pt-6">
                    <p className="text-lg mb-4 italic">"{t.quote}"</p>
                    <div><p className="font-semibold">{t.name}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">Frequently asked questions</h2>
              <p className="text-muted-foreground mt-2">Everything you need to know about Fineprnt.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What file types do you support?</AccordionTrigger>
                <AccordionContent>
                  PDF, DOC, JPG. and more.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I upload multiple files at once?</AccordionTrigger>
                <AccordionContent>
                  Not yet. Right now, Fineprnt supports one combined upload per document.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is this legal advice?</AccordionTrigger>
                <AccordionContent>
                  No. Fineprnt makes contracts clear, but it’s not a substitute for a lawyer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Is my data safe?</AccordionTrigger>
                <AccordionContent>
                  Yes. All files are encrypted in transit and at rest.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 px-4 bg-gradient-primary">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Never sign blind again.</h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              From leases to offers to surprise bills - Fineprnt shows you the truth before it costs you.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/app')}>
              Get started for free
            </Button>
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
