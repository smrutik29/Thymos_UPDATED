import type { Dispatch } from "react";
import type { QuizAction, QuizState } from "@/lib/quiz/types";
import { DarkButton } from "../primitives/DarkButton";
import { q1ResponseContent } from "@/lib/quiz/content";

interface Q1ResponseScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

export function Q1ResponseScreen({ state, dispatch }: Q1ResponseScreenProps) {
  const text = q1ResponseContent[state.q1status === "diagnosed" ? "diagnosed" : "none"];
  return (
    <div className="flex flex-col gap-7 p-6 sm:p-10 md:p-12">
      <p className="font-heading text-[18px] font-semibold leading-[1.5] text-ink sm:text-[22px]">
        {text}
      </p>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
