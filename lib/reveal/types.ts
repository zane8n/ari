export type RevealSignature = { kind: "typed"; value: string } | { kind: "drawn"; viewBox: string; paths: string[] };

/** Only ever leaves the server once a specific invite is genuinely sealed (env contract: "public only after reveal"). */
export type RevealData = {
  destination: string;
  startIso: string;
  endIso: string;
  note: string;
  signature: RevealSignature;
};
