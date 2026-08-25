import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatVacationDateRange } from "@/lib/reveal/countdown";
import { THEMES, type ThemeId } from "@/lib/theme/themes";

const WIDTH = 1080;
const HEIGHT = 1350;

async function loadFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [frauncesBold, frauncesItalic, manropeMedium, manropeExtraBold] = await Promise.all([
    readFile(path.join(dir, "Fraunces-Bold.woff")),
    readFile(path.join(dir, "Fraunces-Italic.woff")),
    readFile(path.join(dir, "Manrope-Medium.woff")),
    readFile(path.join(dir, "Manrope-ExtraBold.woff")),
  ]);
  return { frauncesBold, frauncesItalic, manropeMedium, manropeExtraBold };
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

export async function renderInvitationCard(params: {
  preferredName: string;
  themeId: ThemeId;
  destination: string;
  startIso: string;
  endIso: string;
  note: string;
}): Promise<ImageResponse> {
  const theme = THEMES[params.themeId] ?? THEMES.teal;
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
          backgroundColor: "#F8F4EC",
          color: "#27231F",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, border: `2px solid ${theme.accent}`, display: "flex" }} />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 4,
              color: theme.tokens.accentStrong,
              textTransform: "uppercase",
              fontFamily: "Manrope-ExtraBold",
            }}
          >
            Application suspiciously approved
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: 58, lineHeight: 1.15, fontFamily: "Fraunces-Bold", color: "#27231F" }}>
            {params.preferredName}, this is really happening.
          </div>
          <div style={{ display: "flex", fontSize: 72, fontFamily: "Fraunces-Bold", color: theme.tokens.accentStrong }}>
            {params.destination}
          </div>
          <div style={{ display: "flex", fontSize: 32, fontFamily: "Manrope-Medium", color: "#6E6861" }}>
            {formatVacationDateRange(params.startIso, params.endIso)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {params.note && (
            <div style={{ display: "flex", fontSize: 30, fontFamily: "Fraunces-Italic", color: "#27231F", maxWidth: 820 }}>
              {params.note}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 3,
              color: "#6E6861",
              textTransform: "uppercase",
              fontFamily: "Manrope-ExtraBold",
            }}
          >
            A Small Matter of Your Birthday
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Fraunces-Bold", data: fonts.frauncesBold, weight: 700, style: "normal" },
        { name: "Fraunces-Italic", data: fonts.frauncesItalic, weight: 500, style: "italic" },
        { name: "Manrope-Medium", data: fonts.manropeMedium, weight: 500, style: "normal" },
        { name: "Manrope-ExtraBold", data: fonts.manropeExtraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
