/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * arenaService.ts — Serviço Cliente do Sistema de Arena PvP (v1.5pvp)
 *
 * Arquitetura de Comunicação:
 * - Conecta-se diretamente ao canal Socket.io dedicado à sala da arena (`arena:<id>`).
 * - Transmite intenções de combate do jogador: `arena_attack`, `arena_cast_spell`, `arena_move`, `arena_leave`.
 * - Processa broadcasts de reconciliação de estado: `arena_sync`, `arena_player_hit`, `arena_player_eliminated`.
 * - Resiliência e Reconexão: Preserva o ID da sessão ativa em `sessionStorage` (`gfn_arena_session_id`)
 *   para reingressar automaticamente na mesma arena após oscilações de rede.
 *
 * Princípio Arquitetural: Autoridade total no Servidor; o cliente jamais aplica dano arbitrário localmente.
 */

import { getSocket } from "./multiplayerService";
import { PvpSession, PvpHitPayload, PvpMatchEndPayload } from "../pvp/pvpTypes";
import { Player } from "../types";

// ── Callbacks registrados pelo componente ArenaCanvas/ArenaHUD ───────────────
type ArenaCallbacks = {
  onSync?: (session: PvpSession) => void;
  onHit?: (data: PvpHitPayload) => void;
  onEliminated?: (data: { playerId: string }) => void;
  onMatchEnd?: (data: PvpMatchEndPayload) => void;
  onError?: (msg: string) => void;
  onOutOfRange?: () => void;
  onPlayerMove?: (data: { playerId: string, arenaX: number, arenaY: number, dir: string }) => void;
  onPlayerRespawn?: (data: { playerId: string }) => void;
};

let _callbacks: ArenaCallbacks = {};

// ── Dados do último join para re-envio após reconexão ──
let _lastJoinPlayerId: string | null = null;
let _lastJoinPlayer: Player | null = null;
let _currentSessionId: string | null = sessionStorage.getItem("gfn_arena_session_id");

// Escuta reconexão do socket para re-entrar na room da arena automaticamente
function setupReconnectHandler() {
  const socket = getSocket();
  if (!socket) return;

  socket.off("connect", _onSocketReconnect);
  socket.on("connect", _onSocketReconnect);
}

function _onSocketReconnect() {
  if (_lastJoinPlayerId && _lastJoinPlayer) {
    console.log("[Arena] Reconectando à arena após reconexão do socket...", _currentSessionId);
    // Re-envia o join com a sessionId atual para voltar à mesma sessão
    requestArenaJoin(_lastJoinPlayerId, _lastJoinPlayer, _currentSessionId || undefined);
  }
}

// ── Subscrição de eventos Arena ───────────────────────────────────────────────

/**
 * Registra callbacks para receber eventos da arena.
 * Deve ser chamado antes de entrar na arena.
 */
export function subscribeToArena(callbacks: ArenaCallbacks): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  _callbacks = callbacks;

  // Configura o handler de reconexão
  setupReconnectHandler();

  // Handlers nomeados para poder removê-los individualmente no cleanup
  const onSync         = (data: PvpSession) => {
    _currentSessionId = data.sessionId;
    sessionStorage.setItem("gfn_arena_session_id", data.sessionId);
    _callbacks.onSync?.(data);
  };
  const onHit          = (data: PvpHitPayload) => _callbacks.onHit?.(data);
  const onEliminated   = (data: { playerId: string }) => _callbacks.onEliminated?.(data);
  const onMatchEnd     = (data: PvpMatchEndPayload) => _callbacks.onMatchEnd?.(data);
  const onOutOfRange   = () => _callbacks.onOutOfRange?.();
  const onError        = (data: { message: string }) => _callbacks.onError?.(data.message);
  const onPlayerMove   = (data: any) => _callbacks.onPlayerMove?.(data);
  const onPlayerRespawn = (data: any) => _callbacks.onPlayerRespawn?.(data);

  socket.on("arena_sync",               onSync);
  socket.on("arena_player_hit",         onHit);
  socket.on("arena_player_eliminated",  onEliminated);
  socket.on("arena_match_end",          onMatchEnd);
  socket.on("arena_out_of_range",       onOutOfRange);
  socket.on("arena_error",              onError);
  socket.on("arena_player_move",        onPlayerMove);
  socket.on("arena_player_respawn",     onPlayerRespawn);

  // Retorna função de limpeza — remove apenas os handlers desta subscrição
  return () => {
    socket.off("arena_sync",              onSync);
    socket.off("arena_player_hit",        onHit);
    socket.off("arena_player_eliminated", onEliminated);
    socket.off("arena_match_end",         onMatchEnd);
    socket.off("arena_out_of_range",      onOutOfRange);
    socket.off("arena_error",             onError);
    socket.off("arena_player_move",       onPlayerMove);
    socket.off("arena_player_respawn",    onPlayerRespawn);
    socket.off("connect",                _onSocketReconnect);
    _callbacks = {};
    // Não limpa _lastJoinPlayerId nem _currentSessionId pois podem ser necessários para reconexão
  };
}

// ── Ações do jogador ──────────────────────────────────────────────────────────

/**
 * Solicita entrada na arena FFA.
 * O servidor responde com arena_sync contendo a sessão criada/encontrada.
 *
 * @param playerId  - ID único do jogador (publicKey ou sessionId)
 * @param player    - Estado atual do jogador (stats, aparência)
 * @param sessionId - ID de sessão existente (opcional, para reentrada)
 */
export function requestArenaJoin(
  playerId: string,
  player: Player,
  sessionId?: string
): void {
  const socket = getSocket();
  if (!socket) return;

  // Salva para re-envio automático após reconexão
  _lastJoinPlayerId = playerId;
  _lastJoinPlayer = player;
  if (sessionId) {
    _currentSessionId = sessionId;
    sessionStorage.setItem("gfn_arena_session_id", sessionId);
  }

  socket.emit("arena_join_request", {
    playerId,
    mode: "ffa",
    sessionId,
    playerPayload: {
      playerId,
      name: player.name,
      hp: player.hp ?? 100,
      maxHp: player.maxHp ?? 100,
      mp: player.mp ?? 50,
      maxMp: player.maxMp ?? 50,
      attack: player.attack ?? 10,
      defense: player.defense ?? 5,
      speed: player.speed ?? 5,
      level: player.level ?? 1,
      playerClass: player.playerClass,
      activeBuffs: [],
      isEliminated: false,
      arenaX: 0,
      arenaY: 0,
      dir: "down",
      isMoving: false,
      frame: 0,
      // Aparência
      headColor: player.headColor,
      torsoColor: player.torsoColor,
      legsColor: player.legsColor,
      shoesColor: player.shoesColor,
      skinColor: player.skinColor,
      headType: player.headType,
      torsoType: player.torsoType,
      shoesType: player.shoesType,
      faceType: player.faceType,
      accessoryType: player.accessoryType,
      gender: player.gender,
    },
  });
}

/**
 * Envia um auto-ataque físico contra um alvo.
 *
 * @param sessionId  - ID da sessão PVP
 * @param attackerId - ID do atacante
 * @param targetId   - ID do alvo
 * @param playerClass - Classe do atacante (define range)
 */
export function sendArenaAttack(
  sessionId: string,
  attackerId: string,
  targetId: string,
  playerClass?: string
): void {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("arena_attack", {
    sessionId,
    attackerId,
    targetId,
    playerClass,
    timestamp: Date.now(),
  });
}

/**
 * Envia o cast de uma magia na arena.
 *
 * @param sessionId   - ID da sessão PVP
 * @param attackerId  - ID do atacante
 * @param targetId    - ID do alvo (null para heal sem alvo)
 * @param spellId     - ID da spell (ex: "spell_warrior_slash")
 * @param spellPower  - basePower da spell
 * @param element     - Elemento da spell
 */
export function sendArenaSpell(
  sessionId: string,
  attackerId: string,
  targetId: string | null,
  spellId: string,
  spellPower: number,
  element: string
): void {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("arena_cast_spell", {
    sessionId,
    attackerId,
    targetId,
    spellId,
    spellPower,
    element,
    timestamp: Date.now(),
  });
}

/**
 * Envia a movimentação do jogador dentro da arena.
 *
 * @param sessionId  - ID da sessão PVP
 * @param playerId   - ID do jogador
 * @param arenaX     - Nova posição X no grid 12×12
 * @param arenaY     - Nova posição Y no grid 12×12
 * @param dir        - Direção do personagem
 */
export function sendArenaMove(
  sessionId: string,
  playerId: string,
  arenaX: number,
  arenaY: number,
  dir: "up" | "down" | "left" | "right"
): void {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("arena_move", {
    sessionId,
    playerId,
    arenaX,
    arenaY,
    dir,
    timestamp: Date.now(),
  });
}

/**
 * Notifica o servidor que o jogador está saindo da arena.
 * Usado ao final da partida ou ao desconectar.
 */
export function leaveArena(sessionId: string, playerId: string): void {
  const socket = getSocket();
  if (!socket) return;

  _currentSessionId = null;
  sessionStorage.removeItem("gfn_arena_session_id");
  socket.emit("arena_leave", { sessionId, playerId });
}
