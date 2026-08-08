import type { FinalChoice } from "@/lib/quiz/types";
import { finalContent } from "@/lib/quiz/content";

interface FinalScreenProps {
  onSelect: (choice: FinalChoice) => void;
}

export function FinalScreen({ onSelect }: FinalScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center sm:p-10 md:p-12">
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {finalContent.heading}
      </h2>
      <div className="flex w-full max-w-[360px] flex-col gap-3">
        <button
          type="button"
          onClick={() => onSelect("yes")}
          className="w-full rounded-pill bg-gold px-9 py-4 font-heading text-[17px] font-semibold text-ink transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(231,183,64,0.4)]"
        >
          {finalContent.yes}
        </button>
        <button
          type="button"
          onClick={() => onSelect("waitlist")}
          className="w-full rounded-pill bg-card-yellow px-9 py-4 font-heading text-[17px] font-semibold text-ink transition-colors duration-150 hover:brightness-95"
        >
          {finalContent.waitlist}
        </button>
        <button
          type="button"
          onClick={() => onSelect("no")}
          className="mt-1 text-[14px] text-disabled-text underline underline-offset-2"
        >
          {finalContent.no}
        </button>
      </div>
    </div>
  );
}
