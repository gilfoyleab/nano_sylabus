export type InvoiceStatus = "pending_payment" | "pending_verification" | "paid" | "rejected";

export interface Invoice {
  id: string;            // INV-XXXX
  plan: "basic" | "pro" | "unlimited";
  planLabel: string;
  amount: number;        // NPR
  vat: number;           // NPR
  total: number;         // NPR
  cycle: "monthly" | "annual";
  fullName: string;
  phone: string;
  status: InvoiceStatus;
  createdAt: number;
  screenshotName?: string;
  screenshotData?: string;  // base64 data url (stored locally only)
  rejectionReason?: string;
}

const KEY = "ns-invoices";
const COUNTER_KEY = "ns-invoice-counter";

export function loadInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Invoice[]; } catch { return []; }
}

export function saveInvoices(list: Invoice[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function nextInvoiceNumber(): string {
  const cur = parseInt(localStorage.getItem(COUNTER_KEY) || "1041", 10);
  const next = cur + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return "INV-" + String(next).padStart(4, "0");
}

export interface PlanSpec {
  id: "basic" | "pro" | "unlimited";
  label: string;
  monthly: number;
  annual: number;
  credits: string;
  notes: string;
  revision: string;
}

export const PLANS: PlanSpec[] = [
  { id: "basic", label: "Basic", monthly: 299, annual: 2990, credits: "200 credits / mo", notes: "200 notes", revision: "Revision Mode" },
  { id: "pro", label: "Pro", monthly: 699, annual: 6990, credits: "600 credits / mo", notes: "500 notes", revision: "Revision + PDF export" },
  { id: "unlimited", label: "Unlimited", monthly: 1299, annual: 12990, credits: "Unlimited credits", notes: "Unlimited notes", revision: "Revision + PDF export" },
];

const VAT_RATE = 0.13;

export function createInvoice(opts: {
  plan: PlanSpec;
  cycle: "monthly" | "annual";
  fullName: string;
  phone: string;
}): Invoice {
  const base = opts.cycle === "monthly" ? opts.plan.monthly : opts.plan.annual;
  const vat = Math.round(base * VAT_RATE);
  const total = base + vat;
  const inv: Invoice = {
    id: nextInvoiceNumber(),
    plan: opts.plan.id,
    planLabel: opts.plan.label,
    amount: base,
    vat,
    total,
    cycle: opts.cycle,
    fullName: opts.fullName,
    phone: opts.phone,
    status: "pending_payment",
    createdAt: Date.now(),
  };
  saveInvoices([inv, ...loadInvoices()]);
  return inv;
}

export function updateInvoice(id: string, patch: Partial<Invoice>) {
  const all = loadInvoices().map((i) => (i.id === id ? { ...i, ...patch } : i));
  saveInvoices(all);
  return all.find((i) => i.id === id) || null;
}

export function deleteInvoice(id: string) {
  saveInvoices(loadInvoices().filter((i) => i.id !== id));
}

export function getPendingInvoice(): Invoice | null {
  return loadInvoices().find(
    (i) => i.status === "pending_verification" || i.status === "pending_payment",
  ) || null;
}

export function formatNPR(n: number): string {
  return "NPR " + n.toLocaleString("en-IN");
}
