import { NPC, GameState, Player } from "../../types";
import { MapId } from "../../maps";
import { TILE_SIZE } from "../../gameData";
import { drawPixelCharacter, getNPCPixelChar } from "./PlayerSprite";

// ─── Interpolação de Posição (Client-Side Prediction) ────────────────────────
// Mantém o estado de renderização suavizado separado da posição real recebida da rede.
// Isso elimina o efeito de "teleport" a cada pacote de posição recebido.
// LERP_SPEED: 0 = nunca chega, 1 = teleporta instantaneamente.
// 0.18 = suave com latência 100-300ms (ideal para MMO casual via Supabase Realtime)
const LERP_SPEED = 0.18;

// Tempo de timeout de player inativo (deve ser igual ao PLAYER_TIMEOUT_MS do service)
const PLAYER_TIMEOUT_MS = 30_000;
// Início do fade-out (5s antes do timeout)
const FADE_START_MS = 25_000;

interface PlayerRenderState {
  x: number;
  y: number;
  frame: number;
}

// Map persistente entre frames — chave: player_id
const playerRenderStates = new Map<string, PlayerRenderState>();

/**
 * Remove do estado de interpolação jogadores que não estão mais na lista ativa.
 * Evita crescimento indefinido do Map em sessões longas.
 */
export function cleanupRenderStates(activePlayers: any[]): void {
  const activeIds = new Set(activePlayers.map((p) => p.player_id || p.id));
  playerRenderStates.forEach((_, id) => {
    if (!activeIds.has(id)) playerRenderStates.delete(id);
  });
}

export const drawNPCs = (
  ctx: CanvasRenderingContext2D,
  npcs: NPC[],
  gameState: GameState,
  leftBound: number,
  rightBound: number,
  topBound: number,
  bottomBound: number
) => {
  npcs.forEach((npc) => {
    const worldX = npc.x * TILE_SIZE;
    const worldY = npc.y * TILE_SIZE;

    if (
      worldX < leftBound ||
      worldX > rightBound ||
      worldY < topBound ||
      worldY > bottomBound
    ) {
      return;
    }

    // Draw custom pixel sprite based on NPC's role/lore
    const charData = getNPCPixelChar(npc.id);
    drawPixelCharacter(
      ctx,
      worldX,
      worldY,
      charData,
      false, // NPCs don't walk
      0,
      npc.dir,
      false
    );

    // Quest indicators (Floating "!" or "🔒" above NPC)
    let indicator = "";
    let indicatorColor = "#ef4444";
    if (npc.questTrigger) {
      const qStatus = gameState.quests[npc.questTrigger].status;
      if (qStatus === "active") {
        indicator = "!";
        indicatorColor = "#fbbf24";
      } else if (qStatus === "locked") {
        indicator = "🔒";
      }
    }
    
    if (indicator) {
      ctx.fillStyle = indicatorColor;
      ctx.beginPath();
      ctx.arc(worldX + 16, worldY - 14, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(indicator, worldX + 16, worldY - 13.5);
    }

    // Display NPC name tags beautifully with proper head clearance and auto-sized background
    const npcNameY = worldY - 19;
    ctx.font = "bold 9px 'JetBrains Mono', 'Ubuntu', sans-serif";
    const textWidth = ctx.measureText(npc.name).width;
    const npcNameW = textWidth + 8;
    const npcNameH = 13;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(worldX + 16 - npcNameW / 2, npcNameY - 2, npcNameW, npcNameH);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(worldX + 16 - npcNameW / 2, npcNameY - 2, npcNameW, npcNameH);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(npc.name, worldX + 16, npcNameY + npcNameH / 2 - 2 + 0.5);
  });
};


export const drawOtherPlayers = (
  ctx: CanvasRenderingContext2D,
  otherPlayers: any[],
  currentRegion: MapId
) => {
  // Fase 4.3 — Ocultar bots quando players reais estão no mapa
  // Conta quantos players reais (não-bots) existem na lista
  const hasRealPlayers = otherPlayers.some((p) => !p.id?.startsWith("mmo"));

  otherPlayers.forEach((p) => {
    const isBot = p.id?.startsWith("mmo");

    // Fase 4.3 — Se há players reais, pula bots
    if (isBot && hasRealPlayers) return;

    let drawPlayerOk = false;

    if (isBot) {
      // Bots só aparecem no mapa correspondente
      if (p.id === "mmo1" && currentRegion === "center") drawPlayerOk = true;
      else if (p.id === "mmo2" && currentRegion === "west") drawPlayerOk = true;
      else if (p.id === "mmo3" && currentRegion === "east") drawPlayerOk = true;
      else if (p.id === "mmo4" && currentRegion === "north") drawPlayerOk = true;
      else if (p.id === "mmo5" && currentRegion === "south") drawPlayerOk = true;
    } else {
      // Players reais são pré-filtrados por mapa no GameCanvas
      drawPlayerOk = true;
    }

    if (!drawPlayerOk) return;

    // ── Fase 1.1: Interpolação de Posição (Client-Side Lerp) ─────────────────
    // Usa player_id para players reais, id para bots
    const stateKey = p.player_id ?? p.id;
    const targetX = typeof p.x === "number" ? p.x : 0;
    const targetY = typeof p.y === "number" ? p.y : 0;

    let render = playerRenderStates.get(stateKey);
    if (!render) {
      // Primeira vez que vemos este player — inicializa na posição atual (sem slide)
      render = { x: targetX, y: targetY, frame: 0 };
      playerRenderStates.set(stateKey, render);
    }

    // Lerp: avança suavemente em direção à posição alvo recebida da rede
    const dx = targetX - render.x;
    const dy = targetY - render.y;
    render.x += dx * LERP_SPEED;
    render.y += dy * LERP_SPEED;

    // Animação de caminhada baseada no deslocamento interpolado (não no booleano da rede)
    const isActuallyMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
    if (isActuallyMoving) {
      render.frame = (render.frame + 0.15) % 4;
    } else {
      render.frame = 0;
    }

    const screenX = render.x * TILE_SIZE;
    const screenY = render.y * TILE_SIZE;

    // ── Fase 4.2: Fade-out de Players Desconectando ──────────────────────────
    // Players reais têm updated_at; bots não têm (sempre alpha 1)
    let alpha = 1;
    if (!isBot && p.updated_at) {
      const age = Date.now() - new Date(p.updated_at).getTime();
      if (age > FADE_START_MS) {
        // Fade linear de 1 → 0 nos últimos 5s antes do timeout
        alpha = Math.max(0, 1 - (age - FADE_START_MS) / (PLAYER_TIMEOUT_MS - FADE_START_MS));
      }
      // Se já deu timeout, não renderiza
      if (age >= PLAYER_TIMEOUT_MS) return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    drawPixelCharacter(
      ctx,
      screenX,
      screenY,
      p,
      isActuallyMoving,
      render.frame,
      p.dir,
      false
    );

    // ── Name tag do player ────────────────────────────────────────────────────
    const pNameY = screenY - 19;
    ctx.font = "bold 9px 'JetBrains Mono', 'Ubuntu', sans-serif";

    let currentTitle = p.activeTitle;
    let tagColor = "#ffffff";
    let tagShadowColor = "";
    let tagShadowBlur = 0;
    let borderStyle = isBot ? "rgba(255,255,255,0.2)" : "rgba(255, 198, 0, 0.55)";

    if (currentTitle === "Herói Lendário de Stellar") {
      tagColor = "#00ff66";
      tagShadowColor = "#00e676";
      tagShadowBlur = 8;
      borderStyle = "#00ff66";
    } else if (currentTitle === "Alquimista do Soroban") {
      tagColor = "#e879f9";
      tagShadowColor = "#d946ef";
      tagShadowBlur = 6;
      borderStyle = "#e879f9";
    } else if (currentTitle === "Operador On-Ramp") {
      tagColor = "#fbbf24";
      tagShadowColor = "#f59e0b";
      tagShadowBlur = 6;
      borderStyle = "#fbbf24";
    } else if (currentTitle === "Iniciado de Stellar") {
      tagColor = "#ffc600";
      borderStyle = "#facc15";
    }

    let prefix = currentTitle === "Herói Lendário de Stellar" ? "⭐ " : "";

    if (p.isGM) {
      prefix = "[GM] ";
      tagColor = "#ef4444";
      tagShadowColor = "#dc2626";
      tagShadowBlur = 8;
      borderStyle = "#ef4444";
    }

    let namePart = p.name || "Anonymo";
    const part1 = prefix + namePart;
    const textWidth = ctx.measureText(part1).width;
    const pNameW = textWidth + 8;
    const pNameH = 13;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(screenX + 16 - pNameW / 2, pNameY - 2, pNameW, pNameH);

    if (tagShadowBlur > 0 && tagShadowColor) {
      ctx.shadowColor = tagShadowColor;
      ctx.shadowBlur = tagShadowBlur;
    }
    ctx.strokeStyle = borderStyle;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 16 - pNameW / 2, pNameY - 2, pNameW, pNameH);
    ctx.shadowBlur = 0;

    if (tagShadowBlur > 0 && tagShadowColor) {
      ctx.shadowColor = tagShadowColor;
      ctx.shadowBlur = tagShadowBlur;
    }
    ctx.fillStyle = tagColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(part1, screenX + 16, pNameY + pNameH / 2 - 2 + 0.5);
    ctx.shadowBlur = 0;

    // ── Speech bubble ─────────────────────────────────────────────────────────
    if (p.bubbleText) {
      const bubbleY = screenY - 24;
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      const bTextWidth = ctx.measureText(p.bubbleText).width;
      const bW = bTextWidth + 12;
      const bH = 16;
      const bx = screenX + 16 - bW / 2;
      const by = bubbleY - bH - 4;

      // Background da bolha
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(bx, by, bW, bH, 4);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Ponteiro triangular para baixo
      ctx.beginPath();
      ctx.moveTo(screenX + 16 - 4, by + bH);
      ctx.lineTo(screenX + 16, by + bH + 4);
      ctx.lineTo(screenX + 16 + 4, by + bH);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(screenX + 16 - 4, by + bH);
      ctx.lineTo(screenX + 16, by + bH + 4);
      ctx.lineTo(screenX + 16 + 4, by + bH);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.bubbleText, screenX + 16, by + bH / 2 + 0.5);
    }

    ctx.restore();
  });
};
