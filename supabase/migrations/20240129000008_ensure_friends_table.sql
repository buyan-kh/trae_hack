-- Ensure friends table exists (in case it was deleted or migration failed)
CREATE TABLE IF NOT EXISTS friends (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  friend_id uuid REFERENCES profiles(id) NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends DISABLE ROW LEVEL SECURITY;

-- Ensure mock profiles exist (idempotent)
DO $$
DECLARE
  u1 uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Fixed UUIDs for consistency if we want, but let's just search by username
  -- actually, we can't easily force specific UUIDs unless we know them. 
  -- Let's just use the username check.
BEGIN
  -- We rely on the usernames 'alice', 'bob', 'charlie'
  
  -- Insert Alice
  INSERT INTO public.profiles (full_name, username, balance, trust_score)
  SELECT 'Alice Wonderland', 'alice', 1500.00, 750
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'alice');

  -- Insert Bob
  INSERT INTO public.profiles (full_name, username, balance, trust_score)
  SELECT 'Bob Builder', 'bob', 500.00, 600
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'bob');

  -- Insert Charlie
  INSERT INTO public.profiles (full_name, username, balance, trust_score)
  SELECT 'Charlie Chocolate', 'charlie', 2500.00, 800
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'charlie');

END $$;
