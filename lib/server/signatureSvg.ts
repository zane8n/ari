import "server-only";
import type { SignaturePointGroup } from "@/lib/experience/types";
import type { RevealSignature } from "@/lib/reveal/types";
import type { SealedPayloadV1 } from "@/lib/validation/schemas";

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 130;
const MARGIN = 10;

/** Server-side reconstruction so the host view never ships raw signature point JSON to the client. */
export function buildSignaturePaths(groups: SignaturePointGroup[]): { viewBox: string; paths: string[] } {
  const allPoints = groups.flat();
  if (allPoints.length === 0) return { viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`, paths: [] };

  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((VIEW_WIDTH - MARGIN * 2) / spanX, (VIEW_HEIGHT - MARGIN * 2) / spanY);
  // Scaling to fit only pins the content to the top-left corner unless the
  // signature's aspect ratio happens to match the box exactly — center the
  // scaled result within the remaining space on both axes.
  const offsetX = (VIEW_WIDTH - spanX * scale) / 2;
  const offsetY = (VIEW_HEIGHT - spanY * scale) / 2;

  const paths = groups
    .filter((group) => group.length > 1)
    .map((group) => {
      const commands = group.map((point, index) => {
        const x = offsetX + (point.x - minX) * scale;
        const y = offsetY + (point.y - minY) * scale;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return commands.join(" ");
    });

  return { viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`, paths };
}

/** Converts the sealed payload's signature into the shape the reveal is allowed to receive. */
export function buildRevealSignature(signature: SealedPayloadV1["signature"]): RevealSignature {
  if (signature.kind === "typed") return { kind: "typed", value: signature.value };
  return { kind: "drawn", ...buildSignaturePaths(signature.points) };
}
