import type { Feed } from "../schemas/feed.js";
import type { Article } from "./types.js";
import { fetchRss } from "./rss.js";
import { fetchReddit } from "./reddit.js";
import { fetchHackernews } from "./hackernews.js";

export async function fetchAllSources(feed: Feed): Promise<Article[]> {
  const settled = await Promise.allSettled(
    feed.sources.map((source) => {
      switch (source.type) {
        case "rss":        return fetchRss(source);
        case "reddit":     return fetchReddit(source);
        case "hackernews": return fetchHackernews(source);
      }
    })
  );

  const articles: Article[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    const source = feed.sources[i];

    if (result.status === "rejected") {
      console.warn(`[WARN] ${source.name}: ${result.reason}`);
      continue;
    }

    for (const article of result.value) {
      if (!seen.has(article.id)) {
        seen.add(article.id);
        articles.push(article);
      }
    }
  }

  return articles;
}
