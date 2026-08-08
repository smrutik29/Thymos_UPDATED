import type { Dispatch } from "react";
import type { QuizAction } from "@/lib/quiz/types";
import { DarkButton } from "../primitives/DarkButton";
import { q4ResponseContent } from "@/lib/quiz/content";

interface Q4ResponseScreenProps {
  dispatch: Dispatch<QuizAction>;
}

export function Q4ResponseScreen({ dispatch }: Q4ResponseScreenProps) {
  return (
    <div className="flex flex-col gap-7 p-6 sm:p-10 md:p-12">
      <div className="flex flex-col gap-4 font-heading text-[18px] font-semibold leading-[1.5] text-ink sm:text-[22px]">
        {q4ResponseContent.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <p>
          Care built around YOU gets{" "}
          <span className="underline">{q4ResponseContent.closingUnderline}</span>.
        </p>
      </div>
      <DarkButton onClick={() => dispatch({ type: "GO_NEXT" })}>Continue →</DarkButton>
    </div>
  );
}
