-- D1 schema for cmake-w3-externaldata-upload
-- Migrated from DuckDB

CREATE TABLE IF NOT EXISTS upload_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  cid TEXT NOT NULL,
  upload_time TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_upload_log_auth_id ON upload_log(auth_id);
CREATE INDEX IF NOT EXISTS idx_upload_log_email ON upload_log(email);

CREATE TABLE IF NOT EXISTS blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_id TEXT,
  email TEXT
);

CREATE INDEX IF NOT EXISTS idx_blacklist_auth_id ON blacklist(auth_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON blacklist(email);
