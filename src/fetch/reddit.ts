import Parser from "rss-parser";
import type { Source } from "../schemas/feed.js";
import type { Article } from "./types.js";
import { makeId, withinLastDay } from "./utils.js";

// rss-parser doesn't reliably forward headers to the underlying HTTP request.
// Reddit 403s anything that looks like a bot without a real User-Agent.
// Fix: fetch the XML ourselves then hand the string to parseString().
const parser = new Parser({ timeout: 10000 });

const REDDIT_UA = "daily-pulse/0.1 (by /u/PavoWillow)";

export async function fetchReddit(source: Source): Promise<Article[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": REDDIT_UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${source.url}`);
  const xml = await res.text();
  const feed = await parser.parseString(xml);

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
        summary: item.contentSnippet ?? title,
      };
    });
}
