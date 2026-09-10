-- Dansee / Capsule Wardrobe — run in Supabase SQL Editor.

-- Profile (existing table: id, created_at, username, aesthetic_id)
alter table public.profile enable row level security;

drop policy if exists "Users can read own profile" on public.profile;
create policy "Users can read own profile"
  on public.profile for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profile;
create policy "Users can insert own profile"
  on public.profile for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profile;
create policy "Users can update own profile"
  on public.profile for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, username)
  values (
    new.id,
    nullif(
      coalesce(
        nullif(trim(new.raw_user_meta_data->>'username'), ''),
        trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name'))
      ),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pieces (CRUD wardrobe photos)
create table if not exists public.piece (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.piece enable row level security;

drop policy if exists "Users can read own pieces" on public.piece;
create policy "Users can read own pieces"
  on public.piece for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own pieces" on public.piece;
create policy "Users can insert own pieces"
  on public.piece for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own pieces" on public.piece;
create policy "Users can update own pieces"
  on public.piece for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own pieces" on public.piece;
create policy "Users can delete own pieces"
  on public.piece for delete
  using (auth.uid() = user_id);

-- Storage bucket for images (also create it in Dashboard → Storage if missing)
insert into storage.buckets (id, name, public)
values ('pieces', 'pieces', true)
on conflict (id) do nothing;

drop policy if exists "Users can read own piece files" on storage.objects;
create policy "Users can read own piece files"
  on storage.objects for select
  using (bucket_id = 'pieces' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own piece files" on storage.objects;
create policy "Users can upload own piece files"
  on storage.objects for insert
  with check (bucket_id = 'pieces' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own piece files" on storage.objects;
create policy "Users can update own piece files"
  on storage.objects for update
  using (bucket_id = 'pieces' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own piece files" on storage.objects;
create policy "Users can delete own piece files"
  on storage.objects for delete
  using (bucket_id = 'pieces' and (storage.foldername(name))[1] = auth.uid()::text);
