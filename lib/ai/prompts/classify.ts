export function buildClassifyPrompt(title: string, description: string): {
  system: string;
  user:   string;
} {
  return {
    system: `You are a support ticket classifier. Analyze the ticket and respond with ONLY valid JSON — no markdown, no code fences:
{
  "priority": "low" | "medium" | "high" | "urgent",
  "category": string,
  "tags": string[],
  "sentiment": "positive" | "neutral" | "negative" | "frustrated" | "satisfied",
  "sentimentScore": number between 0 and 1,
  "sentimentExplanation": string
}

Priority rules:
- urgent: system down, data loss, security breach
- high: significant impact, no workaround
- medium: impacts work, workaround exists
- low: minor inconvenience, question, feature request

Common categories: Billing, Technical, Account, Bug Report, Feature Request, General`,
    user: `Title: ${title}\n\nDescription: ${description}`,
  };
}
