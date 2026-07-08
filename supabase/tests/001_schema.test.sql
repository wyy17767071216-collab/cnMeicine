-- supabase/tests/001_schema.test.sql (pgTAP)
-- NOTE: Run via `supabase test db` against a real Supabase project with pgTAP installed.
-- Local: supabase start && supabase test db
BEGIN;
SELECT plan(10);

SELECT has_table('public', 'users',             'users table exists');
SELECT has_table('public', 'medications',       'medications table exists');
SELECT has_table('public', 'schedules',         'schedules table exists');
SELECT has_table('public', 'medication_logs',   'medication_logs table exists');
SELECT has_table('public', 'push_subscriptions','push_subscriptions table exists');

SELECT has_column('public', 'medications', 'name',   'medications.name exists');
SELECT has_column('public', 'schedules',   'time',   'schedules.time exists');
SELECT has_column('public', 'medication_logs', 'status', 'logs.status exists');

SELECT col_type_is('public', 'medication_logs', 'status',
  'character varying', 'status is varchar');

SELECT policies_are('public', 'medications',
  ARRAY['viewer_select', 'admin_all'],
  'medications has correct RLS policies');

SELECT * FROM finish();
ROLLBACK;
