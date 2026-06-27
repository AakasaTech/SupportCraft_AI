export type AIProvider = "openai" | "anthropic";

export type AIFeature =
  | "reply"
  | "improve"
  | "summarize"
  | "classify"
  | "sentiment"
  | "suggest"
  | "categorize"
  | "kb_generate"
  | "kb_improve";

export type ReplyTone = "professional" | "friendly" | "empathetic" | "concise" | "formal";

export type ImprovementAction =
  | "improve"
  | "shorten"
  | "expand"
  | "formalize"
  | "simplify"
  | "translate";

export type SentimentLabel = "positive" | "neutral" | "negative" | "frustrated" | "satisfied";

export interface AIProviderResponse {
  text:             string;
  promptTokens:     number;
  completionTokens: number;
  tokensUsed:       number;
  model:            string;
  latencyMs:        number;
  provider:         AIProvider;
}

export interface ClassificationResult {
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  tags:     string[];
  sentiment?: SentimentLabel;
  confidence?: number;
}

export interface SentimentResult {
  label:       SentimentLabel;
  score:       number; // 0-1
  explanation: string;
}

export interface TicketSummary {
  summary:       string;
  keyPoints:     string[];
  suggestedNext: string;
  resolved:      boolean;
}

export interface AIUsageRecord {
  orgId:            string;
  feature:          AIFeature;
  provider:         AIProvider;
  model:            string;
  tokensUsed:       number;
  promptTokens:     number;
  completionTokens: number;
  latencyMs:        number;
  estimatedCostUsd: number;
  userId?:          string;
  ticketId?:        string;
  cached:           boolean;
}

export interface TicketContext {
  ticket: {
    id:          string;
    title:       string;
    description: string;
    status:      string;
    priority:    string;
    category:    string | null;
    tags:        string[];
    sentiment?:  string | null;
  };
  conversation: {
    role:    "customer" | "agent" | "ai";
    content: string;
  }[];
  kbArticles: {
    title:   string;
    content: string;
  }[];
  org: {
    id:   string;
    name: string;
    plan: string;
  };
}
