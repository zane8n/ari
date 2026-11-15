/** A page a reader can take in without scrolling far on a phone. */
const PAGE_BUDGET_CHARS = 1100;
/** A page shorter than this always takes the next paragraph too, so no short paragraph is left standing alone. */
const MIN_PAGE_CHARS = 300;

export function splitParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Groups paragraphs into pages, never splitting a paragraph. The closing
 * line of a letter is usually short, so a short final page is folded back
 * into the one before it.
 */
export function paginateLetter(body: string): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let size = 0;

  for (const paragraph of splitParagraphs(body)) {
    if (current.length > 0 && size >= MIN_PAGE_CHARS && size + paragraph.length > PAGE_BUDGET_CHARS) {
      pages.push(current);
      current = [];
      size = 0;
    }
    current.push(paragraph);
    size += paragraph.length;
  }
  if (current.length > 0) {
    const previous = pages[pages.length - 1];
    if (previous && size < MIN_PAGE_CHARS) previous.push(...current);
    else pages.push(current);
  }
  return pages;
}
