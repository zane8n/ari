"use client";

import { useState } from "react";

export function DeleteInviteButton({ publicId, label }: { publicId: string; label: string }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    const confirmed = window.confirm(`Delete this invite (${label})? This can't be undone.`);
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/host/invite/${publicId}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Could not delete — try again.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Could not delete — try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-ink-muted underline hover:text-red-600 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete invite"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
