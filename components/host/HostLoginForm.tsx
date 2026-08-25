"use client";

import { useState, type FormEvent } from "react";

export function HostLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/host/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("Incorrect password.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface flex w-full max-w-sm flex-col gap-4 px-7 py-9">
      <h1 className="font-display text-xl text-ink">Host access</h1>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="focus-ring w-full rounded-[12px] border px-4 py-3 text-base text-ink outline-none"
        style={{ borderColor: "var(--hairline)" }}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting || !password} className="action-primary focus-ring">
        {submitting ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
