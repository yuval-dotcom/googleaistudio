
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Go to your Supabase Project Dashboard -> Project Settings -> API
// 2. Copy "Project URL" into the supabaseUrl variable below.
// 3. Copy "anon public" key into the supabaseKey variable below.
// ------------------------------------------------------------------

const supabaseUrl = 'https://frbtjnricafnvyqnaotu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnRqbnJpY2FmbnZ5cW5hb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDQyNjksImV4cCI6MjA4MDY4MDI2OX0.wD8a6I4es6g0Ar5J4zo3WM1oXMfyM58uLiqS07hnaoc';

// Helper to ensure clean strings (removes accidental spaces from copy-paste)
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

export const supabase = createClient(getValidUrl(supabaseUrl), cleanKey(supabaseKey));

export const SETUP_SQL = `-- FIX: Run this to reset permissions and fix "Delete" issues.

-- 1. Create Tables (if missing)
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  address text not null,
  country text not null,
  type text not null,
  currency text not null,
  purchase_price numeric not null,
  purchase_price_nis numeric,
  market_value numeric not null,
  income_tax_rate numeric default 25,
  property_tax_rate numeric default 1,
  monthly_mortgage numeric,
  mortgage_interest_rate numeric,
  loan_balance numeric,
  bank_name text,
  mortgage_mix jsonb,
  partners jsonb,
  lease jsonb,
  documents jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  property_id text not null,
  date timestamp with time zone not null,
  amount numeric not null,
  type text not null,
  category text not null,
  receipt_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Reset RLS (Row Level Security)
alter table public.properties enable row level security;
alter table public.transactions enable row level security;

-- Drop old policies to prevent conflicts
drop policy if exists "Users can CRUD their own properties" on public.properties;
drop policy if exists "Users can CRUD their own transactions" on public.transactions;

-- Re-create Permissions
create policy "Users can CRUD their own properties"
on public.properties for all
using (auth.uid() = user_id);

create policy "Users can CRUD their own transactions"
on public.transactions for all
using (auth.uid() = user_id);

-- 3. Storage Setup (Bucket & Policies)
-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public) values ('property-docs', 'property-docs', true)
on conflict (id) do update set public = true;

-- Drop ALL old storage policies to fix permission errors
drop policy if exists "Authenticated users can upload property docs" on storage.objects;
drop policy if exists "Authenticated users can update property docs" on storage.objects;
drop policy if exists "Authenticated users can delete property docs" on storage.objects;
drop policy if exists "Anyone can view property docs" on storage.objects;
drop policy if exists "Give users access to own folder" on storage.objects;

-- Create SIMPLIFIED policies for authenticated users
create policy "Authenticated users can insert property docs"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'property-docs' );

create policy "Authenticated users can update property docs"
on storage.objects for update
to authenticated
using ( bucket_id = 'property-docs' );

create policy "Authenticated users can delete property docs"
on storage.objects for delete
to authenticated
using ( bucket_id = 'property-docs' );

create policy "Anyone can view property docs"
on storage.objects for select
to public
using ( bucket_id = 'property-docs' );`;
