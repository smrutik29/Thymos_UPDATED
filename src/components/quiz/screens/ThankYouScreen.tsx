import type { QuizState } from "@/lib/quiz/types";
import { Logo } from "../primitives/Logo";
import { thankyouTextFor } from "@/lib/quiz/content";

interface ThankYouScreenProps {
  state: QuizState;
}

export function ThankYouScreen({ state }: ThankYouScreenProps) {
  const text = thankyouTextFor(state.finalChoice);
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-4 px-7 pt-7 text-center sm:px-12 sm:pt-12 md:px-14 md:pt-14">
        <Logo variant="white" />
        <h2 className="whitespace-pre-line font-heading text-[19px] font-bold text-ink">
          {text}
        </h2>
      </div>
      <a href="https://thymoshealth.com/" className="mt-4 block w-full" aria-label="Thymos Health">
        <video autoPlay muted loop playsInline className="block w-full">
          <source src="/video/thank-you-celebration.webm" type="video/webm" />
          <source src="/video/thank-you-celebration.mp4" type="video/mp4" />
        </video>
      </a>
      <div
        className="w-full px-7 pt-4 pb-7 text-center sm:px-12 sm:pb-12 md:px-14 md:pb-14"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.75rem)" }}
      >
        <a
          href="https://thymoshealth.com/"
          className="inline-block w-full rounded-pill bg-dark-cta-bg px-9 py-4 font-heading text-[17px] font-semibold text-dark-cta-text sm:w-auto"
        >
          Done
        </a>
      </div>
    </div>
  );
}
