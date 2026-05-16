import { createHash } from "node:crypto";

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function makeId(url: string, title: string): string {
  return createHash("sha256").update(url + title).digest("hex").slice(0, 12);
}

export function withinLastDay(isoDate: string | undefined): boolean {
  if (!isoDate) return true; // no date → include (don't silently drop)
  return Date.now() - new Date(isoDate).getTime() < TWENTY_FOUR_HOURS_MS;
}
