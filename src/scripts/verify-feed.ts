import { loadFeedConfig } from "../config.js";

const feedArg = process.argv.find((a) => a.startsWith("--feed="));
if (!feedArg) {
  console.error("Usage: tsx src/scripts/verify-feed.ts --feed=<feed-id>");
  process.exit(1);
}

const feedId = feedArg.slice("--feed=".length);
const feedPath = `feeds/${feedId}.yaml`;

try {
  const config = loadFeedConfig(feedPath);
  console.log(`✓ "${config.name}" loaded — ${config.sources.length} sources\n`);
  console.log(JSON.stringify(config, null, 2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
