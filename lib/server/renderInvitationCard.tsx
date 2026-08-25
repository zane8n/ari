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

function signatureLine(signature: RevealSignature): string {
  return signature.kind === "typed" ? signature.value : "her signature";
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "88px 72px",
          backgroundColor: CANVAS,
          color: INK,
          fontFamily: "Body-Medium",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", fontSize: 34, color: theme.tokens.accentStrong, fontFamily: "Script" }}>
            Lover&rsquo;s Bid
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 4,
              color: theme.tokens.accentStrong,
              textTransform: "uppercase",
              fontFamily: "Body-Bold",
            }}
          >
            Application... shockingly... approved
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: 56, lineHeight: 1.15, fontFamily: "Display-Bold", color: INK }}>
            {params.preferredName}, this is really happening.
          </div>
          <div style={{ display: "flex", fontSize: 70, fontFamily: "Display-Bold", color: theme.tokens.accentStrong }}>
            {params.destination}
          </div>
          <div style={{ display: "flex", fontSize: 30, fontFamily: "Body-Medium", color: INK_MUTED }}>
            {formatVacationDateRange(params.startIso, params.endIso)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {params.note && (
            <div style={{ display: "flex", fontSize: 30, fontFamily: "Display-Italic", color: INK, maxWidth: 820 }}>
              {params.note}
            </div>
          )}

          <div style={{ display: "flex", gap: "72px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", fontSize: 30, fontFamily: "Script", color: INK }}>
                {signatureLine(params.signature)}
              </div>
              <div style={{ display: "flex", width: 180, height: 1, backgroundColor: "#2B183033" }} />
              <div style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: INK_MUTED, textTransform: "uppercase" }}>
                The Birthday Girl
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", fontSize: 30, fontFamily: "Script", color: INK }}>Isaac</div>
              <div style={{ display: "flex", width: 180, height: 1, backgroundColor: "#2B183033" }} />
              <div style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: INK_MUTED, textTransform: "uppercase" }}>
                The Man Who Clearly Has a Plan
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
