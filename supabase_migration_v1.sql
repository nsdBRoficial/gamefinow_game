-- ============================================================
-- GameFiNow — Supabase Migration v1: Multiplayer MMO Schema
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/ztpspitdagsligdkjufk/sql
-- ============================================================

-- ─── EXTENSÕES ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABELA: players ──────────────────────────────────────────────────────────
-- Perfil completo de cada jogador (persistência)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,                          -- stellar_address ou UUID local
  stellar_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Anonymo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- Customização do personagem
  gender TEXT DEFAULT 'male',
  head_color TEXT DEFAULT '#fcd34d',
  torso_color TEXT DEFAULT '#ef4444',
  legs_color TEXT DEFAULT '#2563eb',
  shoes_color TEXT DEFAULT '#1e293b',
  skin_color TEXT DEFAULT '#ffdbac',
  head_type TEXT DEFAULT 'square',
  torso_type TEXT DEFAULT 'plain',
  shoes_type TEXT DEFAULT 'sneakers',
  face_type TEXT DEFAULT 'smile',
  accessory_type TEXT DEFAULT 'backpack',
  active_outfit TEXT,
  owned_outfits TEXT[] DEFAULT '{}',
  active_title TEXT,
  unlocked_titles TEXT[] DEFAULT '{}',
  name_style TEXT DEFAULT 'plain'
);

-- ─── TABELA: players_presence ─────────────────────────────────────────────────
-- Posição em tempo real (atualizada a cada movimento, Realtime habilitado)
CREATE TABLE IF NOT EXISTS players_presence (
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  map_id TEXT NOT NULL DEFAULT 'center',
  x REAL NOT NULL DEFAULT 30,
  y REAL NOT NULL DEFAULT 30,
  dir TEXT NOT NULL DEFAULT 'down',
  is_moving BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

-- Index para busca por mapa (quem está no mesmo mapa?)
CREATE INDEX IF NOT EXISTS idx_presence_map_id ON players_presence(map_id);
CREATE INDEX IF NOT EXISTS idx_presence_updated ON players_presence(updated_at DESC);

-- ─── TABELA: player_quests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_quests (
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',       -- 'locked' | 'active' | 'completed'
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, quest_id)
);

-- ─── TABELA: player_wallets ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_wallets (
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  stellar_address TEXT NOT NULL,
  xlm_balance REAL DEFAULT 0,
  usdc_balance REAL DEFAULT 0,
  gamefi_balance REAL DEFAULT 0,
  last_faucet_claim BIGINT,
  PRIMARY KEY (player_id)
);

-- ─── TABELA: chat_messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT REFERENCES players(id),
  player_name TEXT NOT NULL,
  map_id TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_map_time ON chat_messages(map_id, created_at DESC);

-- ─── VIEW: players_presence_with_info ─────────────────────────────────────────
-- View que une presença + dados de customização do personagem
-- O serviço usa esta view para buscar todos os jogadores no mapa
CREATE OR REPLACE VIEW players_presence_with_info WITH (security_invoker = on) AS
  SELECT
    pp.player_id,
    p.name,
    pp.map_id,
    pp.x,
    pp.y,
    pp.dir,
    pp.is_moving,
    pp.updated_at,
    p.gender,
    p.head_color,
    p.torso_color,
    p.legs_color,
    p.shoes_color,
    p.skin_color,
    p.head_type,
    p.torso_type,
    p.shoes_type,
    p.face_type,
    p.accessory_type,
    p.active_outfit
  FROM players_presence pp
  JOIN players p ON p.id = pp.player_id;

-- ─── ANTI-CHEAT: Trigger de validação de posição ─────────────────────────────
CREATE OR REPLACE FUNCTION validate_player_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.x < 0 OR NEW.x > 100 OR NEW.y < 0 OR NEW.y > 100 THEN
    RAISE EXCEPTION 'Posição inválida: x=%, y=%', NEW.x, NEW.y;
  END IF;
  IF NEW.map_id NOT IN ('center', 'north', 'south', 'east', 'west') THEN
    RAISE EXCEPTION 'MapId inválido: %', NEW.map_id;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_player_position ON players_presence;
CREATE TRIGGER check_player_position
  BEFORE INSERT OR UPDATE ON players_presence
  FOR EACH ROW EXECUTE FUNCTION validate_player_position();

-- ─── REALTIME: Habilitar publicação para as tabelas necessárias ───────────────
ALTER PUBLICATION supabase_realtime ADD TABLE players_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ─── RLS: Row Level Security ──────────────────────────────────────────────────

-- players: leitura pública, escrita apenas pelo próprio jogador
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_public_read" ON players;
CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "players_anon_insert" ON players;
CREATE POLICY "players_anon_insert" ON players
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "players_own_update" ON players;
CREATE POLICY "players_own_update" ON players
  FOR UPDATE USING (true);

-- players_presence: leitura pública, escrita por qualquer um (anon key)
ALTER TABLE players_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presence_public_read" ON players_presence;
CREATE POLICY "presence_public_read" ON players_presence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "presence_anon_write" ON players_presence;
CREATE POLICY "presence_anon_write" ON players_presence
  FOR ALL USING (true);

-- chat_messages: leitura pública, inserção por qualquer um
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_public_read" ON chat_messages;
CREATE POLICY "chat_public_read" ON chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_anon_insert" ON chat_messages;
CREATE POLICY "chat_anon_insert" ON chat_messages
  FOR INSERT WITH CHECK (char_length(message) > 0 AND char_length(message) <= 200);

-- player_quests: leitura pública, escrita aberta (MVP)
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quests_public_read" ON player_quests;
CREATE POLICY "quests_public_read" ON player_quests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "quests_anon_write" ON player_quests;
CREATE POLICY "quests_anon_write" ON player_quests
  FOR ALL USING (true);

-- player_wallets: leitura pública, escrita aberta (MVP)
ALTER TABLE player_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_public_read" ON player_wallets;
CREATE POLICY "wallets_public_read" ON player_wallets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wallets_anon_write" ON player_wallets;
CREATE POLICY "wallets_anon_write" ON player_wallets
  FOR ALL USING (true);

-- ─── LIMPEZA AUTOMÁTICA: Remove jogadores inativos há mais de 1 hora ──────────
-- (Executar como cron job no Supabase: Dashboard > Database > Cron Jobs)
-- Frequência: a cada 15 minutos
-- SELECT cron.schedule(
--   'cleanup-inactive-players',
--   '*/15 * * * *',
--   $$DELETE FROM players_presence WHERE updated_at < NOW() - INTERVAL '1 hour'$$
-- );

-- ─── LIMPEZA AUTOMÁTICA: Remove mensagens de chat com mais de 24h ─────────────
-- SELECT cron.schedule(
--   'cleanup-old-chat',
--   '0 * * * *',
--   $$DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '24 hours'$$
-- );

-- ─── VERIFICAÇÃO ─────────────────────────────────────────────────────────────
SELECT 'Schema criado com sucesso!' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('players', 'players_presence', 'player_quests', 'player_wallets', 'chat_messages');
