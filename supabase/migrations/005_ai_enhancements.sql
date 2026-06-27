-- Phase 8: AI enhancements to ai_usage_logs + sentiment column on tickets

-- Add richer columns to ai_usage_logs
ALTER TABLE ai_usage_logs
  ADD COLUMN IF NOT EXISTS model           text,
  ADD COLUMN IF NOT EXISTS prompt_tokens   int,
  ADD COLUMN IF NOT EXISTS completion_tokens int,
  ADD COLUMN IF NOT EXISTS latency_ms      int,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd numeric(12,8),
  ADD COLUMN IF NOT EXISTS user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ticket_id       uuid REFERENCES tickets(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cached          boolean DEFAULT false;

-- Sentiment column on tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS sentiment text CHECK (sentiment IN ('positive','neutral','negative','frustrated','satisfied'));

-- AI usage summary view (used by AI dashboard)
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  org_id,
  feature,
  provider,
  model,
  COUNT(*)                          AS call_count,
  SUM(tokens_used)                  AS total_tokens,
  SUM(estimated_cost_usd)           AS total_cost_usd,
  AVG(latency_ms)                   AS avg_latency_ms,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) AS cache_hits,
  DATE_TRUNC('day', created_at)     AS day
FROM ai_usage_logs
GROUP BY org_id, feature, provider, model, DATE_TRUNC('day', created_at);
