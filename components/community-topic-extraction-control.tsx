"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Loader2, RefreshCw } from "lucide-react";
import type { CommunitySubject } from "@/lib/communities";

type ExtractionSubject = Pick<
  CommunitySubject,
  "id" | "name" | "publicationStatus" | "topicSyncStatus"
>;
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

export function CommunityTopicExtractionControl({
  communitySlug,
  subject,
  onExtracted,
}: {
  communitySlug: string;
  subject: ExtractionSubject;
  onExtracted?: () => Promise<unknown> | void;
}) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<"ready" | "empty" | null>(null);
  const [publicationResult, setPublicationResult] = useState<"published" | null>(null);
  const status = result ?? subject.topicSyncStatus;
  const published = publicationResult === "published" || subject.publicationStatus === "published";

  async function extract() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/communities/${encodeURIComponent(communitySlug)}/subjects/${encodeURIComponent(subject.id)}/sync-topics`,
        { method: "POST", headers: { Accept: "application/json" } },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        topics?: unknown[];
        topicSyncStatus?: string;
        publicationStatus?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not publish subject. Try again.");
      if (
        !Array.isArray(payload.topics) ||
        payload.topicSyncStatus !== "ready" ||
        payload.publicationStatus !== "published"
      ) {
        throw new Error("Could not confirm publication. Please try again.");
      }
      setResult("ready");
      setPublicationResult("published");
      setNotice(
        `${subject.name} is published with ${payload.topics.length} challenge topic${payload.topics.length === 1 ? "" : "s"}.`,
      );
      try {
        if (onExtracted) await onExtracted();
        else router.refresh();
      } catch {
        setNotice(
          "Extraction finished, but this view could not refresh. Reload to see the latest status.",
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not publish subject. Try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="w-full rounded-lg border border-border bg-bg-secondary p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {published
              ? "Published to community members"
              : status === "error"
                ? "Subject publishing needs attention"
                : "Ready to publish?"}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            {published
              ? "Members can access this subject. Refresh after adding or changing indexed material."
              : "Publishing extracts topics from indexed syllabus and notes, prepares member challenges, and makes the subject visible to community members."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void extract()}
          disabled={busy}
          aria-busy={busy}
          aria-label={`${published ? "Refresh published" : "Publish"} subject ${subject.name}`}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-text-primary px-4 text-sm font-medium text-text-inverse hover:opacity-90 disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          {busy ? (
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
          ) : published ? (
            <RefreshCw className="size-4" aria-hidden="true" />
          ) : (
            <Globe2 className="size-4" aria-hidden="true" />
          )}
          {busy
            ? published
              ? "Refreshing published subject…"
              : "Publishing subject…"
            : error
              ? "Retry publishing"
              : published
                ? "Refresh published subject"
                : "Publish subject"}
        </button>
      </div>
      {busy ? (
        <p role="status" className="mt-3 text-xs text-text-secondary">
          Reading indexed material, extracting topics, and preparing member challenges. This may
          take a minute.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm text-text-secondary">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
