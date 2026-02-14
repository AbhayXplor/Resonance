-- AI-Powered Call Monitoring & Emotion Intelligence System
-- Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: calls
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(255),
  customer_id VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  outcome VARCHAR(50) CHECK (outcome IN ('successful', 'escalated', 'unresolved', 'churn')),
  overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
  summary TEXT,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for calls table
CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time);
CREATE INDEX IF NOT EXISTS idx_calls_customer ON calls(customer_id);

-- Table: conversational_turns
CREATE TABLE IF NOT EXISTS conversational_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('agent', 'customer')),
  transcript TEXT NOT NULL,
  confidence FLOAT,
  timestamp_offset INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for conversational_turns table
CREATE INDEX IF NOT EXISTS idx_turns_call ON conversational_turns(call_id);
CREATE INDEX IF NOT EXISTS idx_turns_speaker ON conversational_turns(speaker);
CREATE INDEX IF NOT EXISTS idx_turns_call_turn ON conversational_turns(call_id, turn_number);

-- Table: emotional_metrics
CREATE TABLE IF NOT EXISTS emotional_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  turn_id UUID REFERENCES conversational_turns(id) ON DELETE CASCADE,
  timestamp_offset INTEGER,
  anger FLOAT CHECK (anger >= 0 AND anger <= 100),
  frustration FLOAT CHECK (frustration >= 0 AND frustration <= 100),
  satisfaction FLOAT CHECK (satisfaction >= 0 AND satisfaction <= 100),
  neutral FLOAT CHECK (neutral >= 0 AND neutral <= 100),
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for emotional_metrics table
CREATE INDEX IF NOT EXISTS idx_emotions_call ON emotional_metrics(call_id);
CREATE INDEX IF NOT EXISTS idx_emotions_anger ON emotional_metrics(anger);
CREATE INDEX IF NOT EXISTS idx_emotions_satisfaction ON emotional_metrics(satisfaction);

-- Table: suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  text TEXT NOT NULL,
  reasoning TEXT,
  historical_success_rate FLOAT,
  similar_case_ids UUID[],
  was_followed BOOLEAN,
  timestamp_offset INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for suggestions table
CREATE INDEX IF NOT EXISTS idx_suggestions_call ON suggestions(call_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON suggestions(priority);

-- Table: patterns
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type VARCHAR(50) CHECK (pattern_type IN ('success', 'failure', 'escalation')),
  emotional_signature JSONB,
  context_signature JSONB,
  common_outcome VARCHAR(50),
  frequency INTEGER,
  success_rate FLOAT,
  sample_call_ids UUID[],
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for patterns table
CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_outcome ON patterns(common_outcome);

-- Table: turning_points
CREATE TABLE IF NOT EXISTS turning_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  timestamp_offset INTEGER,
  description TEXT,
  emotion_before JSONB,
  emotion_after JSONB,
  trigger TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for turning_points table
CREATE INDEX IF NOT EXISTS idx_turning_points_call ON turning_points(call_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversational_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE turning_points ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (for demo purposes)
CREATE POLICY "Allow authenticated read access" ON calls FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON conversational_turns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON emotional_metrics FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON suggestions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON patterns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON turning_points FOR SELECT USING (true);

-- Allow service role to insert/update/delete (for backend operations)
CREATE POLICY "Allow service role full access" ON calls FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON conversational_turns FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON emotional_metrics FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON suggestions FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON patterns FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON turning_points FOR ALL USING (true);
