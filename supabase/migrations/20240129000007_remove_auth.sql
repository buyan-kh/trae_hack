-- Disable RLS on tables to allow "No Auth" access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;

-- Remove Foreign Key constraint linking profiles to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure profiles.id is still a Primary Key (it should be).
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Mock Data Insertion (Safe now that FK is removed)
DO $$
DECLARE
  u1 uuid := uuid_generate_v4();
  u2 uuid := uuid_generate_v4();
  u3 uuid := uuid_generate_v4();
BEGIN
  -- Insert Mock Profiles
  INSERT INTO public.profiles (id, full_name, username, balance, trust_score)
  VALUES
  (u1, 'Alice Wonderland', 'alice', 1500.00, 750),
  (u2, 'Bob Builder', 'bob', 500.00, 600),
  (u3, 'Charlie Chocolate', 'charlie', 2500.00, 800)
  ON CONFLICT DO NOTHING;

END $$;
