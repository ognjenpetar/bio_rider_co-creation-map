-- Disable RLS on user_bans so anonymous/browser clients can read/write
ALTER TABLE user_bans DISABLE ROW LEVEL SECURITY;
