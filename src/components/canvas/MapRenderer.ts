import { TileType } from "../../gameData";
import { getMapDecorations, MapId } from "../../maps";
import { Player } from "../../types";

export const drawPortalVortex = (ctx: CanvasRenderingContext2D, wx: number, wy: number, color: string, tileSize: number) => {
  const cx = wx + tileSize / 2;
  const cy = wy + tileSize / 2;
  const pulseRadius = 11 + Math.sin(performance.now() / 150) * 3;
  
  // Glowing backing
  ctx.fillStyle = color + "20";
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius + 4, 0, Math.PI * 2);
  ctx.fill();

  // Outer swirling rings
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary ring
  ctx.strokeStyle = color + "90";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Swirling orbit star particle
  ctx.fillStyle = color;
  const angle = (performance.now() / 180) % (Math.PI * 2);
  const px = cx + Math.cos(angle) * (pulseRadius - 3);
  const py = cy + Math.sin(angle) * (pulseRadius - 3);
  ctx.fillRect(px - 2.5, py - 2.5, 5, 5);

  const px2 = cx + Math.cos(angle + Math.PI) * 4;
  const py2 = cy + Math.sin(angle + Math.PI) * 4;
  ctx.fillRect(px2 - 1.5, py2 - 1.5, 3, 3);
};

export const drawInteractiveTerminal = (
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  label: string,
  color: string,
  tileSize: number,
  playerPos: Player
) => {
  const wx = tx * tileSize;
  const wy = ty * tileSize;

  // Glowing base footprint
  ctx.fillStyle = color + "20";
  ctx.fillRect(wx + 2, wy + 2, tileSize - 4, tileSize - 4);

  // Pedestal column
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(wx + 8, wy + 12, 16, 16);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(wx + 8, wy + 12, 16, 16);

  // Terminal Screen
  ctx.fillStyle = color;
  ctx.fillRect(wx + 10, wy + 6, 12, 6);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(wx + 10, wy + 6, 12, 6);

  // Screen display detail
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(wx + 12, wy + 8, 8, 1);

  // Prompt if player is adjacent
  const dx = Math.abs(playerPos.x - tx);
  const dy = Math.abs(playerPos.y - ty);
  if (dx <= 1 && dy <= 1) {
    const cx = wx + tileSize / 2;
    const cy = wy - 10 + Math.sin(performance.now() / 150) * 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(cx - 30, cy - 8, 60, 14);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 30, cy - 8, 60, 14);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("USAR [ESPAÇO]", cx, cy - 1);
  }
};

export const drawEnergyGate = (ctx: CanvasRenderingContext2D, tx: number, ty: number, color: string, tileSize: number) => {
  const wx = tx * tileSize;
  const wy = ty * tileSize;

  // Pulse animation alpha
  const pulseAlpha = 0.25 + Math.sin(performance.now() / 120) * 0.12;
  ctx.fillStyle = color + Math.floor(pulseAlpha * 255).toString(16).padStart(2, "0");
  ctx.fillRect(wx, wy, tileSize, tileSize);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(wx, wy + tileSize / 2);
  ctx.lineTo(wx + tileSize, wy + tileSize / 2);
  ctx.stroke();

  // Small lock icon inside the gate
  ctx.fillStyle = "#ffffff";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔒", wx + tileSize / 2, wy + tileSize / 2);
};

export const drawMapTiles = (
  ctx: CanvasRenderingContext2D,
  mapGrid: TileType[][],
  currentRegion: MapId,
  leftBound: number,
  rightBound: number,
  topBound: number,
  bottomBound: number,
  calculatedWaveOffset: number,
  tileSize: number,
  gridRows: number,
  gridCols: number
) => {
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const tile = mapGrid[r][c];
      const worldX = c * tileSize;
      const worldY = r * tileSize;

      if (
        worldX < leftBound ||
        worldX > rightBound ||
        worldY < topBound ||
        worldY > bottomBound
      ) {
        continue;
      }

      switch (tile) {
        case TileType.WATER:
          if (currentRegion === "east") {
            // Molten volcanic lava
            ctx.fillStyle = "#7c2d12"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            
            ctx.fillStyle = "#ea580c";
            const rippleX = (c * 17 + r * 13 + calculatedWaveOffset) % tileSize;
            ctx.fillRect(worldX + rippleX, worldY + ((r * 7) % tileSize), 6, 2);
            ctx.fillStyle = "#f97316";
            ctx.fillRect(worldX + (tileSize - rippleX), worldY + ((c * 11) % tileSize), 4, 1.5);
          } else if (currentRegion === "west") {
            // Neon purple cooling fluid/glowing data stream
            ctx.fillStyle = "#1e1b4b"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            
            ctx.strokeStyle = "rgba(167, 139, 250, 0.25)";
            ctx.lineWidth = 1;
            const flowOffset = Math.floor(performance.now() / 150) % tileSize;
            ctx.beginPath();
            ctx.moveTo(worldX, worldY + (r % 2 === 0 ? 10 : 22));
            ctx.lineTo(worldX + tileSize, worldY + (r % 2 === 0 ? 10 : 22));
            ctx.stroke();

            ctx.fillStyle = "#c084fc"; // Violet glowing bits
            ctx.fillRect(worldX + ((c * 13 + flowOffset) % tileSize), worldY + (r % 2 === 0 ? 9 : 21), 4, 2);
          } else {
            // Standard water
            ctx.fillStyle = "#0f1c30"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            
            ctx.fillStyle = "#1e2d42";
            const rippleX = (c * 17 + r * 13 + calculatedWaveOffset) % tileSize;
            ctx.fillRect(worldX + rippleX, worldY + ((r * 7) % tileSize), 6, 1.5);
            ctx.fillStyle = "#152438";
            ctx.fillRect(worldX + (tileSize - rippleX), worldY + ((c * 11) % tileSize), 4, 1);
          }
          break;

        case TileType.BLOCK:
        case TileType.GRASS:
          if (currentRegion === "west") {
            // Motherboard circuits green
            ctx.fillStyle = "#022c22"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#10b981"; 
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX + 2, worldY + 2, tileSize - 4, tileSize - 4);
            if ((c * 7 + r * 13) % 9 === 0) {
              ctx.fillStyle = "#fb923c"; // Transistors
              ctx.fillRect(worldX + 14, worldY + 14, 3, 3);
            }
          } else {
            // Standard grass
            ctx.fillStyle = "#166534"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            
            // Detailed grass tufts (like reference)
            ctx.fillStyle = "#14532d";
            const grassShift = (c * 13 + r * 17) % 12;
            ctx.fillRect(worldX + 4 + grassShift, worldY + 8, 1.5, 4);
            ctx.fillRect(worldX + 5 + grassShift, worldY + 10, 1.5, 2);
            ctx.fillRect(worldX + 18 - grassShift, worldY + 20, 1.5, 4);
            
            // Red and gold pixel flowers
            if ((c * 7 + r * 13) % 19 === 0) {
              ctx.fillStyle = "#facc15";
              ctx.fillRect(worldX + 12, worldY + 12, 2, 2);
              ctx.fillStyle = "#ef4444";
              ctx.fillRect(worldX + 10, worldY + 12, 2, 2);
              ctx.fillRect(worldX + 14, worldY + 12, 2, 2);
            } else if ((c * 3 + r * 19) % 23 === 0) {
              ctx.fillStyle = "#fef08a";
              ctx.fillRect(worldX + 8, worldY + 16, 2, 2);
              ctx.fillRect(worldX + 12, worldY + 18, 1.5, 1.5);
            }
          }
          break;

        case TileType.SAND:
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          ctx.fillStyle = "#facc15";
          if ((c * 11 + r * 7) % 15 === 0) {
            ctx.fillRect(worldX + 10, worldY + 10, 1.5, 1.5);
            ctx.fillRect(worldX + 22, worldY + 18, 1.5, 1.5);
          }
          break;

        case TileType.HEDGE:
          // Trimmed thick green square hedges with outline and highlights
          ctx.fillStyle = "#15803d";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          ctx.fillStyle = "#14532d"; 
          ctx.fillRect(worldX, worldY + tileSize - 4, tileSize, 4);
          ctx.fillRect(worldX + tileSize - 4, worldY, 4, tileSize);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(worldX + 4, worldY + 3, 3, 3);
          ctx.fillRect(worldX + 16, worldY + 4, 3, 3);
          ctx.fillRect(worldX + 10, worldY + 12, 2, 2);
          break;

        case TileType.CROPS:
          // Dirt floor base
          ctx.fillStyle = "#a16207"; // Dark brown dirt
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          // Crop lines
          ctx.fillStyle = "#713f12";
          ctx.fillRect(worldX, worldY + 8, tileSize, 2);
          ctx.fillRect(worldX, worldY + 20, tileSize, 2);
          
          // Corn stalks
          ctx.fillStyle = "#22c55e"; // Green stalk
          ctx.fillRect(worldX + 6, worldY + 2, 2, 8);
          ctx.fillRect(worldX + 22, worldY + 2, 2, 8);
          ctx.fillRect(worldX + 14, worldY + 14, 2, 8);
          
          // Corn cobs (yellow pixels)
          ctx.fillStyle = "#facc15";
          ctx.fillRect(worldX + 5, worldY + 4, 1.5, 3);
          ctx.fillRect(worldX + 23, worldY + 5, 1.5, 3);
          ctx.fillRect(worldX + 15, worldY + 16, 1.5, 3);
          break;

        case TileType.FENCE:
          // Grass base beneath the fence
          ctx.fillStyle = "#166534";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          
          // Wooden fence
          ctx.fillStyle = "#78350f"; // Dark wood
          ctx.fillRect(worldX + 4, worldY + 14, tileSize - 8, 4); // Horizontal plank
          ctx.fillStyle = "#92400e"; // Lighter wood posts
          ctx.fillRect(worldX + 6, worldY + 8, 4, 16);
          ctx.fillRect(worldX + 22, worldY + 8, 4, 16);
          break;

        case TileType.STONE_PATH:
          if (currentRegion === "west") {
            // Carbon fiber cyber track
            ctx.fillStyle = "#18181b"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#f59e0b"; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(worldX + tileSize / 2, worldY);
            ctx.lineTo(worldX + tileSize / 2, worldY + tileSize);
            ctx.stroke();
            if ((c + r) % 4 === 0) {
              ctx.fillStyle = "#f59e0b";
              ctx.fillRect(worldX + tileSize / 2 - 2, worldY + tileSize / 2 - 2, 4, 4);
            }
          } else {
            // Soft slate-200 base with elegant dark joint lines
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(worldX, worldY, tileSize, 1.5);
            ctx.fillRect(worldX, worldY, 1.5, tileSize);
            ctx.fillRect(worldX + tileSize / 2, worldY, 1.5, tileSize);
            ctx.fillRect(worldX, worldY + tileSize / 2, tileSize, 1.5);
            
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(worldX + 2, worldY + 2, tileSize / 2 - 4, tileSize / 2 - 4);
            ctx.fillRect(worldX + tileSize / 2 + 2, worldY + 2, tileSize / 2 - 4, tileSize / 2 - 4);
            ctx.fillRect(worldX + 2, worldY + tileSize / 2 + 2, tileSize / 2 - 4, tileSize / 2 - 4);
            ctx.fillRect(worldX + tileSize / 2 + 2, worldY + tileSize / 2 + 2, tileSize / 2 - 4, tileSize / 2 - 4);
          }
          break;

        case TileType.BRIDGE:
          if (currentRegion === "west") {
            // Cyber holographic platform bridge
            ctx.fillStyle = "rgba(6, 182, 212, 0.2)"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#06b6d4"; 
            ctx.lineWidth = 1.5;
            ctx.strokeRect(worldX, worldY, tileSize, tileSize);
            
            // Animated holographic scanline
            ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
            const scanY = Math.floor(performance.now() / 15) % tileSize;
            ctx.fillRect(worldX, worldY + scanY, tileSize, 1.5);
          } else {
            ctx.fillStyle = "#7c2d12"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.fillStyle = "#451a03";
            ctx.fillRect(worldX, worldY + 4, tileSize, 1.5);
            ctx.fillRect(worldX, worldY + 12, tileSize, 1.5);
            ctx.fillRect(worldX, worldY + 20, tileSize, 1.5);
            ctx.fillRect(worldX, worldY + 28, tileSize, 1.5);
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(worldX + 2, worldY + 6, 1.5, 1.5);
            ctx.fillRect(worldX + tileSize - 3.5, worldY + 6, 1.5, 1.5);
          }
          break;

        case TileType.FLOOR_DARK:
          if (currentRegion === "west") {
            // Cyber grid floor
            ctx.fillStyle = "#090d16"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "rgba(167, 139, 250, 0.15)";
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX, worldY, tileSize, tileSize);
            if ((c * 7 + r * 13) % 17 === 0) {
              ctx.fillStyle = "rgba(167, 139, 250, 0.4)";
              ctx.fillRect(worldX + 15, worldY + 15, 2, 2);
            }
          } else {
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX, worldY, tileSize, tileSize);
            if ((c + r) % 5 === 0) {
              ctx.fillStyle = "#1e293b";
              ctx.fillRect(worldX + 10, worldY + 10, 12, 12);
            }
          }
          break;

        case TileType.TEMPLE_FLOOR:
          if (currentRegion === "south") {
            // Mossy forest floor / garden soil for South Sanctuary
            ctx.fillStyle = "#14532d"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.fillStyle = "#166534";
            if ((c * 5 + r * 11) % 7 === 0) {
              ctx.fillRect(worldX + 8, worldY + 8, 3, 2);
            }
          } else if (currentRegion === "east") {
            // Volcanic obsidian cavern floor for East Forge
            ctx.fillStyle = "#1c1917"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#7c2d12"; 
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX + 3, worldY + 3, tileSize - 6, tileSize - 6);
          } else {
            ctx.fillStyle = "#020617"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.strokeStyle = "#ca8a04";
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX + 3, worldY + 3, tileSize - 6, tileSize - 6);
          }
          break;

        case TileType.WALL:
          if (currentRegion === "west") {
            // Cyber Server Wall Plating
            ctx.fillStyle = "#111827"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.fillStyle = "#06b6d4"; // Cyan glowing strip
            ctx.fillRect(worldX, worldY, tileSize, 1.5);
            ctx.fillStyle = "#1f2937";
            ctx.fillRect(worldX, worldY + 10, tileSize, 1.5);
            ctx.fillRect(worldX + 15, worldY, 1.5, tileSize);
            
            // Blinking server LEDs
            if ((c * 3 + r * 7) % 13 === 0) {
              ctx.fillStyle = (Math.floor(performance.now() / 300) % 2 === 0) ? "#ef4444" : "#1f2937";
              ctx.fillRect(worldX + 4, worldY + 4, 2, 2);
            } else if ((c * 5 + r * 11) % 17 === 0) {
              ctx.fillStyle = (Math.floor(performance.now() / 400) % 2 === 0) ? "#3b82f6" : "#1f2937";
              ctx.fillRect(worldX + tileSize - 6, worldY + 4, 2, 2);
            }
          } else {
            ctx.fillStyle = "#1e293b"; 
            ctx.fillRect(worldX, worldY, tileSize, tileSize);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(worldX, worldY + 10, tileSize, 1.5);
            ctx.fillRect(worldX, worldY + 20, tileSize, 1.5);
            ctx.fillRect(worldX + 12, worldY, 1.5, 10);
            ctx.fillRect(worldX + 22, worldY + 10, 1.5, 10);
            ctx.fillStyle = "#334155";
            ctx.fillRect(worldX, worldY, tileSize, 2);
          }
          break;

        // Portal types
        case TileType.PORTAL_EAST:
          ctx.fillStyle = "#082f49";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          drawPortalVortex(ctx, worldX, worldY, "#22d3ee", tileSize);
          break;

        case TileType.PORTAL_WEST:
          ctx.fillStyle = "#2e1065";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          drawPortalVortex(ctx, worldX, worldY, "#a78bfa", tileSize);
          break;

        case TileType.PORTAL_NORTH:
          ctx.fillStyle = "#064e3b";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          drawPortalVortex(ctx, worldX, worldY, "#34d399", tileSize);
          break;

        case TileType.PORTAL_SOUTH:
          ctx.fillStyle = "#451a03";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          drawPortalVortex(ctx, worldX, worldY, "#fbbf24", tileSize);
          break;

        case TileType.PORTAL_CENTER:
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(worldX, worldY, tileSize, tileSize);
          drawPortalVortex(ctx, worldX, worldY, "#ffffff", tileSize);
          break;
      }
    }
  }
};

export const drawSpecialTerminals = (ctx: CanvasRenderingContext2D, currentRegion: MapId, playerPos: Player, tileSize: number) => {
  if (currentRegion === "center") {
    drawInteractiveTerminal(ctx, 33, 28, "ATM DEFI", "#f43f5e", tileSize, playerPos);
  } else if (currentRegion === "east") {
    drawInteractiveTerminal(ctx, 30, 30, "FORJA CHAVE", "#22d3ee", tileSize, playerPos);
  } else if (currentRegion === "north") {
    drawInteractiveTerminal(ctx, 30, 30, "ON RAMP PORT", "#34d399", tileSize, playerPos);
  } else if (currentRegion === "west") {
    drawInteractiveTerminal(ctx, 30, 30, "SOROBAN SWAP", "#a78bfa", tileSize, playerPos);
  } else if (currentRegion === "south") {
    drawInteractiveTerminal(ctx, 30, 30, "GOLD ESCROW", "#fbbf24", tileSize, playerPos);
  }
};

export const drawMapDecorations = (
  ctx: CanvasRenderingContext2D,
  currentRegion: MapId,
  leftBound: number,
  rightBound: number,
  topBound: number,
  bottomBound: number,
  tileSize: number
) => {
  getMapDecorations(currentRegion).forEach((dec) => {
    const worldX = dec.x * tileSize;
    const worldY = dec.y * tileSize;

    // View frustum culling
    if (
      worldX < leftBound - tileSize * 2 ||
      worldX > rightBound + tileSize * 2 ||
      worldY < topBound - tileSize * 2 ||
      worldY > bottomBound + tileSize * 2
    ) {
      return; // Skip rendering off-screen decorations
    }

    switch (dec.type) {
      case "flower":
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 16, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 16, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "tree":
        // Tree shadow
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 28, 11, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();
        // Trunk
        ctx.fillStyle = "#78350f";
        ctx.fillRect(worldX + 13, worldY + 16, 6, 12);
        ctx.fillStyle = "#451a03";
        ctx.fillRect(worldX + 13, worldY + 24, 6, 4);
        // Leaves (Bulky green levels)
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#166534";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 12, 11, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(worldX + 12, worldY + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "palm_tree":
        // Shadow
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 28, 11, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();
        // Trunk (curved slightly)
        ctx.fillStyle = "#a16207";
        ctx.beginPath();
        ctx.moveTo(worldX + 14, worldY + 28);
        ctx.bezierCurveTo(worldX + 14, worldY + 14, worldX + 12, worldY + 6, worldX + 16, worldY + 6);
        ctx.bezierCurveTo(worldX + 18, worldY + 6, worldX + 18, worldY + 14, worldX + 18, worldY + 28);
        ctx.fill();
        // Palm Leaves
        ctx.fillStyle = "#15803d";
        const drawLeaf = (angle: number) => {
          ctx.beginPath();
          ctx.ellipse(worldX + 16 + Math.cos(angle)*10, worldY + 6 + Math.sin(angle)*6, 12, 3, angle, 0, Math.PI*2);
          ctx.fill();
        };
        drawLeaf(-Math.PI/6);
        drawLeaf(-Math.PI*5/6);
        drawLeaf(Math.PI/6);
        drawLeaf(Math.PI*5/6);
        drawLeaf(-Math.PI/2);
        ctx.fillStyle = "#16a34a"; // Highlights
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 6, 4, 0, Math.PI*2);
        ctx.fill();
        break;

      case "umbrella":
        // Shadow
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 26, 12, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();
        // Pole
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(worldX + 15, worldY + 12, 2, 16);
        // Canopy
        ctx.fillStyle = dec.color || "#ef4444"; // default red
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 12, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 12, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = dec.color || "#ef4444";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 12, 3, Math.PI, 0);
        ctx.fill();
        break;

      case "towel":
        ctx.fillStyle = dec.color || "#3b82f6";
        ctx.fillRect(worldX + 8, worldY + 12, 16, 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(worldX + 8, worldY + 12, 2, 10);
        ctx.fillRect(worldX + 22, worldY + 12, 2, 10);
        break;

      case "sandcastle":
        ctx.fillStyle = "#facc15";
        ctx.fillRect(worldX + 8, worldY + 18, 16, 10);
        // Towers
        ctx.fillRect(worldX + 6, worldY + 12, 6, 16);
        ctx.fillRect(worldX + 20, worldY + 12, 6, 16);
        // Crenellations
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(worldX + 6, worldY + 10, 2, 2);
        ctx.fillRect(worldX + 10, worldY + 10, 2, 2);
        ctx.fillRect(worldX + 20, worldY + 10, 2, 2);
        ctx.fillRect(worldX + 24, worldY + 10, 2, 2);
        // Door
        ctx.fillStyle = "#ca8a04";
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 28, 3, Math.PI, 0);
        ctx.fill();
        break;

      case "lamp":
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 30, 4, 1.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.fillRect(worldX + 15, worldY + 10, 2, 20);
        ctx.fillStyle = "#475569";
        ctx.fillRect(worldX + 14, worldY + 28, 4, 2);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(worldX + 12, worldY + 4, 8, 6);
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(worldX + 14, worldY + 5, 4, 4);
        
        // Radial glow
        const pulseGlow = 13 + Math.sin(performance.now() / 250) * 2.5;
        const gradient = ctx.createRadialGradient(worldX + 16, worldY + 7, 2, worldX + 16, worldY + 7, pulseGlow);
        gradient.addColorStop(0, "rgba(254, 240, 138, 0.35)");
        gradient.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 7, pulseGlow, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "bench":
        ctx.fillStyle = "#b45309";
        ctx.fillRect(worldX + 4, worldY + 12, 24, 6);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(worldX + 5, worldY + 18, 2, 10);
        ctx.fillRect(worldX + 25, worldY + 18, 2, 10);
        ctx.fillStyle = "#d97706";
        ctx.fillRect(worldX + 2, worldY + 20, 28, 5);
        break;

      case "barrel":
        ctx.fillStyle = "#78350f";
        ctx.fillRect(worldX + 8, worldY + 12, 16, 18);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(worldX + 8, worldY + 16, 16, 1.5);
        ctx.fillRect(worldX + 8, worldY + 24, 16, 1.5);
        break;

      case "box":
        ctx.fillStyle = "#b45309";
        ctx.fillRect(worldX + 6, worldY + 10, 20, 20);
        ctx.strokeStyle = "#7c2d12";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(worldX + 8, worldY + 12, 16, 16);
        break;

      case "boat":
        // Simple top-down boat shape
        ctx.fillStyle = "#8B4513"; // SaddleBrown
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 16, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner part of the boat
        ctx.fillStyle = "#A0522D"; // Sienna
        ctx.beginPath();
        ctx.ellipse(worldX + 16, worldY + 16, 11, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Little wooden seat
        ctx.fillStyle = "#5c3e21"; // Dark brown
        ctx.fillRect(worldX + 14, worldY + 14, 4, 4);
        break;

      case "stand":
        const w = (dec.width || 1) * tileSize;
        // Desk base
        ctx.fillStyle = dec.color || "#0284c7"; // Default blueish or whatever color passed
        ctx.fillRect(worldX + 2, worldY + 16, w - 4, 14);
        // Desk top
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(worldX, worldY + 10, w, 8);
        
        // Laptop on desk
        ctx.fillStyle = "#1e293b"; // Dark gray laptop
        ctx.fillRect(worldX + (w / 2) - 8, worldY + 12, 10, 6);
        ctx.fillStyle = "#38bdf8"; // Screen glow
        ctx.fillRect(worldX + (w / 2) - 6, worldY + 13, 6, 4);

        // Giant glowing sign on top
        if (dec.text) {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          // shadow
          ctx.fillRect(worldX + 4, worldY - 22, w - 8, 22);

          // border/box
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(worldX + 2, worldY - 24, w - 4, 22);
          ctx.strokeStyle = dec.color || "#0284c7";
          ctx.lineWidth = 2;
          ctx.strokeRect(worldX + 2, worldY - 24, w - 4, 22);

          // text
          ctx.fillStyle = dec.color || "#38bdf8";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // shadow text
          ctx.fillText(dec.text, worldX + (w / 2), worldY - 13);
          
          ctx.fillStyle = "#ffffff";
          ctx.fillText(dec.text, worldX + (w / 2) - 1, worldY - 14);
          
          // structural poles connecting sign to desk
          ctx.fillStyle = "#475569";
          ctx.fillRect(worldX + 6, worldY - 2, 3, 12);
          ctx.fillRect(worldX + w - 9, worldY - 2, 3, 12);
        }
        break;
    }
  });
};
