import { describe, expect, it } from "vitest";
import { loverAgreementV1 } from "@/content/agreement-v1";
import { parseAgreementBlocks, tokensToPlainText } from "@/lib/agreement/parse";

describe("parseAgreementBlocks", () => {
  it("parses headings, paragraphs and grouped ordered lists", () => {
    const blocks = parseAgreementBlocks(
      "### Title\n\nA paragraph.\n\n1. First item\n\n2. Second item\n\n#### Next heading",
    );
    expect(blocks).toEqual([
      { type: "h3", tokens: [{ type: "text", value: "Title" }] },
      { type: "p", tokens: [{ type: "text", value: "A paragraph." }] },
      {
        type: "list",
        items: [[{ type: "text", value: "First item" }], [{ type: "text", value: "Second item" }]],
      },
      { type: "h4", tokens: [{ type: "text", value: "Next heading" }] },
    ]);
  });

  it("tokenizes bold, italic and the {{name}} token, including nested name-in-bold", () => {
    const blocks = parseAgreementBlocks("**{{name}}** agrees to *this*.");
    expect(blocks).toEqual([
      {
        type: "p",
        tokens: [
          { type: "bold", children: [{ type: "name" }] },
          { type: "text", value: " agrees to " },
          { type: "italic", children: [{ type: "text", value: "this" }] },
          { type: "text", value: "." },
        ],
      },
    ]);
  });

  it("never produces raw HTML — output is always a plain data tree", () => {
    const blocks = parseAgreementBlocks("<script>alert(1)</script> is just text.");
    const text = tokensToPlainText(blocks[0].type === "p" ? blocks[0].tokens : [], "x");
    expect(text).toBe("<script>alert(1)</script> is just text.");
  });
});

describe("the canonical agreement asset", () => {
  it("parses without throwing and its final sentence matches exactly (section 28 QA checklist)", () => {
    const blocks = parseAgreementBlocks(loverAgreementV1.markdown);
    const lastParagraph = [...blocks].reverse().find((block) => block.type === "p");
    expect(lastParagraph).toBeDefined();
    if (lastParagraph?.type === "p") {
      expect(tokensToPlainText(lastParagraph.tokens, "Testara")).toBe(
        "Please sign only if you are prepared to be loved, celebrated and ready to make bad decisions.",
      );
    }
  });

  it("interpolates the recipient's name into the opening paragraph", () => {
    const blocks = parseAgreementBlocks(loverAgreementV1.markdown);
    const opening = blocks.find((block) => block.type === "p");
    expect(opening?.type).toBe("p");
    if (opening?.type === "p") {
      expect(tokensToPlainText(opening.tokens, "Testara")).toContain("Testara");
    }
  });
});
