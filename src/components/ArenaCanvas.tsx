/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ArenaCanvas.tsx — Canvas de renderização da Arena PVP (Tela Cheia)
 *
 * Renderiza em full-screen com câmera dinâmica (3.5x desktop, 2.5x mobile)
 * centrada no jogador local — idêntico ao GameCanvas do jogo normal.
 *
 * Visual idêntico ao jogo principal:
 *  - Mesmo tile de areia (TileType.SAND) e parede (TileType.WALL) do MapRenderer
 *  - Sprite de personagem via drawPixelCharacter (PlayerSprite.ts)
 *  - Barras curvas radiais HP (verde) e MP (azul) ao redor do sprite
 *  - Nameplate cyberpunk neon com título, tag de guilda, nome e sufixo de carteira
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { PvpPlayer, PvpSession } from "../pvp/pvpTypes";
import {
  generateArenaGrid,
  ArenaTileType,
  ARENA_COLS,
  ARENA_ROWS,
} from "../pvp/arenaMap";
import { getSocket } from "../services/multiplayerService";
import { drawPixelCharacter } from "./canvas/PlayerSprite";

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  timestamp: number;
}

interface ArenaCanvasProps {
  session: PvpSession;
  playerId: string;
  onEliminated: () => void;
}

const ARENA_GRID = generateArenaGrid();

// Tamanho nativo de tile — igual ao TILE_SIZE do jogo (32px)
// Com zoom 3.5x, o jogador ve ~14 tiles em tela (similar ao mundo aberto)
const TILE_PX = 32;

const ARENA_WORLD_W = ARENA_COLS * TILE_PX; // 384px
const ARENA_WORLD_H = ARENA_ROWS * TILE_PX; // 384px

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ session, playerId, onEliminated }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const playerPos = useGameStore((s) => s.playerPos);
  // Acessa quests diretamente — GameStore estende GameState (nao ha campo 'gameState')
  const quests = useGameStore((s) => s.quests);

  const floatingTextsRef = useRef<FloatingText[]>([]);
  const sessionRef = useRef<PvpSession>(session);
  const localPlayerRef = useRef<PvpPlayer | null>(null);
  const selectedTargetIdRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  // Sync session ref
  useEffect(() => {
    sessionRef.current = session;
    const local = session.players.find((p) => p.playerId === playerId);
    if (local) localPlayerRef.current = local;
  }, [session, playerId]);

  // Resize — usa a janela inteira
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Texto flutuante de dano
  const spawnFloatingText = useCallback(
    (text: string, worldX: number, worldY: number, color: string) => {
      floatingTextsRef.current.push({
        id: `ft_${Date.now()}_${Math.random()}`,
        text,
        x: worldX,
        y: worldY,
        color,
        alpha: 1,
        vy: -1.5,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Socket: recebe hits
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onHit = (data: { targetId: string; damage: number; isCrit: boolean; element: string }) => {
      const target = sessionRef.current.players.find((p) => p.playerId === data.targetId);
      if (!target) return;
      const color = data.isCrit ? "#fbbf24" : data.element === "physical" ? "#f87171" : "#a78bfa";
      const text = data.isCrit ? `💥 ${data.damage}!` : `-${data.damage}`;
      spawnFloatingText(text, target.arenaX * TILE_PX + TILE_PX / 2, target.arenaY * TILE_PX, color);
      const myId = playerPos.walletAddress || playerPos.name;
      if (data.targetId === myId) {
        spawnFloatingText("ATINGIDO!", target.arenaX * TILE_PX + TILE_PX / 2, target.arenaY * TILE_PX - TILE_PX, "#ef4444");
      }
    };
    socket.on("arena_player_hit", onHit);
    return () => { socket.off("arena_player_hit", onHit); };
  }, [playerPos, spawnFloatingText]);

  // Click no canvas seleciona alvo (convertendo coords de tela para mundo com zoom)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const zoom = size.w < 768 ? 2.5 : 3.5;

      const myId = playerPos.walletAddress || playerPos.name;
      const me = sessionRef.current.players.find((p) => p.playerId === myId);

      const playerWorldX = me ? me.arenaX * TILE_PX + TILE_PX / 2 : ARENA_WORLD_W / 2;
      const playerWorldY = me ? me.arenaY * TILE_PX + TILE_PX / 2 : ARENA_WORLD_H / 2;

      // Reverter a transformacao de camera
      const halfW = size.w / 2 / zoom;
      const halfH = size.h / 2 / zoom;
      const camX = Math.max(halfW, Math.min(ARENA_WORLD_W - halfW, playerWorldX));
      const camY = Math.max(halfH, Math.min(ARENA_WORLD_H - halfH, playerWorldY));

      const screenClickX = e.clientX - rect.left;
      const screenClickY = e.clientY - rect.top;
      const worldX = (screenClickX - size.w / 2) / zoom + camX;
      const worldY = (screenClickY - size.h / 2) / zoom + camY;
      const cx = Math.floor(worldX / TILE_PX);
      const cy = Math.floor(worldY / TILE_PX);

      const clicked = sessionRef.current.players.find(
        (p) =>
          !p.isEliminated &&
          p.playerId !== myId &&
          Math.abs(p.arenaX - cx) <= 1 &&
          Math.abs(p.arenaY - cy) <= 1
      );
      selectedTargetIdRef.current = clicked ? clicked.playerId : null;
    },
    [playerPos, size]
  );

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // drawTile: identico ao MapRenderer do jogo principal
    const drawTile = (c: number, r: number, tile: number) => {
      const px = c * TILE_PX;
      const py = r * TILE_PX;
      const ts = TILE_PX;
      const now = Date.now();

      switch (tile) {
        // Piso de Areia - identico ao TileType.SAND do MapRenderer
        case ArenaTileType.SAND_FLOOR:
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = "#facc15";
          if ((c * 11 + r * 7) % 15 === 0) {
            ctx.fillRect(px + 10, py + 10, 1.5, 1.5);
            ctx.fillRect(px + 22, py + 18, 1.5, 1.5);
          }
          if ((c * 3 + r * 5) % 11 === 0) {
            ctx.fillStyle = "rgba(120,90,0,0.08)";
            ctx.fillRect(px + 4, py + 4, 8, 2);
          }
          break;

        // Parede de Pedra - identico ao TileType.WALL do MapRenderer
        case ArenaTileType.WALL:
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(px, py + 10, ts, 1.5);
          ctx.fillRect(px, py + 20, ts, 1.5);
          ctx.fillRect(px + 12, py, 1.5, 10);
          ctx.fillRect(px + 22, py + 10, 1.5, 10);
          ctx.fillStyle = "#334155";
          ctx.fillRect(px, py, ts, 2);
          break;

        // Tocha - parede com chama animada
        case ArenaTileType.TORCH: {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(px, py + 10, ts, 1.5);
          ctx.fillStyle = "#334155";
          ctx.fillRect(px, py, ts, 2);

          ctx.fillStyle = "#78350f";
          ctx.fillRect(px + ts * 0.42, py + ts * 0.5, ts * 0.16, ts * 0.35);

          const flicker = Math.sin(now / 100) * 1.5;
          ctx.fillStyle = "rgba(249,115,22,0.18)";
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts * 0.38, 10 + flicker, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ea580c";
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts * 0.38 + flicker, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts * 0.4, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        // Portao - pedra escura com grade metalica
        case ArenaTileType.GATE:
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, ts, ts);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 1.5;
          for (let gi = 0; gi < 3; gi++) {
            const gx = px + ts * 0.25 + gi * (ts * 0.25);
            ctx.beginPath();
            ctx.moveTo(gx, py + 2);
            ctx.lineTo(gx, py + ts - 2);
            ctx.stroke();
          }
          break;

        default:
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, ts, ts);
          break;
      }
    };

    const drawArenaGrid = () => {
      for (let r = 0; r < ARENA_ROWS; r++) {
        for (let c = 0; c < ARENA_COLS; c++) {
          drawTile(c, r, ARENA_GRID[r][c]);
        }
      }
    };

    // Barras curvas radiais HP/MP - identicas ao GameCanvas
    const drawCurvedBar = (
      tileX: number,
      tileY: number,
      isLeft: boolean,
      ratio: number,
      color: string,
      bgColor: string,
    ) => {
      const barRadius = 24;
      const barWidth  = 6;
      ctx.save();
      ctx.lineCap = "butt";

      let startAngle: number, endAngle: number, counterClockwise: boolean;
      if (isLeft) {
        startAngle = Math.PI * 0.70;
        endAngle   = Math.PI * 1.30;
        counterClockwise = false;
      } else {
        startAngle = Math.PI * 0.30;
        endAngle   = Math.PI * 1.70;
        counterClockwise = true;
      }
      const sweep = Math.PI * 0.60;
      const cx = tileX + TILE_PX / 2;
      const cy = tileY + TILE_PX / 2;

      // Borda preta
      ctx.lineWidth = barWidth + 2;
      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, barRadius, startAngle, endAngle, counterClockwise);
      ctx.stroke();

      // Fundo escuro
      ctx.lineWidth = barWidth;
      ctx.strokeStyle = bgColor;
      ctx.beginPath();
      ctx.arc(cx, cy, barRadius, startAngle, endAngle, counterClockwise);
      ctx.stroke();

      // Preenchimento proporcional
      if (ratio > 0) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        const currentEnd = isLeft
          ? startAngle + sweep * ratio
          : startAngle - sweep * ratio;
        ctx.arc(cx, cy, barRadius, startAngle, currentEnd, counterClockwise);
        ctx.stroke();
      }

      // Divisorias retro (segmentos)
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      for (let i = 1; i < 10; i++) {
        const segAngle = isLeft
          ? startAngle + sweep * (i / 10)
          : startAngle - sweep * (i / 10);
        const inner = barRadius - barWidth / 2;
        const outer = barRadius + barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(segAngle) * inner, cy + Math.sin(segAngle) * inner);
        ctx.lineTo(cx + Math.cos(segAngle) * outer, cy + Math.sin(segAngle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    };

    // Nameplate cyberpunk neon - identico ao GameCanvas
    const drawNameplate = (
      tileX: number,
      tileY: number,
      p: PvpPlayer,
      isMe: boolean,
      zoom: number,
      isLegendary: boolean,
    ) => {
      // Escala inversa ao zoom para o texto ficar legivel independente do zoom
      ctx.save();
      const scale = 1 / zoom;
      ctx.translate(tileX + TILE_PX / 2, tileY - 4);
      ctx.scale(scale, scale);

      let tagColor = isMe ? "#93c5fd" : "#ffffff";
      let tagShadowColor = "";
      let tagShadowBlur = 0;
      let borderStyle = isMe ? "rgba(147,197,253,0.6)" : "rgba(255,198,0,0.55)";

      if (isLegendary) {
        tagColor = "#00ff66";
        tagShadowColor = "#00e676";
        tagShadowBlur = 8;
        borderStyle = "#00ff66";
      }

      const namePart = p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name;
      const fullName = isMe ? namePart : namePart;

      ctx.font = "bold 9px 'JetBrains Mono', 'Ubuntu', sans-serif";
      const tw = ctx.measureText(fullName).width;
      const padX = 6, padY = 3;
      const bw = tw + padX * 2;
      const bh = 11 + padY * 2;

      ctx.fillStyle = "rgba(3,7,18,0.82)";
      const bx = -bw / 2;
      const by = -bh - 16;
      if ((ctx as any).roundRect) (ctx as any).roundRect(bx, by, bw, bh, 3);
      else ctx.rect(bx, by, bw, bh);
      ctx.fill();

      ctx.strokeStyle = borderStyle;
      ctx.lineWidth = 1;
      if ((ctx as any).roundRect) (ctx as any).roundRect(bx, by, bw, bh, 3);
      else ctx.rect(bx, by, bw, bh);
      ctx.stroke();

      ctx.fillStyle = tagColor;
      if (tagShadowColor) {
        ctx.shadowColor = tagShadowColor;
        ctx.shadowBlur = tagShadowBlur;
      }
      ctx.textAlign = "center";
      ctx.fillText(fullName, 0, by + padY + 9);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      ctx.restore();
    };

    const drawPlayers = (now: number, zoom: number) => {
      const myId = playerPos.walletAddress || playerPos.name;
      const selectedId = selectedTargetIdRef.current;

      sessionRef.current.players.forEach((p) => {
        if (p.isEliminated) return;

        const px = p.arenaX * TILE_PX;
        const py = p.arenaY * TILE_PX;
        const isMe = p.playerId === myId;
        const isSelected = p.playerId === selectedId;
        const ts = TILE_PX;

        // Circulo de selecao (alvo)
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, ts * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.stroke();
          const pulse = Math.sin(now / 300) * 0.3 + 0.7;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, ts * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Sombra do personagem
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(px + ts / 2, py + ts * 0.85, ts * 0.35, ts * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprite do personagem (identico ao GameCanvas e NPCManager)
        const charData: any = isMe ? { ...playerPos } : { ...p };
        try {
          drawPixelCharacter(
            ctx,
            px,
            py,
            charData,
            p.isMoving || false,
            p.frame || 0,
            p.dir || "down"
          );
        } catch {
          ctx.fillStyle = isMe ? "#3b82f6" : "#ef4444";
          ctx.fillRect(px + ts * 0.2, py + ts * 0.1, ts * 0.6, ts * 0.8);
          ctx.fillStyle = "white";
          ctx.font = `${ts * 0.5}px serif`;
          ctx.textAlign = "center";
          ctx.fillText(isMe ? "🧙" : "⚔️", px + ts / 2, py + ts * 0.65);
          ctx.textAlign = "left";
        }

        // Barras curvas radiais HP/MP (identicas ao GameCanvas modo batalha)
        const hp    = Math.max(0, p.hp);
        const maxHp = Math.max(1, p.maxHp);
        const mp    = Math.max(0, (p as any).mp ?? 50);
        const maxMp = Math.max(1, (p as any).maxMp ?? 100);

        drawCurvedBar(px, py, true,  hp / maxHp, "#22c55e", "#14532d"); // HP verde esq
        drawCurvedBar(px, py, false, mp / maxMp, "#3b82f6", "#1e3a8a"); // MP azul dir

        // Nameplate cyberpunk neon
        const isLegendary = (p as any).level >= 5 ||
          quests?.hold?.status === "completed";
        drawNameplate(px, py, p, isMe, zoom, isLegendary);
      });
    };

    const drawFloatingTexts = (now: number) => {
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => now - ft.timestamp < 1500);
      floatingTextsRef.current.forEach((ft) => {
        const age = (now - ft.timestamp) / 1500;
        ft.y += ft.vy;
        ft.alpha = 1 - age;
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${TILE_PX * 0.35}px monospace`;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });
      ctx.textAlign = "left";
    };

    const draw = (now: number) => {
      const myId = playerPos.walletAddress || playerPos.name;
      const me = sessionRef.current.players.find((p) => p.playerId === myId);

      // Zoom dinamico - identico ao GameCanvas
      const zoom = size.w < 768 ? 2.5 : 3.5;

      // Centro do player no espaco de mundo
      const playerWorldX = me
        ? me.arenaX * TILE_PX + TILE_PX / 2
        : ARENA_WORLD_W / 2;
      const playerWorldY = me
        ? me.arenaY * TILE_PX + TILE_PX / 2
        : ARENA_WORLD_H / 2;

      // Clamp da camera nas bordas do mapa
      const halfW = size.w / 2 / zoom;
      const halfH = size.h / 2 / zoom;
      const camX = Math.max(halfW, Math.min(ARENA_WORLD_W - halfW, playerWorldX));
      const camY = Math.max(halfH, Math.min(ARENA_WORLD_H - halfH, playerWorldY));

      // Fundo de masmorra (igual ao GameCanvas)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.save();
      // Transformacao de camera com zoom (identico ao GameCanvas)
      ctx.translate(size.w / 2, size.h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      drawArenaGrid();
      drawPlayers(now, zoom);
      drawFloatingTexts(now);

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, playerPos, session, quests]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
    >
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
        style={{ imageRendering: "pixelated", display: "block" }}
      />
    </div>
  );
};
