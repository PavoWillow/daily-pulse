import Anthropic from "@anthropic-ai/sdk";
import type { Article } from "../fetch/types.js";
import type { Feed } from "../schemas/feed.js";
import type { TriageResult } from "./types.js";
import { buildTriagePrompt } from "./prompt.js";

const BATCH_SIZE = 20;
const CONCURRENCY = 3;
const MODEL = "claude-haiku-4-5-20251001";
const INPUT_COST_PER_M = 1.0;  // $ per million tokens
const OUTPUT_COST_PER_M = 5.0;

const client = new Anthropic();

const triageTool: Anthropic.Tool = {
  name: "triage_articles",
  description: "Return relevance scores for a batch of articles",
  input_schema: {
    type: "object" as const,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            article_id: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 10 },
            reason: { type: "string" },
          },
          required: ["article_id", "score", "reason"],
        },
      },
    },
    required: ["results"],
  },
};

async function triageBatch(
  articles: Article[],
  feed: Feed
): Promise<{ results: TriageResult[]; inputTokens: number; outputTokens: number }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [triageTool],
    tool_choice: { type: "tool", name: "triage_articles" },
    messages: [{ role: "user", content: buildTriagePrompt(articles, feed) }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error(
      `Haiku returned no tool_use block. stop_reason=${response.stop_reason} ` +
        `content=${JSON.stringify(response.content)}`
    );
  }

  const input = toolUse.input as { results?: TriageResult[] } | TriageResult[];
  const results = Array.isArray(input) ? input : input.results;
  if (!Array.isArray(results)) {
    throw new Error(`Unexpected tool input shape: ${JSON.stringify(input)}`);
  }
  return {
    results,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Runs tasks with at most `limit` in-flight concurrently.
async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  const queue = Array.from(tasks.entries()); // [index, task][]

  async function worker() {
    while (queue.length > 0) {
      const [idx, task] = queue.shift()!;
      try {
        results[idx] = { status: "fulfilled", value: await task() };
      } catch (e) {
        results[idx] = { status: "rejected", reason: e };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}

export async function triageArticles(
  articles: Article[],
  feed: Feed
): Promise<TriageResult[]> {
  const batches: Article[][] = [];
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(articles.slice(i, i + BATCH_SIZE));
  }

  const tasks = batches.map((batch) => () => triageBatch(batch, feed));
  const settled = await withConcurrency(tasks, CONCURRENCY);

  const allResults: TriageResult[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === "rejected") {
      console.warn(`[WARN] Triage batch ${i + 1} failed: ${result.reason}`);
      continue;
    }
    allResults.push(...result.value.results);
    totalInput += result.value.inputTokens;
    totalOutput += result.value.outputTokens;
  }

  const cost =
    (totalInput / 1_000_000) * INPUT_COST_PER_M +
    (totalOutput / 1_000_000) * OUTPUT_COST_PER_M;

  console.log(
    `Triaged ${articles.length} articles across ${batches.length} batch${batches.length === 1 ? "" : "es"}. ` +
      `Estimated cost: $${cost.toFixed(4)}`
  );

  return allResults;
}
