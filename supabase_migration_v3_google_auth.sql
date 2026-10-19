-- ============================================================
-- GameFiNow — Supabase Migration v3: Suporte a Google OAuth e Vínculo com Stellar
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- Adiciona colunas para identificador do Google e E-mail no perfil do jogador
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS google_uid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Índices para buscas rápidas durante login e recuperação de conta
CREATE INDEX IF NOT EXISTS idx_players_google_uid ON players(google_uid);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

-- Comentários descritivos
COMMENT ON COLUMN players.google_uid IS 'ID exclusivo retornado pelo provedor Google OAuth do Supabase Auth (sub)';
COMMENT ON COLUMN players.email IS 'E-mail vinculado à conta Google do jogador para recuperação amigável';
