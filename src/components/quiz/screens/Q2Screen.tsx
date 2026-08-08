import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { RepeatableRowGroup } from "../primitives/RepeatableRowGroup";
import { DarkButton } from "../primitives/DarkButton";
import { q2Content } from "@/lib/quiz/content";

interface Q2ScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q2Screen({ state, dispatch }: Q2ScreenProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <span className="text-[13px] text-ink-muted">{q2Content.meta}</span>
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {q2Content.heading}
      </h2>
      <p className="text-[14px] text-ink-muted">{q2Content.subcopy}</p>
      <RepeatableRowGroup
        rows={state.q2rows}
        fields={[
          { key: "diagnosis", placeholder: "Diagnosis" },
          { key: "date", placeholder: "Date" },
        ]}
        onUpdateRow={(index, patch) => dispatch({ type: "UPDATE_Q2_ROW", index, row: patch })}
        onAddRow={() => dispatch({ type: "ADD_Q2_ROW" })}
        addLabel={q2Content.addRowLabel}
      />
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
