import { NextResponse } from "next/server";
import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { loadTripBundle } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { buildCoachSystemPrompt } from "@/lib/trip/coachContext";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write");
  if ("response" in resolved) return resolved.response;

  const json = await request.json().catch(() => null);
  const messages = json?.messages as UIMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages." }, { status: 400 });
  }
  // A hard cap keeps a runaway client from ballooning the request into the model.
  const recentMessages = messages.slice(-30);

  const systemPrompt = buildCoachSystemPrompt(await loadTripBundle(resolved.trip));

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
