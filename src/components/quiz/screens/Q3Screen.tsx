import type { Dispatch } from "react";
import clsx from "clsx";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { Chip } from "../primitives/Chip";
import { TextField } from "../primitives/TextField";
import { DarkButton } from "../primitives/DarkButton";
import { SYMPTOM_DATA, symptomKey } from "@/lib/quiz/symptoms";
import { q3Content } from "@/lib/quiz/content";

interface Q3ScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q3Screen({ state, dispatch }: Q3ScreenProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <span className="text-[13px] text-ink-muted">{q3Content.meta}</span>
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {q3Content.heading}
      </h2>
      <div className="flex flex-col gap-4">
        {SYMPTOM_DATA.map(({ category, symptoms }, idx) => (
          <div
            key={category}
            className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr] sm:items-start sm:gap-5"
          >
            <span className="font-heading text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-muted sm:pt-2.5">
              {category}
            </span>
            <div
              className={clsx(
                "flex flex-wrap gap-2 border-b border-dotted border-divider-dotted pb-4",
                idx === SYMPTOM_DATA.length - 1 && "border-none pb-0"
              )}
            >
              {symptoms.map((symptom) => {
                const key = symptomKey(category, symptom);
                return (
                  <Chip
                    key={key}
                    selected={!!state.symptoms[key]}
                    onClick={() => dispatch({ type: "TOGGLE_SYMPTOM", key })}
                  >
                    {symptom}
                  </Chip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <TextField
        value={state.otherSymptomText}
        onChange={(text) => dispatch({ type: "SET_OTHER_SYMPTOM_TEXT", text })}
        placeholder={q3Content.otherPlaceholder}
      />
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
