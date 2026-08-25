import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatVacationDateRange } from "@/lib/reveal/countdown";
import type { RevealSignature } from "@/lib/reveal/types";
import { THEMES, type ThemeId } from "@/lib/theme/themes";

const WIDTH = 1080;
const HEIGHT = 1350;
const CANVAS = "#FBF2F8";
const INK = "#2B1830";
const INK_MUTED = "#7A6482";
const GILT = "#CAA15A";

async function loadFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [displayBold, displayItalic, script, bodyMedium, bodyBold] = await Promise.all([
    readFile(path.join(dir, "CormorantGaramond-Bold.woff")),
    readFile(path.join(dir, "CormorantGaramond-Italic.woff")),
    readFile(path.join(dir, "Parisienne-Regular.woff")),
    readFile(path.join(dir, "Quicksand-Medium.woff")),
    readFile(path.join(dir, "Quicksand-Bold.woff")),
  ]);
  return { displayBold, displayItalic, script, bodyMedium, bodyBold };
}

export function sanitizeFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "invitation"
  );
}

/** Renders the drawn strokes at card scale, or the typed value in the script face. */
function SignatureMark({ signature, color }: { signature: RevealSignature; color: string }) {
  if (signature.kind === "typed") {
    return (
      <div style={{ display: "flex", fontSize: 32, fontFamily: "Script", color }}>
        {signature.value}
      </div>
    );
  }
  return (
    <svg viewBox={signature.viewBox} width={210} height={85}>
      {signature.paths.map((d, index) => (
        <path key={index} d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

const VINE_D = ["M4 4c14 0 24 8 28 22", "M10 6c2 4 2 7-1 10", "M17 10c1 4 0 7-3 9", "M24 16c1 4 0 7-3 9", "M30 24c1 4 0 7-3 9"];

/** One corner's vine flourish — mirrored via CSS transform to cover all four corners from one path set. */
function CornerVine({ corner, color }: { corner: "tl" | "tr" | "bl" | "br"; color: string }) {
  const position: Record<string, number | string> = { position: "absolute", display: "flex" };
  if (corner === "tl" || corner === "tr") position.top = 28;
  else position.bottom = 28;
  if (corner === "tl" || corner === "bl") position.left = 28;
  else position.right = 28;
  if (corner === "tr") position.transform = "scaleX(-1)";
  else if (corner === "bl") position.transform = "scaleY(-1)";
  else if (corner === "br") position.transform = "scale(-1, -1)";

  return (
    <div style={position}>
      <svg viewBox="0 0 64 64" width={64} height={64} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        {VINE_D.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </svg>
    </div>
  );
}

function RoseMark({ color, size = 34 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 22a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
      <path d="M20 22a4 4 0 1 1 0-8" />
      <path d="M20 22c0 6-1 9-5 12" />
      <path d="M20 22c0 6 1 9 5 12" />
      <path d="M13 30c-2 1-3 1-5 0" />
      <path d="M27 30c2 1 3 1 5 0" />
    </svg>
  );
}

function OrnamentDivider({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", width: 64, height: 1, backgroundColor: color }} />
      <svg viewBox="0 0 24 24" width={14} height={14} fill={color} stroke="none">
        <path d="M12 2c0 4 1 8 5 10-4 2-5 6-5 10-0-4-1-8-5-10 4-2 5-6 5-10Z" />
      </svg>
      <div style={{ display: "flex", width: 64, height: 1, backgroundColor: color }} />
    </div>
  );
}

export async function renderInvitationCard(params: {
  preferredName: string;
  themeId: ThemeId;
  destination: string;
  startIso: string;
  endIso: string;
  note: string;
  signature: RevealSignature;
}): Promise<ImageResponse> {
  const theme = THEMES[params.themeId] ?? THEMES["sky-flirt"];
  const fonts = await loadFonts();
  const hairline = "#2B183026";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "48px",
          backgroundColor: CANVAS,
          backgroundImage: `linear-gradient(160deg, ${theme.tokens.accentMist}, ${CANVAS} 55%)`,
          fontFamily: "Body-Medium",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            border: `1px solid ${GILT}99`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              bottom: 10,
              display: "flex",
              border: `1px solid ${GILT}55`,
            }}
          />

          <CornerVine corner="tl" color={theme.tokens.accentStrong} />
          <CornerVine corner="tr" color={theme.tokens.accentStrong} />
          <CornerVine corner="bl" color={theme.tokens.accentStrong} />
          <CornerVine corner="br" color={theme.tokens.accentStrong} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "72px 104px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", fontSize: 40, fontFamily: "Script", color: theme.tokens.accentStrong }}>
              Lover&rsquo;s Bid
            </div>

            <div style={{ display: "flex", marginTop: 18 }}>
              <OrnamentDivider color={hairline} />
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 21,
                letterSpacing: 4,
                color: theme.tokens.accentStrong,
                textTransform: "uppercase",
                fontFamily: "Body-Bold",
              }}
            >
              Application... shockingly... approved
            </div>

            <div style={{ display: "flex", marginTop: 44, fontSize: 50, lineHeight: 1.15, fontFamily: "Display-Bold", color: INK, maxWidth: 780 }}>
              {params.preferredName}, this is really happening.
            </div>

            <div style={{ display: "flex", marginTop: 28, fontSize: 66, fontFamily: "Display-Bold", color: theme.tokens.accentStrong }}>
              {params.destination}
            </div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 27, fontFamily: "Body-Medium", color: INK_MUTED }}>
              {formatVacationDateRange(params.startIso, params.endIso)}
            </div>

            {params.note && (
              <div style={{ display: "flex", marginTop: 40, fontSize: 27, lineHeight: 1.4, fontFamily: "Display-Italic", color: INK, maxWidth: 700 }}>
                {params.note}
              </div>
            )}

            <div style={{ display: "flex", marginTop: 48 }}>
              <RoseMark color={theme.tokens.accentStrong} />
            </div>

            <div style={{ display: "flex", marginTop: 40, gap: 88 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", height: 60, alignItems: "flex-end" }}>
                  <SignatureMark signature={params.signature} color={INK} />
                </div>
                <div style={{ display: "flex", width: 190, height: 1, backgroundColor: hairline }} />
                <div style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: INK_MUTED, textTransform: "uppercase" }}>
                  The Birthday Girl
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", height: 60, alignItems: "flex-end", fontSize: 32, fontFamily: "Script", color: INK }}>
                  Isaac
                </div>
                <div style={{ display: "flex", width: 190, height: 1, backgroundColor: hairline }} />
                <div style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: INK_MUTED, textTransform: "uppercase" }}>
                  The Man Who Clearly Has a Plan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Display-Bold", data: fonts.displayBold, weight: 700, style: "normal" },
        { name: "Display-Italic", data: fonts.displayItalic, weight: 500, style: "italic" },
        { name: "Script", data: fonts.script, weight: 400, style: "normal" },
        { name: "Body-Medium", data: fonts.bodyMedium, weight: 500, style: "normal" },
        { name: "Body-Bold", data: fonts.bodyBold, weight: 700, style: "normal" },
      ],
    },
  );
}
