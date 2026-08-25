// Vitest resolves "server-only" here instead of the real package (see vitest.config.ts).
// The real package unconditionally throws outside Next's own "react-server" bundler
// condition, which would make every server module untestable in plain Node.
export {};
