# Database Setup Instructions

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com
2. Sign in to your account
3. Select your project: `call-monitoring-system`
4. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Schema

1. Click "New Query"
2. Copy the entire contents of `schema.sql`
3. Paste into the SQL editor
4. Click "Run" or press Ctrl+Enter

## Step 3: Verify Tables

Go to "Table Editor" and verify these tables exist:
- calls
- conversational_turns
- emotional_metrics
- suggestions
- patterns
- turning_points

## Schema is now ready!

The database is configured with:
- All required tables and indexes
- Foreign key constraints
- Row Level Security (RLS) policies
- Automatic timestamp updates
