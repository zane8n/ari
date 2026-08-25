/**
 * Restricted markdown parser for the one canonical agreement asset. Only the
 * constructs the agreement actually uses are supported (###/####/#####
 * headings, numbered lists, **bold**, *italic*, and the {{name}} token).
 * There is no raw-HTML passthrough anywhere in this module by construction —
 * output is a plain data tree, never an HTML string.
 */

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "name" }
  | { type: "bold"; children: InlineToken[] }
  | { type: "italic"; children: InlineToken[] };

export type AgreementBlock =
  | { type: "h3" | "h4" | "h5"; tokens: InlineToken[] }
  | { type: "p"; tokens: InlineToken[] }
  | { type: "list"; items: InlineToken[][] };

const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|\{\{name\}\}/g;

export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    if (match[0] === "{{name}}") {
      tokens.push({ type: "name" });
    } else if (match[1] !== undefined) {
      tokens.push({ type: "bold", children: tokenizeInline(match[1]) });
    } else if (match[2] !== undefined) {
      tokens.push({ type: "italic", children: tokenizeInline(match[2]) });
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}

const LIST_ITEM_PATTERN = /^\d+\.\s+/;

export function parseAgreementBlocks(markdown: string): AgreementBlock[] {
  const rawBlocks = markdown.trim().split(/\n{2,}/);
  const blocks: AgreementBlock[] = [];

  for (const raw of rawBlocks) {
    const block = raw.trim();
    if (block.startsWith("##### ")) {
      blocks.push({ type: "h5", tokens: tokenizeInline(block.slice(6)) });
      continue;
    }
    if (block.startsWith("#### ")) {
      blocks.push({ type: "h4", tokens: tokenizeInline(block.slice(5)) });
      continue;
    }
    if (block.startsWith("### ")) {
      blocks.push({ type: "h3", tokens: tokenizeInline(block.slice(4)) });
      continue;
    }
    if (LIST_ITEM_PATTERN.test(block)) {
      const itemTokens = tokenizeInline(block.replace(LIST_ITEM_PATTERN, ""));
      const previous = blocks[blocks.length - 1];
      if (previous?.type === "list") {
        previous.items.push(itemTokens);
      } else {
        blocks.push({ type: "list", items: [itemTokens] });
      }
      continue;
    }
    blocks.push({ type: "p", tokens: tokenizeInline(block) });
  }

  return blocks;
}

/** Flattens tokens back to plain text, e.g. for snapshot tests of exact final wording. */
export function tokensToPlainText(tokens: InlineToken[], name: string): string {
  return tokens
    .map((token) => {
      if (token.type === "text") return token.value;
      if (token.type === "name") return name;
      return tokensToPlainText(token.children, name);
    })
    .join("");
}
