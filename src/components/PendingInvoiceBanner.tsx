import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPendingInvoice, type Invoice } from "@/mockData/invoices";

export function PendingInvoiceBanner() {
  const [inv, setInv] = useState<Invoice | null>(null);

  useEffect(() => {
    const refresh = () => setInv(getPendingInvoice());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("ns:invoice-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ns:invoice-changed", refresh);
    };
  }, []);

  if (!inv) return null;

  const isUploaded = inv.status === "pending_verification";

  return (
    <div className="border-b border-border bg-[color:var(--note-yellow)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-text-primary">
          <span className="font-mono-ui">⏳ {inv.id}</span>
          <span className="hidden text-text-secondary sm:inline">
            {isUploaded
              ? `Payment screenshot uploaded — awaiting admin verification (usually under 2 hours).`
              : `Complete payment for your ${inv.planLabel} plan to activate access.`}
          </span>
          <span className="text-text-secondary sm:hidden">
            {isUploaded ? "Awaiting verification" : "Payment pending"}
          </span>
        </div>
        <Link
          to="/app/settings"
          search={{ tab: "billing" }}
          className="font-mono-ui underline underline-offset-2 hover:no-underline"
        >
          {isUploaded ? "View status →" : "Pay now →"}
        </Link>
      </div>
    </div>
  );
}

/** Helper to dispatch the change event after writing invoices. */
export function emitInvoiceChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ns:invoice-changed"));
  }
}
