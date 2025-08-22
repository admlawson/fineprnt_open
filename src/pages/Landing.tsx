import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import {
  FileText,
  MessageSquare,
  Shield,
  Zap,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  LineChart,
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

  // SEO: title, description, canonical, structured data
  React.useEffect(() => {
    const title = 'Fineprnt — Chat with Any Contract in Plain English';
    const description =
      'Any Contract. Any Question, Clarity in Seconds. Dont get caught in the fine print. Upload any contract and ask any question in plain English. We handle the rest.';
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
      name: 'fineprnt',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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

  const features = [
    { icon: Zap, title: 'Calrity in Seconds', description: 'Upload, ask, and get plain‑English answers with citations fast.' },
    { icon: Search, title: 'Proof you can act on', description: 'Every response cites the exact clause and page.' },
    { icon: MessageSquare, title: 'No legal training required', description: 'Anyone can resolve fine print confidently.' },
  ];

  const testimonials = [
    {
      name: 'Independent Practice Manager',
      role: '',
      company: '',
      quote:
        'I used to spend nights combing through policies. Now I get answers in seconds—with the page number right there.',
    },
    {
      name: 'Solo Practitioner',
      role: '',
      company: '',
      quote:
        'fineprnt caught a clause that would have cost me thousands. The citations make approvals painless.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      <main role="main" id="content">
        {/* HERO with parallax media */}
        <section
          ref={heroRef}
          aria-label="Doctor helping a child—fineprnt helps you get clear answers from contracts"
          className="relative h-[100vh] sm:h-[90vh] md:h-[85vh] overflow-hidden pt-16 sm:pt-20 md:pt-16"
        >
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ transform: reduceMotion ? undefined : `translateY(${offsetY * 0.15}px)` }}
          >
            {/* LCP-critical image - theme aware */}
            <img
              key={`hero-image-${resolvedTheme}`}
              src={resolvedTheme === 'dark' 
                ? "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-dark.png"
                : "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-light.png"
              }
              alt=""
              className="absolute inset-0 h-full w-full hero-media"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {/* Lightweight video only when motion is allowed - theme aware */}
            {!reduceMotion && (
              <video
              key={`hero-video-${resolvedTheme}`}
              className="absolute inset-0 h-full w-full hero-media"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={resolvedTheme === 'dark' 
                ? "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-dark.png"
                : "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-light.png"
              }
              aria-hidden="true"
            >
              <source 
                src={resolvedTheme === 'dark' 
                  ? "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-dark-animated.mp4"
                  : "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-light-animated.mp4"
                } 
                type="video/mp4" 
              />
              <source 
                src={resolvedTheme === 'dark' 
                  ? "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-dark-animated.webm"
                  : "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt-hero-light-animated.webm"
                } 
                type="video/webm" 
              />
              Your browser does not support the video tag.
              </video>
            )}

          </div>

          <div className="relative h-full flex items-center justify-center">
            <div
              className="mx-auto max-w-3xl text-center px-6 sm:px-8 md:px-12 hero-overlay"
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
                }`}></div>
              </div>

              <h1 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight leading-tight ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                Any Document. Any Question. Clarity in Seconds.
              </h1>

              <p className={`mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm md:text-base max-w-xl sm:max-w-2xl mx-auto leading-relaxed ${
                resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/80'
              }`}>
                Dont get caught in the fine print. Upload any contract and ask questions in plain English.
              </p>

              <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <Button size="default" className="w-full sm:w-auto text-sm sm:text-base" onClick={() => navigate('/login')}>
                  Start here
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  How it works
                </Button>
              </div>

              <div className={`mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm ${
                resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'
              }`}>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" /> 
                  <span className="text-center">Clarity in seconds</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" /> 
                  <span className="text-center">Citations you can trust</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" /> 
                  <span className="text-center">Guidance when needed</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" /> 
                  <span className="text-center">Peace of mind</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blend hero into next section (helpers are defined in index.css) */}
          <div className="hero-fade z-[1]" />
          {/* <div className="hero-glow z-[1]" /> */}
        </section>

        <section id="how-it-works" className="px-4 py-14 section-muted has-top-divider">
          <div className="container mx-auto">
            <div className="text-center mb-10">
              <Badge variant="secondary">How it works</Badge>
              <h2 className="mt-3 text-3xl font-bold">From PDF to peace of mind</h2>
              <p className="mt-2 text-muted-foreground">Made for individuals handling real-world payer paperwork</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>Upload</CardTitle>
                  <CardDescription>Drop in any contract or policy PDF.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Drag-and-drop PDFs—no templates.</CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>We structure it for you</CardTitle>
                  <CardDescription>AI pulls out clauses and keeps them citation-ready.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Pagination and headings stay intact for citations.</CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>Ask anything</CardTitle>
                  <CardDescription>“Does this contract cover X?” → instant answer with page number.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Share, export, and align teams.</CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">Before & After</h2>
              <p className="mt-2 text-muted-foreground">From buried in PDFs to confident, citation‑backed answers.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 place-items-center">
              {/* Before card */}
              <div className="w-full max-w-[460px] rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-soft mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Before fineprnt</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden="true" /> Hours lost searching clauses</li>
                  <li className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden="true" /> Missed updates that cost real money</li>
                  <li className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden="true" /> Stress over denials and compliance gaps</li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full px-3 py-1 border border-destructive/30 text-destructive/90 bg-white/40 dark:bg-transparent">Manual review</span>
                  <span className="rounded-full px-3 py-1 border border-destructive/30 text-destructive/90 bg-white/40 dark:bg-transparent">Uncertain citations</span>
                </div>
              </div>

              {/* After card */}
              <div className="w-full max-w-[460px] rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-soft mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">After fineprnt</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /> Clear answers in seconds</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /> Citations on every claim</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /> Confidence in audits and approvals</li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full px-3 py-1 border border-primary/30 text-primary bg-white/40 dark:bg-transparent">−80% time on reviews</span>
                  <span className="rounded-full px-3 py-1 border border-primary/30 text-primary bg-white/40 dark:bg-transparent">Fewer denials</span>
                  <span className="rounded-full px-3 py-1 border border-primary/30 text-primary bg-white/40 dark:bg-transparent">Audit‑ready</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-sm text-muted-foreground mb-4">Trade late‑night PDF dives for fast, cited answers.</p>
              <Button size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>See pricing</Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Why Teams Rely on fineprnt</h2>
              <p className="text-muted-foreground mt-2">Outcome‑driven answers that move work forward.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
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

        {/* Pricing */}
        <section id="pricing" className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-10">
              <Badge variant="secondary">Pricing</Badge>
              <h2 className="mt-3 text-3xl font-bold">Pick the plan that fits</h2>
              <p className="mt-2 text-muted-foreground">Start Here. Upgrade when you need more documents.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {/* Basic */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition">
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>For trying fineprnt on a single contract</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$20<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> 1 document / month</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Unlimited chat</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Clause‑level citations</li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate('/login?plan=basic')}>Start with Basic</Button>
                </CardContent>
              </Card>

              {/* Pro (Most popular) */}
              <Card className="border-0 shadow-medium ring-1 ring-primary/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1 shadow-soft">Most popular</div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>For ongoing work and multiple contracts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$40<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> 5 documents / month</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Unlimited chat</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Priority processing</li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate('/login?plan=pro')}>Upgrade to Pro</Button>
                </CardContent>
              </Card>

              {/* One‑time credit */}
              <Card className="border-0 shadow-soft hover:shadow-medium transition">
                <CardHeader>
                  <CardTitle>One‑time credit</CardTitle>
                  <CardDescription>Need just one more document this month?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$12<span className="text-sm font-normal text-muted-foreground"> one‑time</span></div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Adds 1 document credit</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Works with any plan</li>
                  </ul>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/login?purchase=credit')}>Buy a credit</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Impact CTA: text + image */}
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-8 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs md:text-sm">
                Built for real care, not just paperwork
              </div>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                Less time on paperwork means more time with patients
              </h2>
              <p className="mt-4 text-muted-foreground">
                Ask once, see the source, and move on
              </p>
              <p className="mt-1 text-muted-foreground">
                The answer you need, with the citation you can trust
              </p>
              <blockquote className="mt-6 text-sm italic text-muted-foreground/90">
                “Behind every claim is a patient. Behind every denial is lost care. fineprnt helps your team fight for both.”
              </blockquote>
              <div className="mt-6 flex gap-3">
                <Button size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>View pricing</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>Start Here</Button>
              </div>
            </div>
            {/* Image */}
            <div className="relative">
              <img
                src="https://api.fineprnt.com/storage/v1/object/public/website/public/EmotionalCTA.png"
                alt="Clinician reassuring a patient — focus on care, not paperwork"
                className="w-full h-auto rounded-xl shadow-medium object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">What people say</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-soft">
                  <CardContent className="pt-6">
                    <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">Frequently asked questions</h2>
              <p className="text-muted-foreground mt-2">Everything you need to know about fineprnt.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What kinds of documents work best?</AccordionTrigger>
                <AccordionContent>
                  Payer contracts, riders, medical policies, and related guidance. Upload PDFs and we handle OCR and structure for reliable citations.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do citations work?</AccordionTrigger>
                <AccordionContent>
                  Every answer includes citations to the original clause and page so reviewers can validate context immediately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can teams collaborate?</AccordionTrigger>
                <AccordionContent>
                  Not currently. We are hard at work to add this and other features to the application.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How is our data protected?</AccordionTrigger>
                <AccordionContent>
                  Data is encrypted in transit and at rest with fine-grained authorization controls.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-primary">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Stop guessing. Start recovering what you’ve earned.</h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              fineprnt gives you clarity, confidence, and control — in minutes.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Start Here today
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};
