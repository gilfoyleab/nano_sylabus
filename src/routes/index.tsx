import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingNav, Logo } from "@/components/MarketingNav";
import { Button } from "@/components/ui-ns/Button";
import { Badge } from "@/components/ui-ns/Badge";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  {
    icon: "💬",
    title: "Bilingual AI chat",
    body: "Ask in English or Roman Nepali. Get answers in the language you think in.",
  },
  {
    icon: "🎯",
    title: "Curriculum-aligned",
    body: "Answers grounded in NEB, TU, PU and KU syllabi — not generic Wikipedia.",
  },
  {
    icon: "📚",
    title: "Save to revision notes",
    body: "Bookmark any answer with colour labels and review with flashcards.",
  },
  {
    icon: "🪙",
    title: "Credit-based usage",
    body: "Pay only for what you use. Free tier included. No surprise bills.",
  },
];

const PLANS = [
  { name: "Free", price: "NPR 0", period: "forever", credits: "20 credits / mo", notes: "50 notes", revision: "—", cta: "Start free", popular: false },
  { name: "Basic", price: "NPR 299", period: "/ month", credits: "200 credits / mo", notes: "200 notes", revision: "Revision Mode", cta: "Get Basic", popular: false },
  { name: "Pro", price: "NPR 699", period: "/ month", credits: "600 credits / mo", notes: "500 notes", revision: "Revision + PDF export", cta: "Get Pro", popular: true },
  { name: "Unlimited", price: "NPR 1,299", period: "/ month", credits: "Unlimited*", notes: "Unlimited", revision: "Revision + PDF export", cta: "Go Unlimited", popular: false },
];

const TESTIMONIALS = [
  { quote: "It explains physics in Roman Nepali like my tuition teacher used to. Saved me before boards.", name: "Anish K.", meta: "Class 12 · St. Xavier's" },
  { quote: "I dump my doubts at 1am and it just gets the NEB syllabus. The notes feature is unreal.", name: "Pratiksha R.", meta: "Class 11 · Trinity" },
  { quote: "Finally an AI that doesn't pretend to know our courses. The revision flashcards are gold.", name: "Sujan M.", meta: "BBS Yr 2 · TU" },
];

const FAQS = [
  { q: "What is Roman Nepali?", a: "Nepali written using English letters — like 'kaha cha?' instead of कहाँ छ?. We understand it natively." },
  { q: "How do credits work?", a: "Each AI response costs 1 credit. Credits refresh monthly based on your plan. Unused free credits don't roll over." },
  { q: "Which boards & universities are supported?", a: "NEB, Tribhuvan University (TU), Pokhara University (PU), Kathmandu University (KU) and CTEVT." },
  { q: "Is there really a free plan?", a: "Yes — 20 credits/month forever. No card required. Upgrade only when you need more." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings → Subscription. Your plan remains active until the end of the billing cycle." },
  { q: "How do you handle payments in Nepal?", a: "We accept eSewa and Khalti via QR. After payment, your plan activates within 2 hours of verification." },
  { q: "Are my chats private?", a: "Your chats are stored securely and only visible to you. We never sell or share student data." },
  { q: "Do I need to install anything?", a: "No. It works in any browser. You can also install it as a PWA on Android for a native-app feel." },
];

function Landing() {
  return (
    <div className="bg-bg-primary text-text-primary">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-dotgrid opacity-60 animate-drift" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-5 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <div className="mb-6 flex justify-center">
            <Badge variant="mono">v1.0 · for Nepal</Badge>
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Your AI study companion,
            <br />
            <em className="italic">bespoke to Nepal's curriculum.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base font-light text-text-secondary sm:text-lg">
            Ask in English or Roman Nepali. Get answers grounded in NEB, TU, PU & KU syllabi — in seconds.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg">Sign up free →</Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">View plans</Button>
            </a>
          </div>
          <p className="mt-5 text-xs text-text-muted font-mono-ui">
            20 free credits · no card required
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-mono-ui uppercase text-text-muted">01 · features</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Built for the way Nepali students actually study.</h2>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 border border-border">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-bg-primary p-7 transition hover:bg-bg-secondary">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-mono-ui uppercase text-text-muted">02 · pricing</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Plans for every student.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">Start free. Upgrade when boards approach.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-lg bg-bg-primary p-6 transition " +
                  (p.popular
                    ? "border-2 border-border-strong shadow-lg"
                    : "border border-border hover:border-border-strong")
                }
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-text-primary px-3 py-1 text-[10px] font-mono-ui uppercase tracking-wider text-text-inverse">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-2xl">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl">{p.price}</span>
                  <span className="text-xs text-text-muted">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-text-secondary">
                  <li>✓ {p.credits}</li>
                  <li>✓ {p.notes}</li>
                  <li>{p.revision === "—" ? "✗" : "✓"} {p.revision === "—" ? "No revision mode" : p.revision}</li>
                </ul>
                <Link to="/signup" className="mt-7">
                  <Button variant={p.popular ? "filled" : "outline"} className="w-full">
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12">
            <p className="text-xs font-mono-ui uppercase text-text-muted">03 · students</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Loved by students from Class 9 to TU.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-lg border border-border bg-bg-primary p-7">
                <blockquote className="font-display text-xl italic leading-snug">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary font-mono-ui text-xs">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.meta}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <p className="text-xs font-mono-ui uppercase text-text-muted">04 · faq</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Questions, answered.</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {FAQS.map((f, i) => (
              <FaqRow key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            <a href="#" className="hover:text-text-primary">Privacy</a>
            <a href="#" className="hover:text-text-primary">Terms</a>
            <a href="#" className="hover:text-text-primary">Contact</a>
            <Link to="/login" className="hover:text-text-primary">Login</Link>
          </nav>
          <p className="font-mono-ui text-xs text-text-muted">© 2026 Nano Syllabus · Made in Kathmandu</p>
        </div>
      </footer>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-medium">{q}</span>
        <span className={"text-text-muted transition " + (open ? "rotate-45" : "")}>+</span>
      </button>
      <div
        className="overflow-hidden text-sm text-text-secondary transition-all"
        style={{ maxHeight: open ? 200 : 0 }}
      >
        <p className="pb-5 pr-10 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}
