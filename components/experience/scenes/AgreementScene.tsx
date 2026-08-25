"use client";

import type { Dispatch } from "react";
import { LoverAgreement } from "@/components/agreement/LoverAgreement";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

export function AgreementScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  return (
    <LoverAgreement
      preferredName={state.preferredName}
      acknowledged={state.agreementAcknowledgedAt !== null}
      onAcknowledgedChange={(checked) =>
        dispatch({ type: "agreementAcknowledgedChanged", acknowledged: checked, at: new Date().toISOString() })
      }
      onSign={() => dispatch({ type: "signatureStageEntered" })}
    />
  );
}
