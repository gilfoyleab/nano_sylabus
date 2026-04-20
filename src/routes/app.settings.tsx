import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui-ns/Button";
import { Badge } from "@/components/ui-ns/Badge";
import { Field, Input } from "@/components/ui-ns/Field";
import { getCurrentUser, updateCurrentUser, type MockUser } from "@/lib/auth";
import { setTheme, type Theme } from "@/lib/theme";
import {
  loadInvoices, updateInvoice, formatNPR, type Invoice,
} from "@/mockData/invoices";
import { emitInvoiceChange } from "@/components/PendingInvoiceBanner";

type Tab = "profile" | "academic" | "preferences" | "credits" | "subscription" | "billing" | "danger";

export const Route = createFileRoute("/app/settings")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab as Tab) || "profile",
    inv: (s.inv as string) || undefined,
  }),
  head: () => ({ meta: [{ title: "Settings · Nano Syllabus" }] }),
  component: SettingsPage,
});

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "academic", label: "Academic" },
  { id: "preferences", label: "Preferences" },
  { id: "credits", label: "Credits & Usage" },
  { id: "subscription", label: "Subscription" },
  { id: "billing", label: "Billing & Invoices" },
  { id: "danger", label: "Danger Zone" },
];

function SettingsPage() {
  const { tab, inv } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (t: Tab) =>
    navigate({ to: "/app/settings", search: { tab: t, inv: undefined }, replace: true });

  return (
    <AppShell title="Settings">
      {(user) => (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-6 md:flex-row md:px-8">
          <nav className="md:w-56 md:shrink-0">
            <ul className="flex gap-1 overflow-x-auto md:flex-col">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    className={
                      "w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition " +
                      (tab === t.id
                        ? "bg-bg-secondary font-medium text-text-primary"
                        : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary")
                    }
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <section className="flex-1 min-w-0">
            {tab === "profile" && <ProfileTab user={user} />}
            {tab === "academic" && <AcademicTab user={user} />}
            {tab === "preferences" && <PreferencesTab user={user} />}
            {tab === "credits" && <CreditsTab user={user} />}
            {tab === "subscription" && <SubscriptionTab user={user} />}
            {tab === "billing" && <BillingTab focusInv={inv} />}
            {tab === "danger" && <DangerTab />}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Card({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg-primary">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-border bg-bg-secondary px-5 py-3">{footer}</div>}
    </div>
  );
}

function ProfileTab({ user }: { user: MockUser }) {
  const [name, setName] = useState(user.name);
  return (
    <Card title="Profile" footer={<Button onClick={() => updateCurrentUser({ name })}>Save</Button>}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-tertiary font-mono-ui">{name[0]?.toUpperCase()}</div>
        <p className="text-xs text-text-muted">Profile picture coming soon.</p>
      </div>
      <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Email"><Input value={user.email} disabled /></Field>
    </Card>
  );
}

function AcademicTab({ user }: { user: MockUser }) {
  const [college, setCollege] = useState(user.college ?? "");
  const [grade, setGrade] = useState(user.grade ?? "");
  const [target, setTarget] = useState(user.targetGrade ?? "A+");
  return (
    <Card title="Academic profile" footer={<Button onClick={() => updateCurrentUser({ college, grade, targetGrade: target })}>Save</Button>}>
      <Field label="College"><Input value={college} onChange={(e) => setCollege(e.target.value)} /></Field>
      <Field label="Grade / Year"><Input value={grade} onChange={(e) => setGrade(e.target.value)} /></Field>
      <Field label="Target grade"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      <p className="text-xs text-text-muted">Subjects: {user.subjects?.join(", ") || "—"}</p>
    </Card>
  );
}

function PreferencesTab({ user }: { user: MockUser }) {
  const [lang, setLang] = useState(user.language ?? "EN");
  return (
    <Card title="Preferences" footer={<Button onClick={() => updateCurrentUser({ language: lang })}>Save</Button>}>
      <div>
        <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Default answer language</p>
        <div className="inline-flex rounded-full border border-border p-0.5">
          {(["EN", "RN"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={"rounded-full px-4 py-1.5 text-xs font-mono-ui " + (lang === l ? "bg-text-primary text-text-inverse" : "text-text-secondary")}>
              {l === "EN" ? "English" : "Roman Nepali"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Theme</p>
        <div className="inline-flex rounded-full border border-border p-0.5">
          {(["light", "dark"] as Theme[]).map((t) => (
            <button key={t} onClick={() => setTheme(t)} className="rounded-full px-4 py-1.5 text-xs font-mono-ui text-text-secondary hover:text-text-primary capitalize">{t}</button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CreditsTab({ user }: { user: MockUser }) {
  const used = user.creditsTotal - user.credits;
  const pct = Math.min(100, (used / user.creditsTotal) * 100);
  return (
    <Card title="Credits & usage">
      <div className="text-center">
        <p className="font-mono-ui text-xs text-text-muted">Available</p>
        <p className="mt-1 font-display text-6xl">🪙 {user.credits}</p>
        <p className="mt-1 text-xs text-text-muted">of {user.creditsTotal} this month</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
          <div className="h-full bg-text-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-bg-secondary text-text-muted">
            <tr><th className="px-3 py-2 text-left">Date</th><th className="text-left">Type</th><th className="text-right">Amount</th><th className="text-right pr-3">Reference</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr><td className="px-3 py-2">Today</td><td>Debit</td><td className="text-right">−1</td><td className="text-right pr-3 text-text-muted">Chat</td></tr>
            <tr><td className="px-3 py-2">Apr 1</td><td>Credit</td><td className="text-right text-[color:var(--green)]">+{user.creditsTotal}</td><td className="text-right pr-3 text-text-muted">Plan refresh</td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SubscriptionTab({ user }: { user: MockUser }) {
  return (
    <Card title="Subscription">
      <div className="flex items-center justify-between">
        <div>
          <Badge>{user.plan.toUpperCase()}</Badge>
          <p className="mt-2 text-sm text-text-secondary">Renews monthly · next on May 1</p>
        </div>
        <Link to="/plans"><Button>Upgrade</Button></Link>
      </div>
    </Card>
  );
}

/** ---------- Billing & Invoices (the payment flow) ---------- */

function BillingTab({ focusInv }: { focusInv?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [openId, setOpenId] = useState<string | null>(focusInv ?? null);

  const refresh = () => setInvoices(loadInvoices());
  useEffect(() => { refresh(); }, []);

  const open = invoices.find((i) => i.id === openId);

  return (
    <Card title="Billing & Invoices">
      {invoices.length === 0 && (
        <p className="text-sm text-text-muted">No invoices yet. <Link to="/plans" className="underline">Upgrade your plan →</Link></p>
      )}

      {invoices.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-bg-secondary text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Invoice</th>
                <th className="text-left">Plan</th>
                <th className="text-right">Total</th>
                <th className="text-left pl-3">Status</th>
                <th className="pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2 font-mono-ui">{i.id}</td>
                  <td>{i.planLabel} · {i.cycle}</td>
                  <td className="text-right font-mono-ui">{formatNPR(i.total)}</td>
                  <td className="pl-3"><StatusBadge s={i.status} /></td>
                  <td className="pr-3 text-right">
                    <button onClick={() => setOpenId(i.id)} className="text-text-secondary hover:text-text-primary">Open →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <InvoicePanel invoice={open} onClose={() => { setOpenId(null); refresh(); emitInvoiceChange(); }} onChange={refresh} />}
    </Card>
  );
}

function StatusBadge({ s }: { s: Invoice["status"] }) {
  const map: Record<Invoice["status"], { label: string; variant: "danger" | "warning" | "success" | "outline" }> = {
    pending_payment: { label: "Awaiting payment", variant: "warning" },
    pending_verification: { label: "Verifying", variant: "warning" },
    paid: { label: "Paid", variant: "success" },
    rejected: { label: "Rejected", variant: "danger" },
  };
  const { label, variant } = map[s];
  return <Badge variant={variant}>{label}</Badge>;
}

function InvoicePanel({ invoice, onClose, onChange }: { invoice: Invoice; onClose: () => void; onChange: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return setError("Please upload an image file.");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5 MB.");
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      updateInvoice(invoice.id, {
        screenshotName: file.name,
        screenshotData: String(reader.result),
        status: "pending_verification",
      });
      onChange();
      emitInvoiceChange();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-bg-primary p-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono-ui text-[10px] uppercase text-text-muted">Invoice</p>
            <h3 className="font-display text-3xl">{invoice.id}</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
        </div>

        <div className="mt-5 rounded-md border border-border bg-bg-secondary p-4 text-sm">
          <Row k="Plan" v={`${invoice.planLabel} · ${invoice.cycle}`} />
          <Row k="Customer" v={invoice.fullName} />
          <Row k="Phone" v={invoice.phone} />
          <Row k="Subtotal" v={formatNPR(invoice.amount)} mono />
          <Row k="VAT (13%)" v={formatNPR(invoice.vat)} mono />
          <div className="mt-2 border-t border-border pt-2"><Row k="Total" v={formatNPR(invoice.total)} mono bold /></div>
          <div className="mt-3"><StatusBadge s={invoice.status} /></div>
        </div>

        {invoice.status === "paid" ? (
          <p className="mt-6 rounded-md bg-[color:var(--note-green)] p-4 text-sm">
            ✓ Payment verified. Your <strong>{invoice.planLabel}</strong> plan is active.
          </p>
        ) : invoice.status === "rejected" ? (
          <div className="mt-6 rounded-md bg-[color:var(--note-red)] p-4 text-sm">
            <p>✗ Screenshot rejected. {invoice.rejectionReason && <em>"{invoice.rejectionReason}"</em>}</p>
            <p className="mt-2 text-xs text-text-muted">Re-upload below.</p>
          </div>
        ) : (
          <PaymentInstructions invoice={invoice} />
        )}

        {invoice.status !== "paid" && (
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">
              {invoice.screenshotData ? "Re-upload screenshot" : "Upload payment screenshot"}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-secondary p-6 text-xs text-text-muted transition hover:border-border-strong hover:text-text-primary"
            >
              <span className="text-2xl">📎</span>
              <span>{invoice.screenshotName || "Click to choose an image (PNG/JPG, ≤ 5 MB)"}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            {invoice.screenshotData && (
              <img src={invoice.screenshotData} alt="Payment proof" className="mt-3 max-h-64 w-full rounded-md border border-border object-contain" />
            )}
            {invoice.status === "pending_verification" && (
              <p className="mt-3 rounded-md bg-[color:var(--note-yellow)] p-3 text-xs text-text-primary">
                ⏳ Screenshot received. Admin will verify within 2 hours and your plan will activate automatically.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentInstructions({ invoice }: { invoice: Invoice }) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm font-medium">How to pay</p>
      <ol className="space-y-2 rounded-md border border-border bg-bg-primary p-4 text-sm text-text-secondary">
        <li><span className="font-mono-ui text-[10px] text-text-muted">1.</span> Open your mobile banking / eSewa / Khalti app.</li>
        <li><span className="font-mono-ui text-[10px] text-text-muted">2.</span> Pay <strong className="text-text-primary">{formatNPR(invoice.total)}</strong> by scanning the QR below.</li>
        <li><span className="font-mono-ui text-[10px] text-text-muted">3.</span> In the <strong>remarks / purpose</strong> field, enter exactly: <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono-ui">{invoice.id}</code></li>
        <li><span className="font-mono-ui text-[10px] text-text-muted">4.</span> Upload your payment screenshot below.</li>
      </ol>

      <div className="flex flex-col items-center rounded-md border border-border bg-bg-primary p-5">
        <div className="flex h-44 w-44 items-center justify-center rounded-md bg-bg-secondary">
          <span className="font-mono-ui text-[10px] text-text-muted">[ Your QR code here ]</span>
        </div>
        <p className="mt-3 text-center text-xs text-text-muted">Admin can replace this with the real QR image in the project assets.</p>
      </div>
    </div>
  );
}

function Row({ k, v, mono, bold }: { k: string; v: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className={"flex items-center justify-between " + (bold ? "font-medium" : "")}>
      <span className="text-text-muted">{k}</span>
      <span className={mono ? "font-mono-ui" : ""}>{v}</span>
    </div>
  );
}

function DangerTab() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  return (
    <Card title="Danger zone">
      <p className="text-sm text-text-secondary">Deleting your account is permanent. Type <code className="font-mono-ui">DELETE</code> to confirm.</p>
      <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
      <Button
        variant="danger"
        disabled={confirm !== "DELETE"}
        onClick={() => {
          localStorage.clear();
          navigate({ to: "/" });
        }}
      >
        Delete my account
      </Button>
    </Card>
  );
}

// silence unused import warning if user var not used by some tabs
void getCurrentUser;
