-- Run this in your Supabase SQL Editor to create the predictions table

CREATE TABLE IF NOT EXISTS predictions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW(),

  -- Input features
  n_value              FLOAT,
  p_value              FLOAT,
  k_value              FLOAT,
  ph                   FLOAT,
  temperature          FLOAT,
  humidity             FLOAT,
  rainfall             FLOAT,
  organic_carbon       FLOAT,

  -- SHI output
  soil_health_index    FLOAT,
  health_category      TEXT,

  -- ML output
  crop_recommendation  TEXT,
  crop_confidence      FLOAT,
  yield_prediction     FLOAT,

  -- Logic output
  fertilizer_advice    JSONB
);

-- Enable Row Level Security (optional — remove if not needed)
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Index for recent queries
CREATE INDEX IF NOT EXISTS idx_predictions_created_at
  ON predictions (created_at DESC);
