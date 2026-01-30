-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  friend_id uuid REFERENCES profiles(id) NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own friendships
CREATE POLICY "Users can view their own friendships."
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can insert friend requests
CREATE POLICY "Users can create friend requests."
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update friendships (accept/reject)
CREATE POLICY "Users can update their own friendships."
  ON friends FOR UPDATE
  USING (auth.uid() = friend_id OR auth.uid() = user_id);
