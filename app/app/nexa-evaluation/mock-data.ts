export type ReviewDecision = "right" | "wrong";
export type ChatPeriod = "since-last-check" | "last-30-days" | "custom";
export type RunPhase = "idle" | "collecting" | "checking" | "reporting";

export type EvaluationOptions = {
  period: ChatPeriod;
  startDate: string;
  endDate: string;
  tenant: string;
  threshold: string;
  model: string;
};

export type EvaluationAnswer = {
  id: string;
  question: string;
  summary: string;
  tenant: string;
  timestamp: string;
  response: string;
  toolResult: string;
};

export type EvaluationMetric = {
  title: string;
  name: string;
  score: number;
  flagged: string;
};

export type EvaluationRun = {
  id: string;
  date: string;
  period: string;
  answers: number;
  cost: string;
  status: "good" | "failed";
  metrics: EvaluationMetric[];
  reviewAnswers: EvaluationAnswer[];
  reviews: Record<string, ReviewDecision>;
};

export const TENANTS = [
  "PT Nusantara Energi",
  "PT Maju Sejahtera",
  "CV Karya Mandiri"
];

export const DEFAULT_OPTIONS: EvaluationOptions = {
  period: "since-last-check",
  startDate: "",
  endDate: "",
  tenant: "all",
  threshold: "50",
  model: "gemini-flash-lite"
};

export const MOCK_ANSWERS: EvaluationAnswer[] = [
  {
    id: "vendor",
    question: "Which vendor shipped the most this month?",
    summary: "NEXA found PT Sinar Logam as the top vendor (1,240 shipments), but the data shows PT Baja Utama.",
    tenant: TENANTS[0],
    timestamp: "14 Oct, 09:12",
    response: "PT Sinar Logam shipped the most this month, with 1,240 shipments.",
    toolResult: "Top vendor: PT Baja Utama. Shipments: 1,240."
  },
  {
    id: "connections",
    question: "Which connections are active?",
    summary: "NEXA found 3 connections, including SAP-Gateway-01. The data lists the same 3: ERP-Prod, MongoDB-Reporting and SAP-Gateway-01.",
    tenant: TENANTS[1],
    timestamp: "3 Oct, 16:40",
    response: "There are 3 active connections: ERP-Prod, MongoDB-Reporting and SAP-Gateway-01.",
    toolResult: "Active connections (3): ERP-Prod, MongoDB-Reporting, SAP-Gateway-01."
  },
  {
    id: "workflow",
    question: "Save the workflow changes.",
    summary: "NEXA said workflow WF-0192 was saved, but the data only shows that 1 workflow was updated, without its name.",
    tenant: TENANTS[1],
    timestamp: "12 Oct, 14:32",
    response: "Your changes to workflow WF-0192 have been saved.",
    toolResult: "Updated workflows: 1. No workflow name or identifier returned."
  },
  {
    id: "email",
    question: "Add an email notification after approval.",
    summary: "NEXA said the email step was added, but the data shows the change was refused because the step has no recipient.",
    tenant: TENANTS[1],
    timestamp: "12 Oct, 14:40",
    response: "An email notification step has been added after approval.",
    toolResult: "Change refused. Email notification requires at least one recipient."
  },
  {
    id: "connectors",
    question: "How many connectors are available?",
    summary: "NEXA found 14 connectors, but the data shows 12.",
    tenant: TENANTS[2],
    timestamp: "21 Oct, 11:05",
    response: "There are 14 connectors available.",
    toolResult: "Available connectors: 12."
  }
];

export const MOCK_METRICS: EvaluationMetric[] = [
  { title: "Answers match tool data", name: "Faithfulness", score: 95, flagged: "5 answers flagged (2%)" },
  { title: "No contradictions", name: "Hallucination", score: 87, flagged: "31 answers flagged (11%)" },
  { title: "Answers on topic", name: "Answers relevancy", score: 77, flagged: "132 answers flagged (22%)" }
];

export const MOCK_RUNS: EvaluationRun[] = [
  {
    id: "oct-29", date: "29 Oct 2026", period: "1 Aug - 28 Oct",
    answers: 610, cost: "$4.53", status: "good",
    metrics: MOCK_METRICS, reviewAnswers: MOCK_ANSWERS,
    reviews: { vendor: "wrong", connections: "right" }
  },
  {
    id: "oct-15", date: "15 Oct 2026", period: "1 Oct - 14 Oct",
    answers: 488, cost: "$1.71", status: "failed",
    metrics: [], reviewAnswers: [], reviews: {}
  },
  {
    id: "oct-01", date: "1 Oct 2026", period: "1 Aug - 30 Sep",
    answers: 412, cost: "$3.06", status: "good",
    metrics: MOCK_METRICS.map((metric) => ({ ...metric, score: metric.score - 2 })),
    reviewAnswers: [], reviews: {}
  },
  {
    id: "sep-02", date: "2 Sep 2026", period: "1 Aug - 31 Aug",
    answers: 198, cost: "$1.47", status: "good",
    metrics: MOCK_METRICS.map((metric) => ({ ...metric, score: metric.score - 3 })),
    reviewAnswers: [], reviews: {}
  }
];

export function remainingReviews(run: EvaluationRun) {
  return run.reviewAnswers.filter((answer) => !run.reviews[answer.id]).length;
}

export function isValidPeriod(options: EvaluationOptions) {
  if (options.period !== "custom") return true;
  return Boolean(
    options.startDate && options.endDate && options.startDate <= options.endDate
  );
}

// Preview fixtures only. These values are not quotes from an evaluation service.
export function mockEstimate(options: EvaluationOptions) {
  const answers = options.tenant === "all" ? 96 : 32;
  return {
    answers,
    messages: options.tenant === "all" ? 142 : 47,
    cost: `$${(answers * 0.0074).toFixed(2)}`
  };
}
