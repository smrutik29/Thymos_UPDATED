import type { Dispatch } from "react";
import type { QuizAction } from "@/lib/quiz/types";
import { IntroVideo } from "../primitives/IntroVideo";
import { Logo } from "../primitives/Logo";
import { ContinueButton } from "../primitives/ContinueButton";
import { introContent } from "@/lib/quiz/content";

interface IntroScreenProps {
  dispatch: Dispatch<QuizAction>;
}

export function IntroScreen({ dispatch }: IntroScreenProps) {
  return (
    <div className="flex flex-col items-center gap-[22px] pb-7 sm:pb-12 md:pb-14">
      <IntroVideo />
      <div className="flex flex-col items-center gap-[22px] px-7 sm:px-12 md:px-14">
        <Logo variant="green" />
        <h1 className="max-w-[480px] text-center font-heading text-[26px] font-bold leading-[1.2] text-ink sm:text-[34px]">
          {introContent.heading}
        </h1>
        <div className="max-w-[480px] text-center text-[15px] leading-[1.6] text-ink-muted-2 sm:text-[17px]">
          {introContent.body.map((paragraph, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              {paragraph}
            </p>
          ))}
        </div>
        <ContinueButton onClick={() => dispatch({ type: "GO_NEXT" })}>
          {introContent.cta}
        </ContinueButton>
      </div>
    </div>
  );
}
