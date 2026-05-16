export interface TriageResult {
  article_id: string;
  score: number;   // 0–10
  reason: string;  // one sentence, max 100 chars
}
