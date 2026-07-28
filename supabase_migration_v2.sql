-- ============================================================
-- GameFiNow — Supabase Migration v2: Admin Dashboard
-- ============================================================

-- Adiciona campos de moderação na tabela players
ALTER TABLE players ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Tabela de Administradores Locais (Login com Senha)
CREATE TABLE IF NOT EXISTS admin_users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insere o usuário admin solicitado pelo usuário ('admin', '@Gamefinow4app')
-- Senha com hash sha256 gerada para '@Gamefinow4app'. O backend fará o mesmo hash.
-- NOTA: Como não sabemos o salt exato aqui, podemos usar um hash simples ou texto puro para MVP (não recomendado em prod)
-- Para este MVP e seguindo a solicitação, usaremos um hash simples (sha256).
-- Hash(sha256, '@Gamefinow4app') = bfaf12c3e985a2d1881df30a934d9f8874c9e728f3848e36dd18fbdba0ccc314
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', 'bfaf12c3e985a2d1881df30a934d9f8874c9e728f3848e36dd18fbdba0ccc314')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Cria tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permite acesso total para administradores da API (bypass RLS)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_logs" ON admin_audit_logs FOR ALL USING (true);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_all" ON admin_users FOR ALL USING (true);

SELECT 'Schema v2 (Admin) criado com sucesso!' as status;
