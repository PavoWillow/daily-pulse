export interface Article {
  id: string;            // SHA-256(url + title), first 12 hex chars
  source_id: string;
  source_name: string;
  title: string;
  url: string;
  published_at: string;  // ISO 8601
  summary: string;
  score?: number;        // HN only
  comments_count?: number; // HN only
}
