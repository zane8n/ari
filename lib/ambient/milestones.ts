import type { ExperienceState } from "@/lib/experience/types";
import type { ArtifactKind } from "./layout";

/**
 * Section 3, rule 3: progress is five ambient glass charms that illuminate
 * as stages complete — only the five identity kinds carry milestone meaning,
 * so purely-decorative kinds (vine, trail) are left absent rather than
 * forced to false here, and read as non-illuminated via the caller's `??`.
 */
export function illuminatedCharms(state: ExperienceState): Partial<Record<ArtifactKind, boolean>> {
  return {
    pebble: state.openedAt !== null,
    halo: state.prologueViewedAt !== null,
    ribbon: state.vacationConfirmedAt !== null,
    route: state.travelPersona !== null,
    seal: state.sealedAt !== null,
  };
}
