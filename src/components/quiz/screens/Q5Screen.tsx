import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { OptionButton } from "../primitives/OptionButton";
import { DarkButton } from "../primitives/DarkButton";
import { q5Content } from "@/lib/quiz/content";
import { canAdvance } from "@/lib/quiz/selectors";

interface Q5ScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q5Screen({ state, dispatch }: Q5ScreenProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <span className="text-[13px] text-ink-muted">{q5Content.meta}</span>
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {q5Content.heading}
      </h2>
      <div className="flex flex-col gap-3">
        {q5Content.options.map((option) => (
          <OptionButton
            key={option.value}
            selected={state.q5choice === option.value}
            onClick={() => dispatch({ type: "SET_Q5_CHOICE", choice: option.value })}
          >
            {option.label}
          </OptionButton>
        ))}
      </div>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })} visible={canAdvance("q5", state)}>
        {q5Content.cta}
      </DarkButton>
    </div>
  );
}
