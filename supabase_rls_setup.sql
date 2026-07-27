-- supabase_rls_setup.sql
-- Run this script in the Supabase SQL Editor to secure your game tables

-- 1. Enable RLS on both tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE players_presence ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies (if you're running this multiple times)
DROP POLICY IF EXISTS "Public can read players" ON players;
DROP POLICY IF EXISTS "Players can update their own profile" ON players;
DROP POLICY IF EXISTS "Public can read presence" ON players_presence;
DROP POLICY IF EXISTS "Players can update their own presence" ON players_presence;

-- 3. Create policies for `players` table
-- Everyone can read players
CREATE POLICY "Public can read players" 
ON players FOR SELECT 
USING (true);

-- Only authenticated users (via our backend JWT) can insert/update their OWN row
CREATE POLICY "Players can update their own profile" 
ON players FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'stellar_address') = id)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'stellar_address') = id);

-- 4. Create policies for `players_presence` table
-- Everyone can read presence
CREATE POLICY "Public can read presence" 
ON players_presence FOR SELECT 
USING (true);

-- Only authenticated users can insert/update their OWN row
CREATE POLICY "Players can update their own presence" 
ON players_presence FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'stellar_address') = player_id)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'stellar_address') = player_id);

-- 5. Optional: Allow public access for initial unauthenticated reads if necessary
-- Note: If your project relies heavily on anon reading before login, the SELECT policies above (USING true) already cover it.
