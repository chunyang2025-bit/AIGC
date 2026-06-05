import { createHash, timingSafeEqual } from "node:crypto";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

export type StoryGenerationInput = {
  accessCode?: unknown;
  prompt?: unknown;
  audience?: unknown;
  tone?: unknown;
  length?: unknown;
};

export type StoryGenerationResult = {
  story: string;
  model: string;
  provider: "deepseek" | "openai";
  usage?: ChatCompletionResponse["usage"] | OpenAIResponse["usage"];
};

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-5.2";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function secureEquals(input: string, expected: string) {
  if (!input || !expected) return false;
  return timingSafeEqual(sha256(input), sha256(expected));
}

export function validateAdminInviteCode(inputCode: unknown) {
  const input = String(inputCode || "").trim();
  const expected = String(process.env.ADMIN_INVITE_CODE || "").trim();
  return secureEquals(input, expected);
}

export function assertAiStoryAccess(inputCode: unknown) {
  if (!process.env.ADMIN_INVITE_CODE) {
    throw new Error("ADMIN_INVITE_CODE is not configured");
  }

  if (!validateAdminInviteCode(inputCode)) {
    throw new Error("Invalid admin invite code");
  }
}

function getAiStoryConfig() {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      provider: "deepseek" as const,
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL
    };
  }

  const openAiKey = process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return {
      provider: "openai" as const,
      apiKey: openAiKey,
      baseUrl: process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL,
      model: process.env.CODEX_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
    };
  }

  throw new Error("DEEPSEEK_API_KEY, CODEX_API_KEY, or OPENAI_API_KEY is not configured");
}

function asText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function buildStoryPrompt(input: StoryGenerationInput) {
  const prompt = asText(input.prompt);
  const audience = asText(input.audience, "general readers");
  const tone = asText(input.tone, "cinematic and emotionally grounded");
  const length = asText(input.length, "800-1200 words");

  return `Write an original story for ${audience}.
Tone: ${tone}.
Target length: ${length}.

Story brief:
${prompt}`;
}

function buildChatMessages(input: StoryGenerationInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a careful story generation assistant. Write original fiction only. Avoid copyrighted characters, private personal data, and unsafe instructions."
    },
    {
      role: "user",
      content: buildStoryPrompt(input)
    }
  ];
}

function extractOpenAiOutputText(payload: OpenAIResponse) {
  if (payload.output_text?.trim()) return payload.output_text.trim();

  return (
    payload.output
      ?.flatMap((item) => item.content || [])
      .filter((item) => item.type === "output_text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim() || ""
  );
}

async function generateDeepSeekStory(input: StoryGenerationInput, config: ReturnType<typeof getAiStoryConfig>) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages: buildChatMessages(input),
      temperature: 0.8,
      max_tokens: 1800,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText.slice(0, 240)}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const story = payload.choices?.[0]?.message?.content?.trim();
  if (!story) {
    throw new Error("DeepSeek returned an empty story");
  }

  return {
    story,
    model: config.model,
    provider: "deepseek" as const,
    usage: payload.usage
  };
}

async function generateOpenAiStory(input: StoryGenerationInput, config: ReturnType<typeof getAiStoryConfig>) {
  const response = await fetch(`${config.baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      instructions:
        "You are a careful story generation assistant. Write original fiction only. Avoid copyrighted characters, private personal data, and unsafe instructions.",
      input: buildStoryPrompt(input),
      max_output_tokens: 1800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 240)}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  const story = extractOpenAiOutputText(payload);
  if (!story) {
    throw new Error("OpenAI returned an empty story");
  }

  return {
    story,
    model: config.model,
    provider: "openai" as const,
    usage: payload.usage
  };
}

export async function generateAiStory(input: StoryGenerationInput): Promise<StoryGenerationResult> {
  assertAiStoryAccess(input.accessCode);

  const prompt = asText(input.prompt);
  if (!prompt) {
    throw new Error("Story prompt is required");
  }

  const config = getAiStoryConfig();
  return config.provider === "deepseek" ? generateDeepSeekStory(input, config) : generateOpenAiStory(input, config);
}
