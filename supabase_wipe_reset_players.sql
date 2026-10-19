-- ============================================================
-- GameFiNow — Script de Limpeza / Wipe Completo de Jogadores
-- Executa o reset atômico das tabelas de jogadores, presenças, inventários e chats.
-- Preserva tabelas administrativas (admin_users, admin_audit_logs).
-- ============================================================

TRUNCATE TABLE 
  player_wallets,
  player_quests,
  players_presence,
  chat_messages,
  players
CASCADE;

SELECT 'Wipe concluído com sucesso! Base de jogadores zerada.' AS status;
