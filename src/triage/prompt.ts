import type { Article } from "../fetch/types.js";
import type { Feed } from "../schemas/feed.js";

export function buildTriagePrompt(articles: Article[], feed: Feed): string {
  const list = articles
    .map(
      (a) =>
        `ID: ${a.id}\nTitle: ${a.title}\nSource: ${a.source_name}\nSummary: ${a.summary.slice(0, 300)}`
    )
    .join("\n\n");

  return `You are triaging articles for a daily intelligence brief called "${feed.name}".

RELEVANCE CRITERIA:
${feed.relevance_criteria.trim()}

ARTICLES TO SCORE:
${list}

Use the triage_articles tool to score every article. Score 0–10 where 10 = must-read for this brief, 0 = completely irrelevant. Keep each reason under 100 characters.`;
}
