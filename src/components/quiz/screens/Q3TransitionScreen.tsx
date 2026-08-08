import type { Dispatch } from "react";
import type { QuizAction } from "@/lib/quiz/types";
import { DarkButton } from "../primitives/DarkButton";
import { q3TransitionContent } from "@/lib/quiz/content";

interface Q3TransitionScreenProps {
  dispatch: Dispatch<QuizAction>;
}

export function Q3TransitionScreen({ dispatch }: Q3TransitionScreenProps) {
  return (
    <div className="flex flex-col gap-7 p-6 sm:p-10 md:p-12">
      <p className="font-heading text-[18px] font-semibold leading-[1.5] text-ink sm:text-[22px]">
        {q3TransitionContent}
      </p>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
