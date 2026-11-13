CREATE TABLE IF NOT EXISTS pantry_usage (
  period TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts >= 0)
);
