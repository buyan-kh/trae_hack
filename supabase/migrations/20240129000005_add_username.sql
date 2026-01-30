ALTER TABLE profiles ADD COLUMN username text UNIQUE;

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, balance, trust_score)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'username',
    1000.00, 
    650
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
