/** Only ever leaves the server once a specific invite is genuinely sealed (env contract: "public only after reveal"). */
export type RevealData = {
  destination: string;
  startIso: string;
  endIso: string;
  note: string;
};
