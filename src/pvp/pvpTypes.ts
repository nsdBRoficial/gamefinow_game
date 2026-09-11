/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * pvpTypes.ts — Tipos do sistema PVP Arena
 * Define as interfaces de sessão, jogadores, eventos e estados de combate PVP.
 */

import { ActiveBuff, PlayerClassId } from "../types";

// ── Modos de batalha ─────────────────────────────────────────────────────────
export type PvpMode = "ffa" | "1v1" | "2v2" | "3v3" | "4v4";

// ── Status de sessão ──────────────────────────────────────────────────────────
export type PvpSessionStatus = "waiting" | "in_progress" | "finished";

// ── Jogador dentro da arena ───────────────────────────────────────────────────
export interface PvpPlayer {
  playerId: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  playerClass?: PlayerClassId;
  activeBuffs: ActiveBuff[];
  isEliminated: boolean;
  arenaX: number;   // posição no grid 12×12 da arena
  arenaY: number;
  dir: "up" | "down" | "left" | "right";
  isMoving: boolean;
  frame: number;
  // Aparência (para renderização no ArenaCanvas)
  headColor: string;
  torsoColor: string;
  legsColor: string;
  shoesColor: string;
  skinColor: string;
  headType: string;
  torsoType: string;
  shoesType: string;
  faceType: string;
  accessoryType: string;
  gender?: string;
  // Timestamps de combate (server-side)
  lastAttackTime?: number;
  lastSpellTime?: number;
}

// ── Sessão PVP ────────────────────────────────────────────────────────────────
export interface PvpSession {
  sessionId: string;
  mode: PvpMode;
  status: PvpSessionStatus;
  players: PvpPlayer[];
  startedAt?: number;
  finishedAt?: number;
  winnerId?: string;
  winnerName?: string;
}

// ── Tipos de eventos Socket.io PVP ────────────────────────────────────────────
export type PvpEventType =
  | "arena_join_request"
  | "arena_join_confirm"
  | "arena_leave"
  | "arena_move"
  | "arena_attack"
  | "arena_cast_spell"
  | "arena_player_hit"
  | "arena_player_eliminated"
  | "arena_match_end"
  | "arena_sync"
  | "arena_out_of_range"
  | "arena_error";

// ── Payload de hit (dano aplicado) ───────────────────────────────────────────
export interface PvpHitPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  newHp: number;
  isCrit: boolean;
  element: "physical" | "fire" | "lightning" | "ice" | "holy";
}

// ── Payload de fim de partida ─────────────────────────────────────────────────
export interface PvpMatchEndPayload {
  winnerId: string | null;
  winnerName: string | null;
  sessionId: string;
  rewards: {
    [playerId: string]: {
      xp: number;
      gamefi: number;
      result: "victory" | "eliminated" | "participation";
    };
  };
}

// ── Ranges de ataque por tipo ────────────────────────────────────────────────
/**
 * Distância máxima em tiles para cada tipo de ataque.
 * O server REJEITA ataques fora do range configurado.
 */
export const ATTACK_RANGE: Record<string, number> = {
  physical_melee:  2,   // Warriors, Network Guardian
  physical_ranger: 3,   // Cosmic Ranger
  magic_damage:    5,   // Spells ofensivas
  magic_heal:      6,   // Heal (sem alvo, funciona em qualquer posição)
};

/** Spawn points simétricos no octógono 12×12 */
export const ARENA_SPAWN_POINTS: { x: number; y: number }[] = [
  { x: 1,  y: 5 },   // esquerda cima
  { x: 1,  y: 6 },   // esquerda baixo
  { x: 10, y: 5 },   // direita cima
  { x: 10, y: 6 },   // direita baixo
  { x: 5,  y: 1 },   // cima esquerda
  { x: 6,  y: 1 },   // cima direita
  { x: 5,  y: 10 },  // baixo esquerda
  { x: 6,  y: 10 },  // baixo direita
];

/** Recompensas por resultado (XP e GAMEFI) */
export const PVP_REWARDS = {
  victory:       { xp: 150, gamefi: 0.5 },
  runner_up:     { xp: 60,  gamefi: 0   },
  eliminated:    { xp: 30,  gamefi: 0   },
  participation: { xp: 10,  gamefi: 0   },
} as const;

/** Duração máxima de uma partida FFA (ms) */
export const PVP_MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutos
