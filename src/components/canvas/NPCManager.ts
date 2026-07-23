import { NPC, GameState, Player } from "../../types";
import { MapId } from "../../maps";
import { TILE_SIZE } from "../../gameData";
import { drawPixelCharacter, getNPCPixelChar } from "./PlayerSprite";

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
  otherPlayers.forEach((p) => {
    let drawPlayerOk = false;
    
    // Check if it's a bot
    if (p.id?.startsWith("mmo")) {
      if (p.id === "mmo1" && currentRegion === "center") drawPlayerOk = true;
      else if (p.id === "mmo2" && currentRegion === "west") drawPlayerOk = true;
      else if (p.id === "mmo3" && currentRegion === "east") drawPlayerOk = true;
      else if (p.id === "mmo4" && currentRegion === "north") drawPlayerOk = true;
      else if (p.id === "mmo5" && currentRegion === "south") drawPlayerOk = true;
    } else {
      // Real players are pre-filtered by region in GameCanvas, so we can always draw them
      drawPlayerOk = true;
    }

    if (!drawPlayerOk) {
      return;
    }

    const screenX = p.x * TILE_SIZE;
    const screenY = p.y * TILE_SIZE;

    drawPixelCharacter(
      ctx,
      screenX,
      screenY,
      p,
      p.isMoving,
      p.frame,
      p.dir,
      false
    );

    // Other Player name tag over their head
    const pNameY = screenY - 19;
    ctx.font = "bold 9px 'JetBrains Mono', 'Ubuntu', sans-serif";
    const textWidth = ctx.measureText(p.name).width;
    const pNameW = textWidth + 8;
    const pNameH = 13;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(screenX + 16 - pNameW / 2, pNameY - 2, pNameW, pNameH);
    ctx.strokeStyle = "rgba(255, 198, 0, 0.4)"; // Subtle orange/gold border for online MMO players
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 16 - pNameW / 2, pNameY - 2, pNameW, pNameH);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.name, screenX + 16, pNameY + pNameH / 2 - 2 + 0.5);

    // Draw their speech bubble if active
    if (p.bubbleText) {
      const bubbleY = screenY - 24;
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      const bTextWidth = ctx.measureText(p.bubbleText).width;
      const bW = bTextWidth + 12;
      const bH = 16;
      const bx = screenX + 16 - bW / 2;
      const by = bubbleY - bH - 4;

      // Draw bubble background with soft shadow
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(bx, by, bW, bH, 4);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Triangle pointer pointing down
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

      // Draw text
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.bubbleText, screenX + 16, by + bH / 2 + 0.5);
    }
  });
};
