import type { Metadata } from "next";
import { Logo } from "@/components/quiz/primitives/Logo";
import { APP_NAME } from "@/lib/referral-landing/content";

export const metadata: Metadata = {
  title: `Referral link not recognized | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

/** Rendered when `/r/<something>` does not have the shape of a referral code. */
export default function ReferralNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center bg-page px-4 py-6 sm:py-10">
      <article className="w-full max-w-[560px] rounded-card bg-card-white px-7 py-10 text-center shadow-card sm:px-12">
        <div className="flex justify-center">
          <a href="/" aria-label={`${APP_NAME} home`}>
            <Logo variant="green" />
          </a>
        </div>
        <h1 className="mt-5 font-heading text-[24px] font-bold leading-[1.2] text-ink sm:text-[28px]">
          We couldn&apos;t read that referral link
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink-muted-2 sm:text-[17px]">
          The link looks incomplete or was changed along the way. Ask your friend to send it
          again, or just ask them for their referral code — you can type it in when you join.
        </p>
        <a
          href="/"
          className="mt-7 inline-block w-full rounded-pill bg-dark-cta-bg px-9 py-4 font-heading text-[17px] font-semibold text-dark-cta-text sm:w-auto"
        >
          Learn about {APP_NAME}
        </a>
      </article>
    </main>
  );
}
