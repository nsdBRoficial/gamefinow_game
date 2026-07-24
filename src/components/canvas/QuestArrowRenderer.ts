/**
 * QuestArrowRenderer.ts
 * Renderizador da Seta Magnética de Missões (Quest Arrow / Compass) do GameFiNow.
 *
 * Ajustes v2:
 *   - Reduzida para ~10% do tamanho anterior (p = 0.35, discreta, graciosa e proporcional)
 *   - Sem nenhum texto / label (apenas a seta puramente magnética em Pixel Art)
 *   - Coordenadas exatas dos portais corrigidas:
 *       • Portal Leste: x = 58, y = 29.5 (extremidade da rua leste)
 *       • Portal Oeste: x = 1, y = 29.5
 *       • Portal Norte: x = 29.5, y = 1
 *       • Portal Sul: x = 29.5, y = 58
 */

import { GameState, Player } from "../../types";
import { TILE_SIZE } from "../../gameData";
import { MapId } from "../../maps";

export interface QuestTarget {
  name: string;
  x: number; // Grid X
  y: number; // Grid Y
  mapId: "center" | "east" | "north" | "west" | "south";
  type: "npc" | "portal" | "terminal";
  color: string;
}

/**
 * Determina o alvo magnético atual com base no progresso das missões e nos diálogos concluídos.
 */
export function getCurrentQuestTarget(
  gameState: GameState,
  playerPos: Player
): QuestTarget | null {
  const { quests, jamesDialogsDone = [] } = gameState as any;
  const currentMap = (playerPos.mapId || "center") as MapId;

  // ─── 1. MISSÃO 1: WALLET (Registro / Forja do Destino) ───────────────────
  if (quests.wallet.status === "active") {
    const talkedInitialJames = jamesDialogsDone.includes("guide_initial");

    if (!talkedInitialJames) {
      // Passo 1: Falar com James no Centro
      if (currentMap === "center") {
        return {
          name: "James [NPC]",
          x: 27,
          y: 28,
          mapId: "center",
          type: "npc",
          color: "#f59e0b",
        };
      } else {
        return {
          name: "Portal para o Centro",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    } else {
      // Passo 2: Ir ao Portal Leste (x = 58, y = 29.5 no mapa Central)
      if (currentMap === "center") {
        return {
          name: "Portal Leste",
          x: 58,
          y: 29.5,
          mapId: "center",
          type: "portal",
          color: "#06b6d4",
        };
      } else if (currentMap === "east") {
        // No Leste: Se não tem carteira, aponta pro Terminal/Kael
        if (!gameState.wallet.hasWallet) {
          return {
            name: "Terminal Wallet",
            x: 35,
            y: 28,
            mapId: "east",
            type: "terminal",
            color: "#38bdf8",
          };
        }
      } else {
        return {
          name: "Portal para o Centro",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    }
  }

  // ─── 2. MISSÃO 1 CONCLUÍDA -> VOLTAR AO JAMES OU IR AO NORTE ─────────────
  if (quests.wallet.status === "completed" && quests.onramp.status === "active") {
    const talkedWalletJames = jamesDialogsDone.includes("guide_wallet_done");

    if (!talkedWalletJames) {
      if (currentMap === "east") {
        return {
          name: "Portal de Retorno (Centro)",
          x: 4,
          y: 29,
          mapId: "east",
          type: "portal",
          color: "#38bdf8",
        };
      } else if (currentMap === "center") {
        return {
          name: "James [NPC]",
          x: 27,
          y: 28,
          mapId: "center",
          type: "npc",
          color: "#22c55e",
        };
      } else {
        return {
          name: "Portal para o Centro",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    } else {
      // Já falou com James -> Ir ao Portal Norte (x = 29.5, y = 1 no mapa Central)
      if (currentMap === "center") {
        return {
          name: "Portal Norte",
          x: 29.5,
          y: 1,
          mapId: "center",
          type: "portal",
          color: "#22c55e",
        };
      } else if (currentMap === "north") {
        return {
          name: "Terminal On-Ramp",
          x: 31,
          y: 24,
          mapId: "north",
          type: "terminal",
          color: "#22c55e",
        };
      } else {
        return {
          name: "Portal de Retorno (Centro)",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    }
  }

  // ─── 3. MISSÃO 2 CONCLUÍDA -> VOLTAR AO JAMES OU IR AO OESTE (SOROBAN) ────
  if (quests.onramp.status === "completed" && quests.soroban.status === "active") {
    const talkedOnrampJames = jamesDialogsDone.includes("guide_onramp_done");

    if (!talkedOnrampJames) {
      if (currentMap === "north") {
        return {
          name: "Portal de Retorno (Centro)",
          x: 29,
          y: 55,
          mapId: "north",
          type: "portal",
          color: "#38bdf8",
        };
      } else if (currentMap === "center") {
        return {
          name: "James [NPC]",
          x: 27,
          y: 28,
          mapId: "center",
          type: "npc",
          color: "#a855f7",
        };
      } else {
        return {
          name: "Portal para o Centro",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    } else {
      // Ir ao Portal Oeste (x = 1, y = 29.5 no mapa Central)
      if (currentMap === "center") {
        return {
          name: "Portal Oeste",
          x: 1,
          y: 29.5,
          mapId: "center",
          type: "portal",
          color: "#a855f7",
        };
      } else if (currentMap === "west") {
        return {
          name: "Terminal Soroban Swap",
          x: 31,
          y: 27,
          mapId: "west",
          type: "terminal",
          color: "#a855f7",
        };
      } else {
        return {
          name: "Portal de Retorno (Centro)",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    }
  }

  // ─── 4. MISSÃO 3 CONCLUÍDA -> VOLTAR AO JAMES OU IR AO SUL (HOLD) ─────────
  if (quests.soroban.status === "completed" && quests.hold.status === "active") {
    const talkedSorobanJames = jamesDialogsDone.includes("guide_soroban_done");

    if (!talkedSorobanJames) {
      if (currentMap === "west") {
        return {
          name: "Portal de Retorno (Centro)",
          x: 55,
          y: 29,
          mapId: "west",
          type: "portal",
          color: "#38bdf8",
        };
      } else if (currentMap === "center") {
        return {
          name: "James [NPC]",
          x: 27,
          y: 28,
          mapId: "center",
          type: "npc",
          color: "#eab308",
        };
      } else {
        return {
          name: "Portal para o Centro",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    } else {
      // Ir ao Portal Sul (x = 29.5, y = 58 no mapa Central)
      if (currentMap === "center") {
        return {
          name: "Portal Sul",
          x: 29.5,
          y: 58,
          mapId: "center",
          type: "portal",
          color: "#eab308",
        };
      } else if (currentMap === "south") {
        return {
          name: "Terminal Hold",
          x: 33,
          y: 24,
          mapId: "south",
          type: "terminal",
          color: "#eab308",
        };
      } else {
        return {
          name: "Portal de Retorno (Centro)",
          x: getReturnPortalCoord(currentMap).x,
          y: getReturnPortalCoord(currentMap).y,
          mapId: currentMap,
          type: "portal",
          color: "#38bdf8",
        };
      }
    }
  }

  // ─── 5. TODAS AS MISSÕES CONCLUÍDAS ──────────────────────────────────────
  if (quests.hold.status === "completed") {
    if (currentMap === "center") {
      return {
        name: "James [NPC]",
        x: 27,
        y: 28,
        mapId: "center",
        type: "npc",
        color: "#22c55e",
      };
    } else {
      return {
        name: "Portal para o Centro",
        x: getReturnPortalCoord(currentMap).x,
        y: getReturnPortalCoord(currentMap).y,
        mapId: currentMap,
        type: "portal",
        color: "#38bdf8",
      };
    }
  }

  return null;
}

/**
 * Retorna as coordenadas do portal de retorno para o centro em cada mapa.
 */
function getReturnPortalCoord(mapId: MapId): { x: number; y: number } {
  switch (mapId) {
    case "east":
      return { x: 4, y: 29 };
    case "west":
      return { x: 55, y: 29 };
    case "north":
      return { x: 29, y: 55 };
    case "south":
      return { x: 29, y: 4 };
    default:
      return { x: 29, y: 29 };
  }
}

/**
 * Renderiza a Seta Magnética em Pixel Art no Canvas.
 */
export function drawQuestArrow(
  ctx: CanvasRenderingContext2D,
  target: QuestTarget,
  playerPos: Player,
  dims: { width: number; height: number },
  zoomLevel: number
) {
  const currentRegion = (playerPos.mapId || "center") as MapId;

  const targetWorldX = target.x * TILE_SIZE + TILE_SIZE / 2;
  const targetWorldY = target.y * TILE_SIZE + TILE_SIZE / 2;

  const playerWorldX = playerPos.x * TILE_SIZE + TILE_SIZE / 2;
  const playerWorldY = playerPos.y * TILE_SIZE + TILE_SIZE / 2;

  // Limites do Viewport visível no Canvas
  const halfW = dims.width / 2 / zoomLevel;
  const halfH = dims.height / 2 / zoomLevel;
  const leftBound = playerWorldX - halfW;
  const rightBound = playerWorldX + halfW;
  const topBound = playerWorldY - halfH;
  const bottomBound = playerWorldY + halfH;

  const isVisibleInScreen =
    targetWorldX >= leftBound + 16 &&
    targetWorldX <= rightBound - 16 &&
    targetWorldY >= topBound + 16 &&
    targetWorldY <= bottomBound - 16 &&
    target.mapId === currentRegion;

  const time = performance.now();
  const bounce = Math.sin(time / 140) * 3; // Flutuação sutil de levitação

  if (isVisibleInScreen) {
    // ─── 1. GRUDADA MAGNETICAMENTE NO ALVO (Dentro do Viewport) ──────────────
    // A seta se fixa exatamente no topo do alvo (cabeça do NPC / topo do portal / topo do terminal)
    // Apontando para BAIXO!
    const arrowX = targetWorldX;
    const arrowY = targetWorldY - 26 + bounce; // Flutua graciosamente acima do topo

    drawPixelArrowSprite(ctx, arrowX, arrowY, 0, true);
  } else {
    // ─── 2. BORDA DA TELA / APONTANDO DIREÇÃO (Fora do Viewport) ──────────────
    // Calculamos o ângulo entre o jogador e o objetivo
    const dx = targetWorldX - playerWorldX;
    const dy = targetWorldY - playerWorldY;
    const angleRad = Math.atan2(dy, dx);

    // Margem interna para a seta na borda da tela
    const marginX = halfW - 20;
    const marginY = halfH - 20;

    let clampedX = dx;
    let clampedY = dy;

    // Clamping retangular proporcional
    if (Math.abs(clampedX) > marginX) {
      clampedX = Math.sign(clampedX) * marginX;
      clampedY = clampedX * Math.tan(angleRad);
    }
    if (Math.abs(clampedY) > marginY) {
      clampedY = Math.sign(clampedY) * marginY;
      clampedX = clampedY / Math.tan(angleRad);
    }

    const arrowScreenX = playerWorldX + clampedX;
    const arrowScreenY = playerWorldY + clampedY;

    drawPixelArrowSprite(ctx, arrowScreenX, arrowScreenY, angleRad + Math.PI / 2, false);
  }
}

/**
 * Desenha a sprite retro de Seta Pixel Art no Canvas.
 * Amarela/dourada com borda escura reluzente (reduzida para ~10% do tamanho anterior, sem textos).
 */
function drawPixelArrowSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotationRad: number,
  isMagneticOnTarget: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  if (!isMagneticOnTarget) {
    ctx.rotate(rotationRad);
  }

  // Pixel size scaling super delicado (10% do tamanho anterior)
  const p = 0.35;

  // ── Sombra projetada sob a seta ──
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 16 * p, 6 * p, 2.5 * p, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Sprite Pixel-Art da Seta Apontando para Baixo ──
  const outerBorder = "#2e1065";  // Borda escura roxa/vinho retro
  const mainYellow = "#facc15";   // Amarelo vibrante
  const lightYellow = "#fefef0";  // Brilho/Highlight
  const shadowOrange = "#ea580c"; // Sombreamento lateral

  // Contorno Externo (Dark Outline)
  ctx.fillStyle = outerBorder;
  // Haste vertical da seta (retângulo do corpo)
  ctx.fillRect(-4 * p, -14 * p, 8 * p, 16 * p);
  // Cabeça triangular da seta (base e ponta)
  ctx.beginPath();
  ctx.moveTo(-11 * p, 2 * p);
  ctx.lineTo(11 * p, 2 * p);
  ctx.lineTo(0 * p, 15 * p);
  ctx.closePath();
  ctx.fill();

  // Corpo Principal (Amarelo Ouro)
  ctx.fillStyle = mainYellow;
  ctx.fillRect(-3 * p, -13 * p, 6 * p, 14 * p);
  ctx.beginPath();
  ctx.moveTo(-9 * p, 3 * p);
  ctx.lineTo(9 * p, 3 * p);
  ctx.lineTo(0 * p, 13 * p);
  ctx.closePath();
  ctx.fill();

  // Highlight lateral esquerdo (Luz reluzente Amarelo claro)
  ctx.fillStyle = lightYellow;
  ctx.fillRect(-3 * p, -13 * p, 2 * p, 14 * p);
  ctx.beginPath();
  ctx.moveTo(-9 * p, 3 * p);
  ctx.lineTo(0 * p, 3 * p);
  ctx.lineTo(0 * p, 13 * p);
  ctx.closePath();
  ctx.fill();

  // Sombra lateral direita (Laranja escuro)
  ctx.fillStyle = shadowOrange;
  ctx.fillRect(1 * p, -13 * p, 2 * p, 14 * p);
  ctx.beginPath();
  ctx.moveTo(0 * p, 3 * p);
  ctx.lineTo(9 * p, 3 * p);
  ctx.lineTo(0 * p, 13 * p);
  ctx.closePath();
  ctx.fill();

  // Ponto reluzente central (Ponto rosa/vermelho da referência)
  ctx.fillStyle = "#ec4899";
  ctx.fillRect(-1 * p, 5 * p, 2 * p, 2 * p);

  ctx.restore();
}
