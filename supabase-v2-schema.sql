-- Deals Machine v2 — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Drop old v1 tables if migrating (comment out if you want to keep v1 data)
-- DROP TABLE IF EXISTS company_intel, script_variants, call_outcomes, emails, email_templates, scripts, actions, search_configs, client_settings CASCADE;

-- Leads table (extends v1)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, tag)
);

-- Lists
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  auto_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- List members
CREATE TABLE IF NOT EXISTS list_members (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, lead_id)
);

-- Sequences
CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id TEXT PRIMARY KEY,
  sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  subject_template TEXT NOT NULL DEFAULT '',
  body_template TEXT NOT NULL DEFAULT '',
  UNIQUE(sequence_id, step_number)
);

-- Sequence enrollments
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id TEXT PRIMARY KEY,
  sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  list_id TEXT REFERENCES lists(id) ON DELETE SET NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  UNIQUE(sequence_id, lead_id)
);

-- Call queue
CREATE TABLE IF NOT EXISTS call_queue (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  outcome TEXT,
  notes TEXT NOT NULL DEFAULT '',
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default lists
INSERT INTO lists (id, name, description, auto_tag) VALUES
  ('list-positive', 'Positive', 'Interested leads from calls', 'positive'),
  ('list-negative', 'Negative', 'Not a fit', 'negative'),
  ('list-callback', 'Call Back Later', 'Need to call back', 'callback'),
  ('list-followup', 'Follow-Up Email', 'Send follow-up email sequence', 'follow-up-email')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Allow all (single tenant for now)
CREATE POLICY "Allow all" ON tags FOR ALL USING (true);
CREATE POLICY "Allow all" ON lists FOR ALL USING (true);
CREATE POLICY "Allow all" ON list_members FOR ALL USING (true);
CREATE POLICY "Allow all" ON sequences FOR ALL USING (true);
CREATE POLICY "Allow all" ON sequence_steps FOR ALL USING (true);
CREATE POLICY "Allow all" ON sequence_enrollments FOR ALL USING (true);
CREATE POLICY "Allow all" ON call_queue FOR ALL USING (true);
CREATE POLICY "Allow all" ON activity_log FOR ALL USING (true);
CREATE POLICY "Allow all" ON lead_notes FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_lead ON tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_list_members_list ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_lead ON list_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);
CREATE INDEX IF NOT EXISTS idx_call_queue_lead ON call_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_lead ON activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_seq ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(pipeline_stage);
