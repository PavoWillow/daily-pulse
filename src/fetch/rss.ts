import Parser from "rss-parser";
import type { Source } from "../schemas/feed.js";
import type { Article } from "./types.js";
import { makeId, withinLastDay } from "./utils.js";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "daily-pulse/0.1" },
});

export async function fetchRss(source: Source): Promise<Article[]> {
  const feed = await parser.parseURL(source.url);

  return feed.items
    .filter((item) => withinLastDay(item.isoDate))
    .slice(0, source.max_items)
    .map((item) => {
      const url = item.link ?? item.guid ?? "";
      const title = item.title ?? "(untitled)";
      return {
        id: makeId(url, title),
        source_id: source.id,
        source_name: source.name,
        title,
        url,
        published_at: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet ?? item.summary ?? title,
      };
    });
}
