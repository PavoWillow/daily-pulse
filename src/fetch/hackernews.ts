import type { Source } from "../schemas/feed.js";
import type { Article } from "./types.js";
import { makeId, withinLastDay } from "./utils.js";

interface HNHit {
  objectID: string;
  title: string;
  url?: string | null;
  points: number;
  num_comments: number;
  created_at: string;
}

interface AlgoliaResponse {
  hits: HNHit[];
}

export async function fetchHackernews(source: Source): Promise<Article[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { "User-Agent": "daily-pulse/0.1" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as AlgoliaResponse;

    return data.hits
      .filter((hit) => withinLastDay(hit.created_at))
      .slice(0, source.max_items)
      .map((hit) => {
        const url = hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`;
        return {
          id: makeId(url, hit.title),
          source_id: source.id,
          source_name: source.name,
          title: hit.title,
          url,
          published_at: hit.created_at,
          summary: hit.title,
          score: hit.points,
          comments_count: hit.num_comments,
        };
      });
  } finally {
    clearTimeout(timeout);
  }
}
