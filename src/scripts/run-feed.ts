import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadFeedConfig } from "../config.js";
import { fetchAllSources } from "../fetch/index.js";
import { triageArticles } from "../triage/index.js";
import { synthesizeBrief } from "../synthesize/index.js";
import type { Article } from "../fetch/types.js";
import type { TriageResult } from "../triage/types.js";
import type { ArticleForSynthesis } from "../synthesize/types.js";

const feedArg = process.argv.find((a) => a.startsWith("--feed="));
if (!feedArg) {
  console.error("Usage: tsx src/scripts/run-feed.ts --feed=<feed-id>");
  process.exit(1);
}

const feedId = feedArg.slice("--feed=".length);

interface EnrichedResult extends TriageResult {
  article: Article;
}

function col(s: string, n: number): string {
  return s.slice(0, n).padEnd(n);
}

async function main() {
  console.log(`\n=== daily-pulse: ${feedId} ===\n`);

  const feed = loadFeedConfig(`feeds/${feedId}.yaml`);
  console.log(`Loaded: ${feed.name} (${feed.sources.length} sources)`);

  console.log("Fetching articles from all sources...");
  const articles = await fetchAllSources(feed);
  console.log(`Fetched ${articles.length} articles (last 24h, deduped)\n`);

  if (articles.length === 0) {
    console.log("No articles in the last 24h. Nothing to triage.");
    process.exit(0);
  }

  console.log("Running Haiku triage...");
  const triageResults = await triageArticles(articles, feed);

  const articleMap = new Map(articles.map((a) => [a.id, a]));
  const enriched: EnrichedResult[] = triageResults
    .filter((r) => articleMap.has(r.article_id))
    .map((r) => ({ ...r, article: articleMap.get(r.article_id)! }))
    .sort((a, b) => b.score - a.score);

  // Table output
  const divider = "-".repeat(7 + 3 + 22 + 3 + 62 + 3 + 80);
  console.log("\n" + [
    col("SCORE", 7),
    col("SOURCE", 22),
    col("TITLE", 62),
    col("REASON", 80),
  ].join(" | "));
  console.log(divider);

  for (const r of enriched) {
    console.log([
      col(String(r.score), 7),
      col(r.article.source_name, 22),
      col(r.article.title, 62),
      col(r.reason, 80),
    ].join(" | "));
  }

  // Write triage JSON
  const date = new Date().toISOString().slice(0, 10);
  const outDir = join("briefs", feedId);
  mkdirSync(outDir, { recursive: true });
  const triagePath = join(outDir, `triage-${date}.json`);
  writeFileSync(triagePath, JSON.stringify(enriched, null, 2));
  console.log(`\nWrote ${enriched.length} triage results → ${triagePath}`);

  // Synthesis pass
  console.log("\nRunning Sonnet synthesis...");
  const articlesForSynthesis: ArticleForSynthesis[] = enriched.map((r) => ({
    title: r.article.title,
    source_name: r.article.source_name,
    summary: r.article.summary,
    url: r.article.url,
    score: r.score,
  }));

  let brief: string;
  try {
    brief = await synthesizeBrief(articlesForSynthesis, feed);
  } catch (err) {
    console.warn(err instanceof Error ? err.message : String(err));
    process.exit(0);
  }

  const briefPath = join(outDir, `brief-${date}.md`);
  writeFileSync(briefPath, brief);
  console.log(`Wrote brief → ${briefPath}\n`);

  console.log("=".repeat(80));
  console.log(brief);
  console.log("=".repeat(80));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
