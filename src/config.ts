import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { FeedSchema, type Feed } from "./schemas/feed.js";

export function loadFeedConfig(feedPath: string): Feed {
  const fullPath = resolve(feedPath);
  const raw = parse(readFileSync(fullPath, "utf-8"));

  const result = FeedSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid feed config at ${feedPath}:\n${issues}`);
  }

  return result.data;
}
