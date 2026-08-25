import type { ExperienceState } from "@/lib/experience/types";
import type { ArtifactKind } from "./layout";

/** Section 3, rule 3: progress is five ambient glass charms that illuminate as stages complete. */
export function illuminatedCharms(state: ExperienceState): Record<ArtifactKind, boolean> {
  return {
    pebble: state.openedAt !== null,
    halo: state.prologueViewedAt !== null,
    ribbon: state.vacationConfirmedAt !== null,
    route: state.travelPersona !== null,
    seal: state.sealedAt !== null,
  };
}
