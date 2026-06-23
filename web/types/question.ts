export type ToeicReadingPart = "part5" | "part6" | "part7";

export type Difficulty = "easy" | "medium" | "hard";

export type ChoiceId = "A" | "B" | "C" | "D";

export type Choice = {
  id: ChoiceId;
  text: string;
};

export type QuestionItem = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: ChoiceId;
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
  reviewed: boolean;
};

export type Part5Question = QuestionItem & {
  part: "part5";
  sentence: string;
};

export type PassageQuestionSet = {
  id: string;
  part: "part6" | "part7";
  title?: string;
  passage: string;
  questions: QuestionItem[];
  difficulty: Difficulty;
  tags: string[];
  reviewed: boolean;
};

export type QuestionBankEntry = Part5Question | PassageQuestionSet;
