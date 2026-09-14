/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * arenaService.ts — Serviço cliente do sistema PVP Arena
 *
 * Gerencia a comunicação Socket.io com o servidor para:
 *  - Solicitar entrada na arena
 *  - Enviar ações de combate (ataque, magia)
 *  - Enviar movimentação dentro da arena
 *  - Receber sync e eventos de combate
 *
 * Toda a AUTORIDADE de combate está no servidor.
 * O cliente apenas envia intenções e recebe resultados validados.
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

// ── Subscrição de eventos Arena ───────────────────────────────────────────────

/**
 * Registra callbacks para receber eventos da arena.
 * Deve ser chamado antes de entrar na arena.
 */
export function subscribeToArena(callbacks: ArenaCallbacks): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  _callbacks = callbacks;

  socket.on("arena_sync",               (data: PvpSession) => _callbacks.onSync?.(data));
  socket.on("arena_player_hit",         (data: PvpHitPayload) => _callbacks.onHit?.(data));
  socket.on("arena_player_eliminated",  (data: { playerId: string }) => _callbacks.onEliminated?.(data));
  socket.on("arena_match_end",          (data: PvpMatchEndPayload) => _callbacks.onMatchEnd?.(data));
  socket.on("arena_out_of_range",       () => _callbacks.onOutOfRange?.());
  socket.on("arena_error",              (data: { message: string }) => _callbacks.onError?.(data.message));
  socket.on("arena_player_move",        (data) => _callbacks.onPlayerMove?.(data));
  socket.on("arena_player_respawn",     (data) => _callbacks.onPlayerRespawn?.(data));

  // Retorna função de limpeza
  return () => {
    socket.off("arena_sync");
    socket.off("arena_player_hit");
    socket.off("arena_player_eliminated");
    socket.off("arena_match_end");
    socket.off("arena_out_of_range");
    socket.off("arena_error");
    socket.off("arena_player_move");
    socket.off("arena_player_respawn");
    _callbacks = {};
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

  socket.emit("arena_leave", { sessionId, playerId });
}
