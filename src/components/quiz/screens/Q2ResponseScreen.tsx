import type { Dispatch } from "react";
import type { QuizAction } from "@/lib/quiz/types";
import { DarkButton } from "../primitives/DarkButton";
import { q2ResponseContent } from "@/lib/quiz/content";

interface Q2ResponseScreenProps {
  dispatch: Dispatch<QuizAction>;
}

export function Q2ResponseScreen({ dispatch }: Q2ResponseScreenProps) {
  return (
    <div className="flex flex-col gap-7 p-6 sm:p-10 md:p-12">
      <p className="font-heading text-[18px] font-semibold leading-[1.5] text-ink sm:text-[22px]">
        {q2ResponseContent}
      </p>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
