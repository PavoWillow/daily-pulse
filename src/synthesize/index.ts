import Anthropic from "@anthropic-ai/sdk";
import type { Feed } from "../schemas/feed.js";
import type { ArticleForSynthesis } from "./types.js";

const MIN_SCORE = 6;
const MAX_ARTICLES = 15;
const MODEL = "claude-sonnet-4-6";
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

const client = new Anthropic();

function formatArticles(articles: ArticleForSynthesis[]): string {
  return articles
    .map(
      (a, i) =>
        `Article ${i + 1}: ${a.title} (from ${a.source_name}, score ${a.score})\n${a.summary}\nURL: ${a.url}`
    )
    .join("\n\n");
}

export async function synthesizeBrief(
  articles: ArticleForSynthesis[],
  feed: Feed
): Promise<string> {
  const top = articles
    .filter((a) => a.score >= MIN_SCORE)
    .slice(0, MAX_ARTICLES);

  if (top.length === 0) {
    throw new Error(
      `No articles scored ${MIN_SCORE}+ today -- skipping synthesis.`
    );
  }

  console.log(`Synthesizing from ${top.length} articles (score >= ${MIN_SCORE})...`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: feed.synthesis_prompt,
    messages: [{ role: "user", content: formatArticles(top) }],
  });

  const block = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!block) throw new Error("Sonnet returned no text block");

  const cost =
    (response.usage.input_tokens / 1_000_000) * INPUT_COST_PER_M +
    (response.usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_M;

  console.log(
    `Synthesized brief: $${cost.toFixed(4)}, ` +
      `~${response.usage.input_tokens} input tokens, ~${response.usage.output_tokens} output tokens`
  );

  return block.text;
}
