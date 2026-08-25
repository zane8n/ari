/** Allowlisted token interpolation for approved copy (section 14) — escapes nothing else, substitutes nothing else. */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}
