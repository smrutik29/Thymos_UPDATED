import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { OptionButton } from "../primitives/OptionButton";
import { TextField } from "../primitives/TextField";
import { DarkButton } from "../primitives/DarkButton";
import { q4Content } from "@/lib/quiz/content";
import { canAdvance } from "@/lib/quiz/selectors";

interface Q4ScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q4Screen({ state, dispatch }: Q4ScreenProps) {
  const isOther = state.q4choice === "Other";
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <span className="text-[13px] text-ink-muted">{q4Content.meta}</span>
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {q4Content.heading}
      </h2>
      <div className="flex flex-col gap-3">
        {q4Content.options.map((option) => (
          <OptionButton
            key={option}
            selected={state.q4choice === option}
            onClick={() => dispatch({ type: "SET_Q4_CHOICE", choice: option })}
          >
            {option}
          </OptionButton>
        ))}
      </div>
      {isOther && (
        <TextField
          value={state.q4other}
          onChange={(text) => dispatch({ type: "SET_Q4_OTHER", text })}
          placeholder={q4Content.otherPlaceholder}
        />
      )}
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })} visible={canAdvance("q4", state)}>
        Continue →
      </DarkButton>
    </div>
  );
}
