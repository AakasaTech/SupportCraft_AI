import type { ImprovementAction } from "../types";

const ACTION_INSTRUCTIONS: Record<ImprovementAction, string> = {
  improve:   "Improve the clarity, flow, and professionalism of this text while preserving its meaning.",
  shorten:   "Shorten this text significantly while preserving all key information. Remove redundant phrases.",
  expand:    "Expand this text with more detail, context, and helpful information.",
  formalize: "Rewrite this text in a formal, professional business tone. No contractions.",
  simplify:  "Simplify this text so it's easy to understand for a non-technical reader.",
  translate: "Improve the grammar and readability of this text (re-write in clear, standard English).",
};

export function buildImprovePrompt(text: string, action: ImprovementAction): {
  system: string;
  user:   string;
} {
  return {
    system: `You are an expert editor helping a customer support agent improve their replies.
${ACTION_INSTRUCTIONS[action]}
Return ONLY the improved text. No explanations, no quotes, no preamble.`,
    user: text,
  };
}
