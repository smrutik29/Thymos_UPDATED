import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { OptionButton } from "../primitives/OptionButton";
import { DarkButton } from "../primitives/DarkButton";
import { RepeatableRowGroup } from "../primitives/RepeatableRowGroup";
import { q1Content } from "@/lib/quiz/content";
import { canAdvance } from "@/lib/quiz/selectors";

interface Q1ScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q1Screen({ state, dispatch }: Q1ScreenProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <span className="text-[13px] text-ink-muted">{q1Content.meta}</span>
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {q1Content.heading}
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <OptionButton
          selected={state.q1status === "diagnosed"}
          onClick={() => dispatch({ type: "SET_Q1_STATUS", status: "diagnosed" })}
        >
          {q1Content.yesLabel}
        </OptionButton>
        <OptionButton
          selected={state.q1status === "none"}
          onClick={() => dispatch({ type: "SET_Q1_STATUS", status: "none" })}
        >
          {q1Content.noLabel}
        </OptionButton>
      </div>
      {state.q1status === "diagnosed" && (
        <RepeatableRowGroup
          rows={state.q1rows}
          fields={[
            { key: "diagnosis", placeholder: "Diagnosis" },
            { key: "since", placeholder: "Since when" },
          ]}
          onUpdateRow={(index, patch) => dispatch({ type: "UPDATE_Q1_ROW", index, row: patch })}
          onAddRow={() => dispatch({ type: "ADD_Q1_ROW" })}
          addLabel={q1Content.addRowLabel}
          canAdd={state.q1rows.length < q1Content.rowMax}
        />
      )}
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })} visible={canAdvance("q1", state)}>
        Continue →
      </DarkButton>
    </div>
  );
}
