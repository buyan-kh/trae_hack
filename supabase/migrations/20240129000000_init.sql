create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  avatar_url text,
  balance decimal default 1000.00, -- Simulated start money
  trust_score int default 650,      -- Starting credit score
  updated_at timestamp with time zone
);

alter table profiles enable row level security;

-- Policy: Everyone can read profiles (needed to find friends to lend/borrow)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Policy: Users can update their own profile (e.g. name, avatar)
-- Note: Sensitive fields like balance should be protected by application logic or separate admin policies if exposed to client updates directly.
-- For this MVP, we rely on Edge Functions for balance updates, but allow users to edit metadata.
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- LOANS
create table loans (
  id uuid default uuid_generate_v4() primary key,
  lender_id uuid references profiles(id),
  borrower_id uuid references profiles(id),
  amount decimal not null,
  is_reported_to_bureau boolean default false,
  status text check (status in ('pending', 'active', 'paid', 'rejected')) default 'pending',
  created_at timestamp with time zone default now()
);

alter table loans enable row level security;

-- Policy: Users can view loans they are involved in
create policy "Users can view their own loans."
  on loans for select
  using (
    auth.uid() = lender_id or
    auth.uid() = borrower_id
  );

-- Policy: Users can create loans (as a lender proposing to a borrower, or vice versa)
create policy "Users can create loans."
  on loans for insert
  with check (
    auth.uid() = lender_id or
    auth.uid() = borrower_id
  );

-- Policy: Updates (accepting, paying)
create policy "Users can update their own loans."
  on loans for update
  using (
    auth.uid() = lender_id or
    auth.uid() = borrower_id
  );

-- AUTOMATION: Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, balance, trust_score)
  values (new.id, new.raw_user_meta_data->>'full_name', 1000.00, 650);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
