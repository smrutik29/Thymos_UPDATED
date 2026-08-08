import { QuizApp } from "@/components/quiz/QuizApp";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-page py-6 sm:py-10">
      <QuizApp />
    </main>
  );
}
