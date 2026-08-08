export interface SymptomCategory {
  category: string;
  symptoms: string[];
}

export const SYMPTOM_DATA: SymptomCategory[] = [
  {
    category: "Digestive",
    symptoms: [
      "Nausea or Vomiting",
      "Diarrhea",
      "Constipation",
      "Bloating",
      "Heartburn",
      "Abdominal Discomfort",
    ],
  },
  {
    category: "Neurological",
    symptoms: [
      "Headaches",
      "Dizziness",
      "Sleep issues",
      "Hot flashes",
      "Poor concentration",
      "Learning or memory issues",
    ],
  },
  {
    category: "Heart/Lungs",
    symptoms: ["Rapid or irregular heartbeat", "Chest discomfort", "Breathing issues"],
  },
  {
    category: "Musculoskeletal",
    symptoms: ["Joint aches", "Muscle pain", "Stiffness or limited movement"],
  },
  {
    category: "Skin",
    symptoms: ["Acne", "Rashes", "Dry skin"],
  },
  {
    category: "Energy",
    symptoms: ["Fatigue", "Hyperactivity", "Restlessness"],
  },
  {
    category: "Ear / Nose",
    symptoms: ["Itching ears", "Stuffy nose", "Sneezing attacks"],
  },
  {
    category: "Eyes",
    symptoms: ["Blurry vision", "Watery or itchy eyes"],
  },
  {
    category: "Other",
    symptoms: [
      "Cold/numb fingers or toes",
      "Frequent illness",
      "Sexual issues",
      "Heavy/irregular menstruation",
    ],
  },
];

export function symptomKey(category: string, symptom: string): string {
  return `${category}::${symptom}`;
}
