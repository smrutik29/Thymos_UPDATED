import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { DarkButton } from "../primitives/DarkButton";
import { q5ResponseContent, q5ResponseFinePrint, q5ResponseCta } from "@/lib/quiz/content";

interface Q5ResponseScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q5ResponseScreen({ state, dispatch }: Q5ResponseScreenProps) {
  const branch = q5ResponseContent[state.q5choice ?? "No"];
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-10 md:p-12">
      <p className="font-heading text-[18px] font-semibold leading-[1.5] text-ink sm:text-[20px]">
        {branch.heading}
      </p>
      <ul className="flex flex-col gap-2.5">
        {branch.stats.map((stat) => (
          <li key={stat} className="flex items-start gap-2 text-[16px] leading-[1.5] text-ink">
            <span className="font-bold text-checkmark">✓</span>
            <span>{stat}</span>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-checkmark">{q5ResponseFinePrint}</p>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>{q5ResponseCta}</DarkButton>
    </div>
  );
}
