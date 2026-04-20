import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/MarketingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui-ns/Button";
import { Field, Input } from "@/components/ui-ns/Field";
import {
  PLANS, createInvoice, formatNPR, type PlanSpec,
} from "@/mockData/invoices";
import { emitInvoiceChange } from "@/components/PendingInvoiceBanner";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Plans · Nano Syllabus" }] }),
  component: PlansPage,
});

function PlansPage() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [picked, setPicked] = useState<PlanSpec | null>(null);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/app/chat" className="text-sm text-text-secondary hover:text-text-primary">Back to app</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="font-mono-ui text-xs uppercase text-text-muted">Plans</p>
          <h1 className="mt-2 font-display text-5xl">Choose your plan</h1>
          <p className="mt-3 text-sm text-text-secondary">Pay via mobile banking. Activate within 2 hours of admin verification.</p>

          <div className="mt-7 inline-flex rounded-full border border-border p-1">
            {(["monthly", "annual"] as const).map((c) => (
              <button key={c} onClick={() => setCycle(c)}
                className={
                  "rounded-full px-5 py-2 text-xs font-mono-ui transition " +
                  (cycle === c ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                }>
                {c === "monthly" ? "Monthly" : "Annual · 2 months free"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FreeCard />
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} cycle={cycle} popular={p.id === "pro"} onPick={() => setPicked(p)} />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-text-muted font-mono-ui">
          Annual = pay for 10 months, get 12 · Includes 13% VAT
        </p>
      </section>

      {picked && (
        <CheckoutModal
          plan={picked}
          cycle={cycle}
          onClose={() => setPicked(null)}
          onCreated={(invId) => {
            emitInvoiceChange();
            navigate({ to: "/app/settings", search: { tab: "billing", inv: invId } });
          }}
        />
      )}
    </div>
  );
}

function FreeCard() {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-bg-primary p-6">
      <h3 className="font-display text-2xl">Free</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-4xl">NPR 0</span>
        <span className="text-xs text-text-muted">forever</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm text-text-secondary">
        <li>✓ 20 credits / mo</li>
        <li>✓ 50 notes</li>
        <li>✗ Revision Mode</li>
      </ul>
      <Link to="/signup" className="mt-7"><Button variant="outline" className="w-full">Start free</Button></Link>
    </div>
  );
}

function PlanCard({ plan, cycle, popular, onPick }: { plan: PlanSpec; cycle: "monthly" | "annual"; popular: boolean; onPick: () => void }) {
  const price = cycle === "monthly" ? plan.monthly : plan.annual;
  return (
    <div className={"relative flex flex-col rounded-lg bg-bg-primary p-6 " + (popular ? "border-2 border-border-strong shadow-lg" : "border border-border")}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-text-primary px-3 py-1 text-[10px] font-mono-ui uppercase text-text-inverse">Most popular</span>
      )}
      <h3 className="font-display text-2xl">{plan.label}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-4xl">{formatNPR(price)}</span>
        <span className="text-xs text-text-muted">/ {cycle === "monthly" ? "month" : "year"}</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm text-text-secondary">
        <li>✓ {plan.credits}</li>
        <li>✓ {plan.notes}</li>
        <li>✓ {plan.revision}</li>
      </ul>
      <Button onClick={onPick} variant={popular ? "filled" : "outline"} className="mt-7 w-full">
        Get {plan.label}
      </Button>
    </div>
  );
}

function CheckoutModal({ plan, cycle, onClose, onCreated }: {
  plan: PlanSpec; cycle: "monthly" | "annual";
  onClose: () => void; onCreated: (invId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setName(u.name);
  }, []);

  const submit = () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 2 || cleanName.length > 80) return setError("Enter your full name.");
    if (!/^[0-9+\- ]{7,15}$/.test(cleanPhone)) return setError("Enter a valid phone number.");
    setError("");
    const inv = createInvoice({ plan, cycle, fullName: cleanName, phone: cleanPhone });
    onCreated(inv.id);
  };

  const price = cycle === "monthly" ? plan.monthly : plan.annual;
  const vat = Math.round(price * 0.13);
  const total = price + vat;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-bg-primary p-6 animate-slide-up">
        <h3 className="font-display text-2xl">Order details</h3>
        <p className="mt-1 text-xs text-text-muted">Step 1 of 2 · Confirm your details to generate an invoice.</p>

        <div className="mt-5 rounded-md border border-border bg-bg-secondary p-4 text-sm">
          <div className="flex justify-between"><span>{plan.label} · {cycle}</span><span className="font-mono-ui">{formatNPR(price)}</span></div>
          <div className="mt-1 flex justify-between text-text-muted"><span>VAT (13%)</span><span className="font-mono-ui">{formatNPR(vat)}</span></div>
          <div className="mt-2 border-t border-border pt-2 flex justify-between font-medium"><span>Total</span><span className="font-mono-ui">{formatNPR(total)}</span></div>
        </div>

        <div className="mt-5 space-y-3">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Your name on the bill" />
          </Field>
          <Field label="Phone number" error={error || undefined}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} placeholder="98XXXXXXXX" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Generate invoice →</Button>
        </div>
      </div>
    </div>
  );
}
