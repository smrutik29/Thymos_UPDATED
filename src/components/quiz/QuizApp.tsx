"use client";

import { useEffect, useReducer, useRef } from "react";
import { quizReducer, initialState } from "@/lib/quiz/reducer";
import {
  STEP_LABELS,
  stepChrome,
  progressRatio,
  cardVariantForStep,
} from "@/lib/quiz/step-order";
import { QuizHeader } from "./QuizHeader";
import { ProgressBar } from "./ProgressBar";
import { BackLink } from "./BackLink";
import { QuizCard } from "./QuizCard";
import { StepTransition } from "./StepTransition";
import { IntroScreen } from "./screens/IntroScreen";
import { Q1Screen } from "./screens/Q1Screen";
import { Q1ResponseScreen } from "./screens/Q1ResponseScreen";
import { Q2Screen } from "./screens/Q2Screen";
import { Q2ResponseScreen } from "./screens/Q2ResponseScreen";
import { Q3Screen } from "./screens/Q3Screen";
import { Q3TransitionScreen } from "./screens/Q3TransitionScreen";
import { Q4Screen } from "./screens/Q4Screen";
import { Q4ResponseScreen } from "./screens/Q4ResponseScreen";
import { Q5Screen } from "./screens/Q5Screen";
import { Q5ResponseScreen } from "./screens/Q5ResponseScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { ThankYouScreen } from "./screens/ThankYouScreen";
import type { ContactFormValues } from "@/lib/schemas/contact";

export function QuizApp() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const formRenderedAtRef = useRef(0);

  useEffect(() => {
    formRenderedAtRef.current = Date.now();
  }, []);

  const chrome = stepChrome(state.step);

  async function handleContactSubmit(
    contact: ContactFormValues,
    honeypot: string,
    turnstileToken: string
  ) {
    dispatch({ type: "SUBMIT_START" });
    try {
      const res = await fetch("/api/quiz-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q1status: state.q1status,
          q1rows: state.q1rows,
          q2rows: state.q2rows,
          symptoms: state.symptoms,
          otherSymptomText: state.otherSymptomText,
          q4choice: state.q4choice,
          q4other: state.q4other,
          q5choice: state.q5choice,
          contact,
          finalChoice: state.finalChoice,
          companyWebsite: honeypot,
          turnstileToken,
          formRenderedAt: formRenderedAtRef.current,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.id) {
          dispatch({
            type: "SET_SUBMISSION_ID",
            id: json.id,
            token: typeof json.token === "string" ? json.token : null,
          });
        }
        dispatch({ type: "SUBMIT_SUCCESS" });
        // Only advance once the record is confirmed saved — a failed save
        // must never look like a completed submission to the user.
        dispatch({ type: "GO_NEXT" });
      } else {
        dispatch({ type: "SUBMIT_ERROR" });
      }
    } catch {
      dispatch({ type: "SUBMIT_ERROR" });
    }
  }

  function renderScreen() {
    switch (state.step) {
      case "intro":
        return <IntroScreen dispatch={dispatch} />;
      case "q1":
        return <Q1Screen state={state} dispatch={dispatch} />;
      case "q1resp":
        return <Q1ResponseScreen state={state} dispatch={dispatch} />;
      case "q2":
        return <Q2Screen state={state} dispatch={dispatch} />;
      case "q2resp":
        return <Q2ResponseScreen dispatch={dispatch} />;
      case "q3":
        return <Q3Screen state={state} dispatch={dispatch} />;
      case "q3trans":
        return <Q3TransitionScreen dispatch={dispatch} />;
      case "q4":
        return <Q4Screen state={state} dispatch={dispatch} />;
      case "q4resp":
        return <Q4ResponseScreen dispatch={dispatch} />;
      case "q5":
        return <Q5Screen state={state} dispatch={dispatch} />;
      case "q5resp":
        return <Q5ResponseScreen state={state} dispatch={dispatch} />;
      case "contact":
        return (
          <ContactScreen state={state} dispatch={dispatch} onSubmit={handleContactSubmit} />
        );
      case "thankyou":
        return <ThankYouScreen state={state} />;
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-4 sm:px-6">
      <div className="flex flex-col gap-3.5 pt-7 pb-2">
        <QuizHeader stepLabel={STEP_LABELS[state.step]} />
        {chrome.showProgress && <ProgressBar ratio={progressRatio(state.step)} />}
        {chrome.showBack && <BackLink onClick={() => dispatch({ type: "GO_BACK" })} />}
      </div>
      <div className="pb-10">
        <StepTransition stepKey={state.step}>
          <QuizCard variant={cardVariantForStep(state.step)}>{renderScreen()}</QuizCard>
        </StepTransition>
      </div>
    </div>
  );
}
