
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://frbtjnricafnvyqnaotu.supabase.co'; 
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnRqbnJpY2FmbnZ5cW5hb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDQyNjksImV4cCI6MjA4MDY4MDI2OX0.wD8a6I4es6g0Ar5J4zo3WM1oXMfyM58uLiqS07hnaoc';

const cleanUrl = (url: string) => url ? url.trim() : '';
const cleanKey = (key: string) => key ? key.trim() : '';

const getValidUrl = (url: string) => {
  const cleaned = cleanUrl(url);
  try {
    if (!cleaned.startsWith('http')) return 'https://placeholder.supabase.co';
    new URL(cleaned);
    return cleaned;
  } catch (e) {
    return 'https://placeholder.supabase.co';
  }
};

export const supabase = createClient(getValidUrl(SUPABASE_URL), cleanKey(SUPABASE_ANON_KEY));

/**
 * RESCUE SQL - RUN THIS IN SUPABASE SQL EDITOR
 */
export const SETUP_SQL = `
-- 1. Companies Table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  user_ownership numeric not null default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Ensure Properties Table has all modern columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='units') THEN
        ALTER TABLE public.properties ADD COLUMN units jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='documents') THEN
        ALTER TABLE public.properties ADD COLUMN documents jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='bank_name') THEN
        ALTER TABLE public.properties ADD COLUMN bank_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='mortgage_mix') THEN
        ALTER TABLE public.properties ADD COLUMN mortgage_mix jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='partners') THEN
        ALTER TABLE public.properties ADD COLUMN partners jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='lease') THEN
        ALTER TABLE public.properties ADD COLUMN lease jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='holding_company') THEN
        ALTER TABLE public.properties ADD COLUMN holding_company text;
    END IF;
END $$;

-- 3. Ensure Transactions Table exists
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  property_id text not null,
  date timestamp with time zone not null,
  amount numeric not null,
  type text not null,
  category text not null,
  receipt_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table public.properties enable row level security;
alter table public.transactions enable row level security;
alter table public.companies enable row level security;

-- 5. Policies
drop policy if exists "Property Ownership" on public.properties;
create policy "Property Ownership" on public.properties for all using (auth.uid() = user_id);

drop policy if exists "Transaction Ownership" on public.transactions;
create policy "Transaction Ownership" on public.transactions for all using (auth.uid() = user_id);

drop policy if exists "Company Ownership" on public.companies;
create policy "Company Ownership" on public.companies for all using (auth.uid() = user_id);

-- 6. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-docs', 'property-docs', false, 52428800, '{image/*,application/pdf}')
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Storage View Policy" ON storage.objects;
CREATE POLICY "Storage View Policy" ON storage.objects FOR SELECT USING (bucket_id = 'property-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Storage Insert Policy" ON storage.objects;
CREATE POLICY "Storage Insert Policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Storage Delete Policy" ON storage.objects;
CREATE POLICY "Storage Delete Policy" ON storage.objects FOR DELETE USING (bucket_id = 'property-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
`;
