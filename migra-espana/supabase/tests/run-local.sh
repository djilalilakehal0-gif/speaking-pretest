#!/usr/bin/env bash
# Spins up a throw-away DB with Supabase-shaped stubs (auth/storage), applies migrations and runs rls.test.sql.
# Usage (as a user that can reach a local Postgres):  DB=migra_test ./supabase/tests/run-local.sh
set -euo pipefail
STUB=$(mktemp); DB=${DB:-migra_test}; HERE=$(cd "$(dirname "$0")" && pwd); PSQL="psql -q -v ON_ERROR_STOP=1 -d $DB"
psql -qc "drop database if exists $DB" -c "create database $DB" postgres
cat > "$STUB" <<'SQL'
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
SQL
$PSQL -f "$STUB"
for f in "$HERE"/../migrations/*.sql "$HERE"/rls.test.sql; do echo "→ $(basename "$f")"; $PSQL -f "$f" | grep -E "PASSED" || true; done
