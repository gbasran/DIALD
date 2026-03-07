# Google Gemini API Research for Next.js Applications

> **Research date:** March 2026
> **Based on:** @google/generative-ai SDK documentation (stable as of May 2025)
> **Note:** Core APIs (chat, streaming, system instructions) are stable. Model availability
> and free-tier limits may have changed after May 2025 -- verify at https://ai.google.dev/pricing.

---

## Table of Contents

1. [Package Installation and Setup](#1-package-installation-and-setup)
2. [API Key (Free Tier)](#2-api-key-free-tier)
3. [Chat with Streaming](#3-chat-with-streaming)
4. [System Instructions](#4-system-instructions)
5. [Model Selection](#5-model-selection)
6. [Streaming Response Handling in Next.js](#6-streaming-response-handling-in-nextjs)
7. [Message History Format](#7-message-history-format)
8. [Error Handling](#8-error-handling)
9. [Complete Next.js Integration Example](#9-complete-nextjs-integration-example)

---

## 1. Package Installation and Setup

### Install

```bash
npm install @google/generative-ai
```

### Import and Initialize

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

### Get a Model Instance

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
```

### Key Exports

The package exports several important classes and types:

```typescript
import {
  GoogleGenerativeAI,       // Main entry point
  HarmCategory,             // Enum for safety setting categories
  HarmBlockThreshold,       // Enum for safety thresholds
  ChatSession,              // Returned by model.startChat()
  GenerativeModel,          // Returned by genAI.getGenerativeModel()
  GenerateContentResult,    // Non-streaming response
  GenerateContentStreamResult, // Streaming response
} from "@google/generative-ai";
```

### Environment Variable

In a Next.js project, store the key in `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

**Important:** This key must only be used server-side. Never expose it to the client.
In Next.js App Router, API routes and Server Components run server-side by default.

---

## 2. API Key (Free Tier)

### How to Get a Free API Key

1. Go to **https://aistudio.google.com/apikey** (or navigate from https://ai.google.dev)
2. Sign in with a Google account
3. Click "Create API key"
4. Choose an existing Google Cloud project or create a new one
5. Copy the generated key

No credit card is required. The free tier is available immediately.

### Free Tier Limits (as of May 2025 -- verify current limits)

For **Gemini 2.0 Flash** on the free tier:

| Limit                   | Value               |
|------------------------|---------------------|
| Requests per minute    | 15 RPM              |
| Tokens per minute      | 1,000,000 TPM       |
| Requests per day       | 1,500 RPD           |
| Input token limit      | 1,048,576 tokens    |
| Output token limit     | 8,192 tokens        |

For **Gemini 1.5 Flash** on the free tier:

| Limit                   | Value               |
|------------------------|---------------------|
| Requests per minute    | 15 RPM              |
| Tokens per minute      | 1,000,000 TPM       |
| Requests per day       | 1,500 RPD           |

For **Gemini 1.5 Pro** on the free tier:

| Limit                   | Value               |
|------------------------|---------------------|
| Requests per minute    | 2 RPM               |
| Tokens per minute      | 32,000 TPM          |
| Requests per day       | 50 RPD              |

> **VERIFY:** These limits were accurate as of early-to-mid 2025. Google frequently
> adjusts them. Check https://ai.google.dev/pricing for the latest numbers.

### Key Free Tier Restrictions

- Data may be used to improve Google's models (not the case on paid tier)
- Lower rate limits compared to pay-as-you-go
- No SLA guarantees
- Some features may be limited or unavailable

---

## 3. Chat with Streaming

### Starting a Chat Session

```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello, I'm working on a project about climate change." }],
    },
    {
      role: "model",
      parts: [{ text: "That sounds interesting! How can I help you with your climate change project?" }],
    },
  ],
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
  },
});
```

### Sending a Message (Non-Streaming)

```typescript
const result = await chat.sendMessage("What are the main causes?");
const response = result.response;
const text = response.text();
console.log(text);
```

### Sending a Message with Streaming

```typescript
const result = await chat.sendMessageStream("What are the main causes?");

// Consume the stream chunk by chunk
for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  process.stdout.write(chunkText);
}

// After the stream completes, get the full aggregated response
const aggregatedResponse = await result.response;
console.log(aggregatedResponse.text());
```

### API Shape of `sendMessageStream()`

```typescript
// Signature
chat.sendMessageStream(
  request: string | Array<Part>
): Promise<GenerateContentStreamResult>

// GenerateContentStreamResult shape
interface GenerateContentStreamResult {
  stream: AsyncIterable<GenerateContentResponse>;
  response: Promise<GenerateContentResponse>;
}

// GenerateContentResponse shape
interface GenerateContentResponse {
  candidates: Candidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
  text(): string;  // Convenience method
}

// Each stream chunk is a GenerateContentResponse
// chunk.text() returns just the new text in that chunk
```

### Important Behavior Notes

- `sendMessageStream()` returns a `Promise` that resolves to a `GenerateContentStreamResult`
  (you must `await` the call itself, then iterate the `.stream` property).
- The chat session automatically tracks history. After each `sendMessage` or
  `sendMessageStream` call, the user message and model response are appended to
  the internal history.
- `result.response` is a `Promise` that resolves only after the entire stream
  has been consumed. You can use it to get the full aggregated text.

---

## 4. System Instructions

### Passing System Instructions via `getGenerativeModel()`

System instructions are set when creating the model instance, not per-message:

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are a helpful coding tutor. You explain concepts clearly and provide working code examples. Always use TypeScript in your examples.",
});
```

### System Instruction with Structured Content

You can also pass it as a `Content` object for more complex instructions:

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: {
    role: "system",
    parts: [{ text: "You are a helpful coding tutor specializing in React and Next.js." }],
  },
});
```

However, the simple string form is the most common and recommended approach:

```typescript
systemInstruction: "Your system prompt here"
```

### Key Points about System Instructions

- System instructions persist across all messages in a chat session.
- They are NOT part of the chat `history` array -- they are set at the model level.
- They influence the model's behavior, tone, and constraints.
- The model treats them as high-priority guidance.
- You can include rules, persona definitions, output format requirements, etc.

### Example: Chat with System Instructions

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are a concise technical assistant. Answer in 2-3 sentences max. Use code blocks when relevant.",
});

const chat = model.startChat();
const result = await chat.sendMessageStream("How do I center a div in CSS?");

for await (const chunk of result.stream) {
  process.stdout.write(chunk.text());
}
```

---

## 5. Model Selection

### Available Models (as of May 2025)

| Model                    | Best For                           | Context Window | Notes                           |
|--------------------------|-------------------------------------|---------------|----------------------------------|
| `gemini-2.0-flash`      | Fast, general-purpose              | 1M tokens     | Best balance of speed & quality  |
| `gemini-2.0-flash-lite` | Fastest, cost-efficient            | 1M tokens     | Lower quality, highest speed     |
| `gemini-1.5-flash`      | Fast, previous generation          | 1M tokens     | Still supported, but prefer 2.0  |
| `gemini-1.5-pro`        | Highest quality (1.5 gen)          | 2M tokens     | Slower, stricter free-tier limits|
| `gemini-2.5-pro`        | Highest quality (latest)           | 1M tokens     | May have limited free-tier access|

### Recommendation for Free Tier: `gemini-2.0-flash`

**`gemini-2.0-flash`** is the best choice for a hackathon/free-tier project because:

- Generous free-tier limits (15 RPM, 1500 RPD)
- Very fast response times
- Strong quality for chat, coding, and general tasks
- 1M token context window
- Good streaming performance
- Multimodal (text, images, audio, video input)

### Model String Format

```typescript
// Use the model name string directly
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// You can also specify a version suffix if needed
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
```

> **VERIFY:** Google may have released newer models (e.g., Gemini 2.5 Flash, or new
> versions of existing models) after May 2025. Check https://ai.google.dev/gemini-api/docs/models/gemini
> for the current model list.

---

## 6. Streaming Response Handling in Next.js

### Approach: Next.js Route Handler with ReadableStream

The standard pattern is to create a Next.js API route that consumes the Gemini stream
server-side and pipes it to the client as a `ReadableStream`.

#### Server Side: `/app/api/chat/route.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { messages, message } = await req.json();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a helpful assistant.",
  });

  // Convert messages to Gemini history format
  const history = messages.map((msg: { role: string; content: string }) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(message);

  // Create a ReadableStream to pipe chunks to the client
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
```

#### Client Side: React Component

```typescript
"use client";

import { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages, // history (excludes the latest user message)
          message: userMessage,
        }),
      });

      if (!response.ok) throw new Error("API request failed");
      if (!response.body) throw new Error("No response body");

      // Add empty assistant message that we will stream into
      setMessages([...updatedMessages, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        assistantContent += text;

        // Update the last message (assistant) with accumulated text
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, an error occurred." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Alternative: Server-Sent Events (SSE)

For more structured streaming, you can use SSE format:

```typescript
// In the route handler, format as SSE:
const stream = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          const data = JSON.stringify({ text });
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        }
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    } catch (error) {
      controller.error(error);
    }
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  },
});
```

Client-side SSE consumption:

```typescript
const response = await fetch("/api/chat", { method: "POST", /* ... */ });
const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") return;
      const parsed = JSON.parse(data);
      // Use parsed.text
    }
  }
}
```

---

## 7. Message History Format

### Gemini Chat History Structure

The Gemini API uses a specific format for chat history:

```typescript
interface Content {
  role: "user" | "model";    // NOTE: "model", not "assistant"
  parts: Part[];
}

interface TextPart {
  text: string;
}

interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;  // base64 encoded
  };
}

type Part = TextPart | InlineDataPart;
```

### Example History Array

```typescript
const history = [
  {
    role: "user",
    parts: [{ text: "What is TypeScript?" }],
  },
  {
    role: "model",
    parts: [{ text: "TypeScript is a typed superset of JavaScript..." }],
  },
  {
    role: "user",
    parts: [{ text: "How is it different from JavaScript?" }],
  },
  {
    role: "model",
    parts: [{ text: "The main differences are..." }],
  },
];
```

### Critical Rules

1. **Roles alternate.** History must alternate between `"user"` and `"model"`.
   Two consecutive messages with the same role will cause an error.

2. **First message must be `"user"`.** The history must start with a user message.

3. **Role is `"model"`, NOT `"assistant"`.** This is different from OpenAI's format.
   This is a common source of bugs when migrating from OpenAI.

4. **`parts` is always an array**, even for a single text message. Each element is
   an object with a `text` property (for text content).

5. **System instructions are NOT in history.** They go in `systemInstruction` on the
   model config, not as a message in the history array.

### Mapping from Common Chat Formats

If your frontend uses OpenAI-style `{ role: "user"|"assistant", content: string }`:

```typescript
function toGeminiHistory(messages: { role: string; content: string }[]) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}
```

---

## 8. Error Handling

### Common Errors and Their Causes

#### 1. Invalid API Key (401)

```typescript
// Error: [GoogleGenerativeAI Error]: Error fetching from ...: [401] API key not valid.
// Cause: Wrong key, expired key, or key not set

try {
  const result = await chat.sendMessage("Hello");
} catch (error) {
  if (error.message?.includes("401") || error.message?.includes("API key")) {
    console.error("Invalid API key. Check GEMINI_API_KEY.");
  }
}
```

#### 2. Rate Limit Exceeded (429)

```typescript
// Error: [GoogleGenerativeAI Error]: Error fetching from ...: [429] Resource exhausted
// Cause: Exceeded RPM, TPM, or RPD limits

try {
  const result = await chat.sendMessage(userInput);
} catch (error) {
  if (error.message?.includes("429") || error.message?.includes("Resource exhausted")) {
    console.error("Rate limit hit. Wait and retry.");
    // Implement exponential backoff
  }
}
```

#### 3. Safety Filter Blocked (FinishReason.SAFETY)

```typescript
// The response may be blocked by safety filters without throwing an error.
// Instead, the response will have no candidates or a blocked candidate.

const result = await chat.sendMessage(userInput);
const response = result.response;

if (!response.candidates || response.candidates.length === 0) {
  console.error("Response blocked by safety filters.");
  // Check response.promptFeedback for details
  console.log(response.promptFeedback);
  return;
}

const candidate = response.candidates[0];
if (candidate.finishReason === "SAFETY") {
  console.error("Response blocked due to safety.", candidate.safetyRatings);
  return;
}

const text = response.text();
```

#### 4. Invalid History Format (400)

```typescript
// Error: [400] ... messages must alternate between user and model
// Cause: Two consecutive messages with the same role, or missing parts

// Solution: Validate history before sending
function validateHistory(history: { role: string; parts: { text: string }[] }[]) {
  for (let i = 1; i < history.length; i++) {
    if (history[i].role === history[i - 1].role) {
      throw new Error(`History has consecutive ${history[i].role} messages at index ${i}`);
    }
  }
  if (history.length > 0 && history[0].role !== "user") {
    throw new Error("History must start with a user message");
  }
}
```

#### 5. Model Not Found (404)

```typescript
// Error: [404] models/gemini-xyz is not found
// Cause: Incorrect model name or model not available in your region

// Solution: Double-check the model string
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // correct
```

#### 6. Content Too Large (400)

```typescript
// Error: [400] ... exceeds the maximum number of tokens
// Cause: Input + history exceeds the model's context window

// Solution: Trim history or summarize older messages
```

### Comprehensive Error Handler

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

async function safeSendMessage(
  chat: any,
  message: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const result = await chat.sendMessageStream(message);
    let fullText = "";

    for await (const chunk of result.stream) {
      fullText += chunk.text();
    }

    // Check if the response was actually completed
    const response = await result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      return {
        success: false,
        error: "No response generated. May have been blocked by safety filters.",
      };
    }

    if (candidate.finishReason === "SAFETY") {
      return {
        success: false,
        error: "Response blocked by safety filters.",
      };
    }

    if (candidate.finishReason === "MAX_TOKENS") {
      return {
        success: true,
        text: fullText,
        // Response was truncated but still usable
      };
    }

    return { success: true, text: fullText };
  } catch (error: any) {
    const message = error.message || String(error);

    if (message.includes("429") || message.includes("Resource exhausted")) {
      return { success: false, error: "Rate limit exceeded. Please wait a moment." };
    }
    if (message.includes("401") || message.includes("API key")) {
      return { success: false, error: "Invalid API key." };
    }
    if (message.includes("404")) {
      return { success: false, error: "Model not found." };
    }
    if (message.includes("400")) {
      return { success: false, error: `Bad request: ${message}` };
    }

    return { success: false, error: `Unexpected error: ${message}` };
  }
}
```

### Configuring Safety Settings

You can relax safety settings to reduce false positives:

```typescript
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});
```

---

## 9. Complete Next.js Integration Example

### Generation Config Options

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are a helpful assistant.",
  generationConfig: {
    temperature: 0.7,        // 0.0 = deterministic, 2.0 = very random
    topP: 0.95,              // Nucleus sampling
    topK: 40,                // Top-K sampling
    maxOutputTokens: 2048,   // Max tokens in response
    stopSequences: ["END"],  // Optional stop sequences
  },
});
```

### Full Route Handler with All Features

```typescript
// /app/api/chat/route.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: "You are a helpful assistant for a hackathon project.",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Build history from previous messages (excluding the current one)
    const history = (messages || []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })
    );

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error: any) {
          const errorMessage = error.message || "Stream error";
          controller.enqueue(
            new TextEncoder().encode(`\n[ERROR: ${errorMessage}]`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    const message = error.message || "Internal server error";
    let status = 500;

    if (message.includes("429")) status = 429;
    else if (message.includes("401")) status = 401;
    else if (message.includes("400")) status = 400;

    return NextResponse.json({ error: message }, { status });
  }
}
```

---

## Quick Reference Cheatsheet

```typescript
// 1. Install
// npm install @google/generative-ai

// 2. Initialize
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 3. Get model with system instruction
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are a helpful assistant.",
});

// 4. Start chat with optional history
const chat = model.startChat({
  history: [
    { role: "user", parts: [{ text: "Hi" }] },
    { role: "model", parts: [{ text: "Hello! How can I help?" }] },
  ],
});

// 5. Stream a response
const result = await chat.sendMessageStream("Tell me about Next.js");
for await (const chunk of result.stream) {
  process.stdout.write(chunk.text());
}

// 6. Roles: "user" | "model" (NOT "assistant")
// 7. History must alternate roles, starting with "user"
// 8. System instructions go in getGenerativeModel(), NOT in history
```

---

## Things That May Have Changed Since May 2025

- **New models**: Google may have released newer models (Gemini 2.5 Flash, Gemini 3.x, etc.)
- **Free tier limits**: RPM/RPD/TPM limits may have been adjusted
- **SDK version**: Package version and minor API changes
- **New features**: Function calling, grounding, code execution, or other features may have new APIs
- **Model deprecations**: Older models (gemini-1.0-pro, gemini-1.5-flash-8b) may have been sunset

Always verify against:
- https://ai.google.dev/gemini-api/docs
- https://ai.google.dev/pricing
- https://www.npmjs.com/package/@google/generative-ai
