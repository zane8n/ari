import { describe, expect, it } from "vitest";
import { paginateLetter, splitParagraphs } from "@/lib/letter/paginate";

const para = (length: number) => "x".repeat(length);

describe("paginateLetter", () => {
  it("splits on blank lines and drops empty paragraphs", () => {
    expect(splitParagraphs("one\r\n\r\n\n two \n\n")).toEqual(["one", "two"]);
  });

  it("keeps every paragraph, in order, never splitting one", () => {
    const paragraphs = [480, 480, 330, 1400, 480, 370, 800, 1000, 520, 250, 420, 330, 16].map(para);
    const pages = paginateLetter(paragraphs.join("\n\n"));
    expect(pages.flat()).toEqual(paragraphs);
    expect(pages.length).toBeGreaterThan(1);
  });

  it("never leaves a short paragraph or a short closing line on a page of its own", () => {
    const pages = paginateLetter([para(200), para(1400), para(900), para(16)].join("\n\n"));
    expect(pages.map((page) => page.length)).toEqual([2, 2]);
  });

  it("returns no pages for an empty body", () => {
    expect(paginateLetter(" \n\n ")).toEqual([]);
  });
});
