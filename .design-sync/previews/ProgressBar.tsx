import { ProgressBar } from "thymos-quiz-app";

export function Early() {
  return <div style={{ maxWidth: 420 }}><ProgressBar ratio={0.2} /></div>;
}

export function MidWay() {
  return <div style={{ maxWidth: 420 }}><ProgressBar ratio={0.6} /></div>;
}

export function NearComplete() {
  return <div style={{ maxWidth: 420 }}><ProgressBar ratio={0.9} /></div>;
}
