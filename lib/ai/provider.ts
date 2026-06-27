import https from "node:https";
import type { AIMessage } from "@/lib/ai";
import type { AIProvider, AIProviderResponse } from "./types";

interface OpenAIResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
}

function httpsPost(url: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   "POST",
      headers:  {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...headers,
      },
      agent: new https.Agent({ keepAlive: false }),
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function callAIProvider(
  messages: AIMessage[],
  options: { maxTokens?: number } = {}
): Promise<AIProviderResponse> {
  const provider = (process.env.AI_PROVIDER ?? "openai") as AIProvider;
  const maxTokens = options.maxTokens ?? 1024;
  const start = Date.now();

  if (provider === "anthropic") {
    const systemMessage = messages.find((m) => m.role === "system")?.content ?? "";
    const userMessages  = messages.filter((m) => m.role !== "system");
    const model         = "claude-sonnet-4-6";

    const body = JSON.stringify({ model, max_tokens: maxTokens, system: systemMessage, messages: userMessages });

    const raw    = await httpsPost("https://api.anthropic.com/v1/messages", {
      "x-api-key":         process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    }, body);

    const parsed: AnthropicResponse = JSON.parse(raw);
    const text             = parsed.content.find((c) => c.type === "text")?.text ?? "";
    const promptTokens     = parsed.usage?.input_tokens  ?? 0;
    const completionTokens = parsed.usage?.output_tokens ?? 0;

    return {
      text, provider, model,
      promptTokens, completionTokens,
      tokensUsed: promptTokens + completionTokens,
      latencyMs:  Date.now() - start,
    };
  }

  // Default: OpenAI
  const model = "gpt-4o";
  const body  = JSON.stringify({ model, max_tokens: maxTokens, messages });

  const raw    = await httpsPost("https://api.openai.com/v1/chat/completions", {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
  }, body);

  const parsed: OpenAIResponse = JSON.parse(raw);
  const text             = parsed.choices[0]?.message?.content ?? "";
  const promptTokens     = parsed.usage?.prompt_tokens     ?? 0;
  const completionTokens = parsed.usage?.completion_tokens ?? 0;

  return {
    text, provider, model,
    promptTokens, completionTokens,
    tokensUsed: parsed.usage?.total_tokens ?? promptTokens + completionTokens,
    latencyMs:  Date.now() - start,
  };
}
