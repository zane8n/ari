import { NextResponse } from "next/server";
import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { getDb } from "@/db/client";
import { budgetItems, itineraryEvents, tripDays } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { buildCoachSystemPrompt } from "@/lib/trip/coachContext";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const messages = json?.messages as UIMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages." }, { status: 400 });
  }
  // A hard cap keeps a runaway client from ballooning the request into the model.
  const recentMessages = messages.slice(-30);

  const db = getDb();
  const [budgetRows, eventRows, dayRows] = await Promise.all([
    db.select().from(budgetItems),
    db.select().from(itineraryEvents),
    db.select().from(tripDays),
  ]);

  const env = getEnv();
  const systemPrompt = buildCoachSystemPrompt({
    budgetItemRows: budgetRows,
    events: eventRows,
    tripDays: dayRows,
    meta: {
      destination: env.TRIP_DESTINATION,
      homeBase: env.TRIP_HOME_BASE,
      cashBudgetUsd: env.TRIP_CASH_BUDGET_USD,
      reserveBudgetUsd: env.TRIP_RESERVE_BUDGET_USD,
    },
  });

  try {
    const result = streamText({
      model: "anthropic/claude-sonnet-5",
      system: systemPrompt,
      messages: await convertToModelMessages(recentMessages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch {
    return NextResponse.json({ error: "The trip coach couldn't be reached — try again in a moment." }, { status: 502 });
  }
}
