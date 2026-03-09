-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create a Profiles table to store user information securely
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  avatar text,
  is_online boolean default false,
  last_seen timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create Messages table for the chats
CREATE TABLE public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  text text,
  attachment_url text,
  attachment_type text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS) for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read messages they sent or received." ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages they send." ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Turn on Realtime for both tables so the UI updates automatically!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table messages;

-- 4. Create a storage bucket for chat attachments
insert into storage.buckets (id, name, public) 
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
create policy "Anyone can read attachments" 
  on storage.objects for select 
  using ( bucket_id = 'chat-attachments' );

create policy "Authenticated users can upload attachments" 
  on storage.objects for insert 
  with check ( bucket_id = 'chat-attachments' AND auth.role() = 'authenticated' );
