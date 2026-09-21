import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/quiz/primitives/Logo";
import { appDeepLinkFor, parseReferralCode } from "@/lib/referral-landing/code";
import {
  APP_NAME,
  SITE_ORIGIN,
  STORE_BADGES,
  getReferralOffer,
} from "@/lib/referral-landing/content";
import { CopyCodeButton } from "./CopyCodeButton";
import { OpenInAppButton } from "./OpenInAppButton";
import { StoreBadges } from "./StoreBadges";

/**
 * Refer-a-friend landing page — `https://thymoshealth.com/r/<CODE>` (ADR-0006 §2).
 *
 * The friend arrives here from the share message. The page shows the offer, the
 * code with a copy action and the store badges, and is the fallback until the app
 * is installed / deferred deep linking exists. The URL carries the code and nothing
 * else; the page never calls the backend, so it cannot say whether a code is real —
 * the app validates at payment.
 *
 * Not to be confused with the *provider* referral form (`thymos-refer-a-patient`).
 */

const PAGE_PATH = (code: string) => `/r/${encodeURIComponent(code)}`;

export async function generateMetadata({ params }: PageProps<"/r/[code]">): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = parseReferralCode(rawCode);
  const { recipientDiscount } = getReferralOffer();
  const title = `You're invited — ${recipientDiscount} off your first month | ${APP_NAME}`;
  const description = `A ${APP_NAME} member shared their referral code with you. Use it when you join and your first month of membership is ${recipientDiscount} off.`;
  // Absolute URLs on purpose: the root layout's metadataBase still points at `www`,
  // which resolves to the old stack (code-map landmine). Canonical host is the apex.
  const url = code ? `${SITE_ORIGIN}${PAGE_PATH(code)}` : `${SITE_ORIGIN}/r`;
  return {
    title,
    description,
    // Per-code pages are thin and personal; keep them out of the index.
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      url,
      title,
      description,
      images: [`${SITE_ORIGIN}/img/thymos-logo-flames.png`],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [`${SITE_ORIGIN}/img/thymos-logo-flames.png`],
    },
  };
}

export default async function ReferralLandingPage({ params }: PageProps<"/r/[code]">) {
  const { code: rawCode } = await params;
  const code = parseReferralCode(rawCode);
  if (!code) notFound();

  const offer = getReferralOffer();
  const deepLink = appDeepLinkFor(code);

  const steps = [
    {
      title: `Get the ${APP_NAME} app`,
      body: "Download it from the App Store or Google Play once it's live — or join the waitlist below and we'll let you know.",
    },
    {
      title: "Create your account",
      body: "Answer a few questions about your health so your care team can prepare for you.",
    },
    {
      title: "Enter the code at payment",
      body: `Paste the code into the promo code field when you choose your membership. Your first month is ${offer.recipientDiscount} off.`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-page px-4 py-6 sm:py-10 lg:px-8 lg:py-4">
      <article className="w-full max-w-[560px] overflow-hidden rounded-card bg-card-white shadow-card animate-fade-slide-in lg:grid lg:max-w-[1240px] lg:grid-cols-[1.08fr_1fr]">
        {/* Left column: the invitation and the code */}
        <div className="flex flex-col lg:justify-center lg:px-14 lg:py-8">
          <header className="flex flex-col items-center gap-5 px-7 pt-8 text-center sm:px-12 sm:pt-12 lg:items-start lg:px-0 lg:pt-0 lg:text-left">
            <a href="/" aria-label={`${APP_NAME} home`}>
              <Logo variant="green" />
            </a>
            <p className="font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              A friend invited you
            </p>
            <h1 className="max-w-[440px] font-heading text-[26px] font-bold leading-[1.2] text-ink sm:text-[32px] lg:max-w-none lg:text-[36px]">
              Get {offer.recipientDiscount} off your first month of {APP_NAME}
            </h1>
            <p className="max-w-[440px] text-[15px] leading-[1.6] text-ink-muted-2 sm:text-[17px] lg:max-w-none lg:text-[16px]">
              Someone who knows you is a {APP_NAME} member and thinks it could help you too. Use
              their referral code when you join and your first month of membership is{" "}
              {offer.recipientDiscount} off. They get {offer.referrerReward} off their next month
              as a thank-you.
            </p>
          </header>

          <section
            aria-labelledby="referral-code-heading"
            className="mx-7 mt-7 rounded-option border border-option-selected-border bg-option-selected-bg px-6 py-6 text-center sm:mx-12 lg:mx-0 lg:mt-8"
          >
            <h2
              id="referral-code-heading"
              className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted-2"
            >
              Your referral code
            </h2>
            <p
              className="mt-3 select-all break-all font-heading text-[30px] font-bold tracking-[0.08em] text-ink sm:text-[36px]"
              data-testid="referral-code"
            >
              {code}
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <CopyCodeButton code={code} />
              <OpenInAppButton href={deepLink} />
            </div>
            <p className="mt-4 text-[13px] leading-[1.5] text-ink-muted-2">
              Already have the app? Open this link on your phone and the code is saved for you
              at checkout.
            </p>
          </section>
        </div>

        {/* Right column: how to use it, the app, legal */}
        <div className="flex flex-col lg:border-l lg:border-option-border lg:bg-page lg:px-14 lg:py-8">
          <section aria-labelledby="how-it-works-heading" className="px-7 pt-8 sm:px-12 lg:px-0 lg:pt-0">
            <h2
              id="how-it-works-heading"
              className="font-heading text-[19px] font-bold text-ink"
            >
              How to use it
            </h2>
            <ol className="mt-4 flex flex-col gap-4 lg:gap-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-green font-heading text-[15px] font-semibold text-ink"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-[16px] font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-[15px] leading-[1.55] text-ink-muted-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="get-the-app-heading" className="px-7 pt-8 sm:px-12 lg:px-0 lg:pt-6">
            <h2
              id="get-the-app-heading"
              className="text-center font-heading text-[19px] font-bold text-ink lg:text-left"
            >
              Get the app
            </h2>
            <div className="mt-4 lg:[&_ul]:justify-start">
              <StoreBadges badges={STORE_BADGES} />
            </div>
            <p className="mt-4 text-center text-[14px] leading-[1.55] text-ink-muted-2 lg:text-left">
              The {APP_NAME} app is launching soon.{" "}
              <a href="/" className="font-semibold text-ink underline underline-offset-2">
                Learn about membership
              </a>{" "}
              and join the waitlist so you don&apos;t miss it.
            </p>
          </section>

          <footer
            className="mt-8 border-t border-option-border px-7 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center text-[12px] leading-[1.6] text-ink-muted sm:px-12 lg:mt-auto lg:px-0 lg:pb-0 lg:pt-4 lg:text-left"
          >
            <p>
              Referral discount applies to first-time {APP_NAME} members. One referral code per
              signup; you can&apos;t use your own code. Amounts and availability may change.
            </p>
            <nav aria-label="Legal" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 lg:justify-start">
              <a href="/thymos-privacy-policy.dc.html" className="underline underline-offset-2">
                Privacy Policy
              </a>
              <a href="/thymos-terms-of-service.dc.html" className="underline underline-offset-2">
                Terms of Service
              </a>
              <a href="/contact-us.html" className="underline underline-offset-2">
                Contact
              </a>
            </nav>
          </footer>
        </div>
      </article>
    </main>
  );
}
