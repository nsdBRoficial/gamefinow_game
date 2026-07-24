import { TileType, GameDecoration } from "../../gameData";
import { getMapDecorations, MapId } from "../../maps";
import { Player } from "../../types";

export const drawPixelShop = (
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  dec: GameDecoration,
  tileSize: number
) => {
  const w = (dec.width || 3) * tileSize;
  const h = (dec.height || 2) * tileSize;

  // 1. Shadow underneath shop
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(worldX + 4, worldY + h - 2, w - 8, 4);

  // 2. Main Building Front (Parede bege/pastel inspirada na Referencia 1)
  const wallY = worldY + 12;
  const wallH = h - 12;
  ctx.fillStyle = "#f5e6d3"; // Soft pastel beige
  ctx.fillRect(worldX, wallY, w, wallH);

  // Dark border outline
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 2;
  ctx.strokeRect(worldX, wallY, w, wallH);

  // Wooden base footer
  ctx.fillStyle = "#a16207";
  ctx.fillRect(worldX, worldY + h - 6, w, 6);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(worldX, worldY + h - 2, w, 2);

  // 3. Shop Windows & Door
  // Door on left side
  const doorW = 16;
  const doorH = 28;
  const doorX = worldX + 12;
  const doorY = worldY + h - doorH - 4;

  ctx.fillStyle = "#7c2d12"; // Wood frame
  ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
  ctx.fillStyle = "#38bdf8"; // Glass window on door
  ctx.fillRect(doorX, doorY, doorW, doorH - 8);
  ctx.fillStyle = "#9a3412"; // Wood panel lower door
  ctx.fillRect(doorX, doorY + doorH - 8, doorW, 8);
  // Door handle
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(doorX + doorW - 4, doorY + doorH - 12, 2, 3);

  // 4-Pane Showcase Window on right side
  const winW = 28;
  const winH = 22;
  const winX = worldX + w - winW - 12;
  const winY = worldY + h - winH - 10;

  ctx.fillStyle = "#451a03"; // Window frame
  ctx.fillRect(winX - 2, winY - 2, winW + 4, winH + 4);
  ctx.fillStyle = "#38bdf8"; // Light sky blue glass
  ctx.fillRect(winX, winY, winW, winH);

  // Window Panes Grid
  ctx.fillStyle = "#451a03";
  ctx.fillRect(winX + winW / 2 - 1, winY, 2, winH); // Vertical divider
  ctx.fillRect(winX, winY + winH / 2 - 1, winW, 2); // Horizontal divider

  // Pixel glass glint/reflection
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillRect(winX + 2, winY + 2, 4, 4);
  ctx.fillRect(winX + winW / 2 + 3, winY + 2, 4, 4);

  // 4. Retro Striped Awning (Toldo listrado vermelho e branco)
  const awningY = worldY + 8;
  const awningH = 18;
  const stripeW = 8;
  const totalStripes = Math.ceil(w / stripeW);

  for (let i = 0; i < totalStripes; i++) {
    const sx = worldX + i * stripeW;
    const isRed = i % 2 === 0;
    ctx.fillStyle = isRed ? "#dc2626" : "#f8fafc";
    ctx.fillRect(sx, awningY, Math.min(stripeW, worldX + w - sx), awningH);

    // Scalloped bottom wave on awning
    ctx.fillStyle = isRed ? "#991b1b" : "#e2e8f0";
    ctx.fillRect(sx, awningY + awningH - 3, Math.min(stripeW, worldX + w - sx), 3);
  }

  // Awning top shadow line
  ctx.fillStyle = "#451a03";
  ctx.fillRect(worldX, awningY - 2, w, 2);

  // 5. Top Wooden Sign ("SHOP" ou "STORE" - Referencia 1)
  const signW = Math.min(w - 12, 64);
  const signH = 18;
  const signX = worldX + (w - signW) / 2;
  const signY = worldY - 14;

  // Wooden posts holding top sign
  ctx.fillStyle = "#78350f";
  ctx.fillRect(signX + 6, signY + signH, 4, awningY - (signY + signH));
  ctx.fillRect(signX + signW - 10, signY + signH, 4, awningY - (signY + signH));

  // Red signboard background
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(signX, signY, signW, signH);
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 2;
  ctx.strokeRect(signX, signY, signW, signH);
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(signX, signY + signH - 3, signW, 3);

  // Pixel Art Text "SHOP" / "STORE"
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dec.text || "STORE", signX + signW / 2, signY + signH / 2 - 1);

  // 6. Subtext Badge (Tipo de loja: "P2P STORE", "OUTFIT STORE", etc.)
  if (dec.subText) {
    const badgeW = 76;
    const badgeH = 12;
    const badgeX = worldX + (w - badgeW) / 2;
    const badgeY = awningY + awningH + 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 7px font-mono uppercase tracking-wider";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dec.subText, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }
};

export const drawPixelBurnBrazier = (
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  dec: GameDecoration,
  tileSize: number
) => {
  const w = (dec.width || 2) * tileSize;
  const h = (dec.height || 2) * tileSize;
  const cx = worldX + w / 2;
  const cy = worldY + h / 2;

  // 1. Ambient Radial Flame Glow on Floor
  const pulseGlow = 22 + Math.sin(performance.now() / 150) * 4;
  const glowGrad = ctx.createRadialGradient(cx, cy + 4, 4, cx, cy + 4, pulseGlow);
  glowGrad.addColorStop(0, "rgba(249, 115, 22, 0.35)");
  glowGrad.addColorStop(0.6, "rgba(239, 68, 68, 0.15)");
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 4, pulseGlow, 0, Math.PI * 2);
  ctx.fill();

  // 2. Pedestal Base & Dark Iron Torch Stand (Referencia 2)
  // Stone Floor Base
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(cx - 16, cy + 12, 32, 10);
  ctx.strokeStyle = "#44403c";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 16, cy + 12, 32, 10);

  // Central Vertical Iron Shaft
  ctx.fillStyle = "#262626";
  ctx.fillRect(cx - 5, cy - 8, 10, 22);
  ctx.fillStyle = "#404040";
  ctx.fillRect(cx - 3, cy - 8, 2, 22); // Highlight line

  // Brazier Bowl / Cup Top
  ctx.fillStyle = "#171717";
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 8);
  ctx.lineTo(cx + 14, cy - 8);
  ctx.lineTo(cx + 8, cy + 2);
  ctx.lineTo(cx - 8, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#525252";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Iron Rim top lip
  ctx.fillStyle = "#404040";
  ctx.fillRect(cx - 15, cy - 10, 30, 3);

  // 3. Pixel Flame Animation (Multicamadas - Red, Orange, Yellow)
  const flameTime = performance.now() / 110;
  const flameHeight = 18 + Math.sin(flameTime) * 3;

  // Outer Flame Layer (Crimson Red #ef4444)
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy - 9);
  ctx.quadraticCurveTo(cx - 13, cy - 9 - flameHeight * 0.6, cx - 2 + Math.sin(flameTime * 1.3) * 3, cy - 9 - flameHeight);
  ctx.quadraticCurveTo(cx + 13, cy - 9 - flameHeight * 0.6, cx + 11, cy - 9);
  ctx.closePath();
  ctx.fill();

  // Mid Flame Layer (Vivid Orange #f97316)
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 9);
  ctx.quadraticCurveTo(cx - 9, cy - 9 - flameHeight * 0.5, cx + Math.cos(flameTime * 1.5) * 2, cy - 9 - flameHeight * 0.85);
  ctx.quadraticCurveTo(cx + 9, cy - 9 - flameHeight * 0.5, cx + 8, cy - 9);
  ctx.closePath();
  ctx.fill();

  // Inner Core Flame Layer (Bright Sun Yellow #fef08a)
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(cx, cy - 11, 5 + Math.sin(flameTime * 2) * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Floating Pixel Sparks
  ctx.fillStyle = "#fef08a";
  const sparkY1 = cy - 20 - ((performance.now() / 8) % 16);
  const sparkY2 = cy - 24 - ((performance.now() / 12) % 20);
  ctx.fillRect(cx - 4 + Math.sin(flameTime) * 4, sparkY1, 2, 2);
  ctx.fillRect(cx + 3 + Math.cos(flameTime) * 5, sparkY2, 1.5, 1.5);
};

export const drawPixelFaucet = (
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  dec: GameDecoration,
  tileSize: number
) => {
  const w = (dec.width || 1) * tileSize;
  const h = (dec.height || 2) * tileSize;
  const cx = worldX + w / 2;
  const time = performance.now();

  // 1. Soft Radial Glow under the fountain (magic water aura)
  const pulseGlow = 18 + Math.sin(time / 300) * 3;
  const gradient = ctx.createRadialGradient(cx, worldY + h - 8, 2, cx, worldY + h - 8, pulseGlow);
  gradient.addColorStop(0, "rgba(56, 189, 248, 0.35)");
  gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, worldY + h - 8, pulseGlow, 0, Math.PI * 2);
  ctx.fill();

  // 2. Base Pedestal (Marble Base at y: h - 14 to h - 2)
  ctx.fillStyle = "#334155"; // Dark border outline
  ctx.fillRect(cx - 10, worldY + h - 14, 20, 12);

  ctx.fillStyle = "#cbd5e1"; // Light slate marble
  ctx.fillRect(cx - 8, worldY + h - 12, 16, 10);
  ctx.fillStyle = "#94a3b8"; // Midtone marble shadow
  ctx.fillRect(cx + 1, worldY + h - 12, 7, 10);

  // Pedestal Column Lines
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx - 6, worldY + h - 10, 2, 6);
  ctx.fillRect(cx - 2, worldY + h - 10, 2, 6);
  ctx.fillRect(cx + 2, worldY + h - 10, 2, 6);

  // 3. Middle Basin Tier (Marble Bowl at y: h - 34 to h - 14)
  const bowlY = worldY + h - 34;

  // Bowl Rim / Body Outline
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(cx, bowlY + 8, 15, 0, Math.PI);
  ctx.fill();

  // Marble Bowl Rim
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(cx, bowlY + 6, 14, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(cx - 14, bowlY + 4, 28, 4);

  // Water inside main basin
  ctx.fillStyle = "#0284c7"; // Deep blue water
  ctx.fillRect(cx - 12, bowlY + 5, 24, 6);
  ctx.fillStyle = "#38bdf8"; // Light water surface
  ctx.fillRect(cx - 12, bowlY + 5, 24, 2);

  // Animated Water Ripples in Basin
  const rippleOffset = Math.sin(time / 200) * 3;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(cx - 8 + rippleOffset, bowlY + 6, 6, 1);
  ctx.fillRect(cx + 2 - rippleOffset, bowlY + 8, 5, 1);

  // 4. Upper Spout & Spire (Marble Spout Tier at y: h - 54 to h - 34)
  const spoutY = worldY + h - 54;

  // Upper Pillar Support
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(cx - 4, spoutY + 8, 8, 14);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(cx, spoutY + 8, 4, 14);

  // Upper Mini Basin Cup
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(cx - 8, spoutY + 6, 16, 4);
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(cx - 6, spoutY + 6, 12, 2);

  // Top Fountain Ornament (Trident / Crown Spout Tip)
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(cx - 2, spoutY - 2, 4, 8);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(cx - 1, spoutY - 4, 2, 4);

  // 5. ANIMATED WATERFALL & JET SPRINGS
  const jetWave = Math.sin(time / 150) * 2;
  
  // Center Jet Stream
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(cx - 1.5, spoutY - 8 + jetWave, 3, 10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 0.5, spoutY - 8 + jetWave, 1, 8);

  // Left & Right Cascading Water Streams (Falling into lower basin)
  const streamDrop = (Math.floor(time / 80) % 10);

  // Left Water Stream
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(cx - 7, spoutY + 8, 2, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 7, spoutY + 8 + (streamDrop % 10), 2, 3);

  // Right Water Stream
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(cx + 5, spoutY + 8, 2, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx + 5, spoutY + 8 + ((streamDrop + 5) % 10), 2, 3);

  // Bottom Spill Streams into main bowl
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(cx - 11, bowlY + 4, 3, 12);
  ctx.fillRect(cx + 8, bowlY + 4, 3, 12);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 11, bowlY + 4 + ((streamDrop + 3) % 8), 3, 2);
  ctx.fillRect(cx + 8, bowlY + 4 + ((streamDrop + 7) % 8), 3, 2);

  // 6. Floating Magic Water Sparkles / Droplets
  const sparkTime = time / 400;
  for (let i = 0; i < 4; i++) {
    const angle = sparkTime + (i * Math.PI) / 2;
    const px = cx + Math.cos(angle) * (10 + (i % 2) * 4);
    const py = spoutY + Math.sin(angle * 1.5) * 6 - 2;
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#7dd3fc";
    ctx.fillRect(px, py, 1.5, 1.5);
  }
};

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

/**
 * Renderiza os Terminais Magnéticos das Missões (Altar Obelisco de Pedra 1 sqm no chão, 2 sqms de altura vertical)
 * com Cristal Levitante Reluzente em Pixel Art inspirado fielmente na imagem de referência.
 */
export const drawInteractiveTerminal = (
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  title: string,
  themeColor: string,
  tileSize: number,
  playerPos: Player
) => {
  const worldX = gridX * tileSize;
  const worldY = gridY * tileSize;
  const cx = worldX + tileSize / 2;
  const cy = worldY + tileSize / 2;

  const time = performance.now();

  // Distância do jogador para iluminação tátil
  const playerWorldX = playerPos.x * tileSize + tileSize / 2;
  const playerWorldY = playerPos.y * tileSize + tileSize / 2;
  const dist = Math.hypot(playerWorldX - cx, playerWorldY - cy);
  const isNear = dist < tileSize * 2.5;

  // Paleta de cores dinâmica do cristal por tema
  let mainColor = themeColor;
  let lightColor = "#ffffff";
  let shadowColor = "#1e1b4b";
  let glowColor = "rgba(167, 139, 250, 0.4)";

  if (themeColor.includes("06b6d4") || themeColor.includes("22d3ee") || themeColor.includes("cyan")) {
    // Leste / Forja (Safira Ciano)
    mainColor = "#06b6d4";
    lightColor = "#cffafe";
    shadowColor = "#083344";
    glowColor = "rgba(6, 182, 212, 0.45)";
  } else if (themeColor.includes("10b981") || themeColor.includes("34d399") || themeColor.includes("green")) {
    // Norte / OnRamp (Esmeralda Verde)
    mainColor = "#10b981";
    lightColor = "#d1fae5";
    shadowColor = "#064e3b";
    glowColor = "rgba(16, 185, 129, 0.45)";
  } else if (themeColor.includes("9333ea") || themeColor.includes("a78bfa") || themeColor.includes("purple")) {
    // Oeste / Soroban (Ametista Roxo/Magenta - Fiel à Referência)
    mainColor = "#9333ea";
    lightColor = "#f3e8ff";
    shadowColor = "#3b0764";
    glowColor = "rgba(147, 51, 234, 0.45)";
  } else if (themeColor.includes("eab308") || themeColor.includes("fbbf24") || themeColor.includes("gold")) {
    // Sul / Hold (Topázio Dourado)
    mainColor = "#eab308";
    lightColor = "#fef9c3";
    shadowColor = "#451a03";
    glowColor = "rgba(234, 179, 8, 0.45)";
  }

  ctx.save();

  // ── 1. Sombra Projetada sob o Pedestal (1 sqm) ──
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 2. Aura de Brilho Radial no Chão ──
  const pulseRadius = (isNear ? 24 : 18) + Math.sin(time / 200) * 3;
  const glowGrad = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy + 4, pulseRadius);
  glowGrad.addColorStop(0, glowColor);
  glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 4, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  // ── 3. Obelisco de Pedra Vertical (1 sqm de base x 2 sqms de elevação vertical Y) ──
  // Degrau inferior de pedra
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(cx - 15, cy + 4, 30, 10);
  ctx.strokeStyle = "#44403c";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 15, cy + 4, 30, 10);

  // Pilar de pedra esculpida (Coluna alta subindo verticalmente)
  ctx.fillStyle = "#292524";
  ctx.fillRect(cx - 12, cy - 16, 24, 20);
  ctx.fillStyle = "#44403c";
  ctx.fillRect(cx - 12, cy - 16, 4, 20); // Highlight esquerdo
  ctx.fillRect(cx + 8, cy - 16, 4, 20); // Sombra direita

  // Cantoneiras e ferragens rústicas
  ctx.fillStyle = "#78350f";
  ctx.fillRect(cx - 13, cy - 14, 3, 20);
  ctx.fillRect(cx + 10, cy - 14, 3, 20);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(cx - 13, cy + 4, 3, 3);
  ctx.fillRect(cx + 10, cy + 4, 3, 3);

  // Coroa / Ameia no topo do Obelisco
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(cx - 14, cy - 20, 28, 5);
  ctx.fillStyle = "#57534e";
  ctx.fillRect(cx - 14, cy - 20, 28, 1.5);

  // Abertura central do Altar
  ctx.fillStyle = shadowColor;
  ctx.fillRect(cx - 9, cy - 20, 18, 3);

  // ── 4. Cristal de Energia Levitante em Pixel Art (Igual à Referência!) ──
  const crystalLevitate = Math.sin(time / 180) * 4; // Animação de flutuação
  const crystalY = cy - 32 + crystalLevitate;

  // Sombra do cristal no topo da pedra
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 19, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Desenho Lapidado do Cristal (Fiel à Imagem de Referência)
  // Faceta Principal (Corpo do Cristal)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx, crystalY - 16); // Ponta superior
  ctx.lineTo(cx + 9, crystalY - 2); // Canto direito
  ctx.lineTo(cx, crystalY + 9); // Ponta inferior
  ctx.lineTo(cx - 9, crystalY - 2); // Canto esquerdo
  ctx.closePath();
  ctx.fill();

  // Faceta Lateral Esquerda (Luz Reluzente)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.moveTo(cx, crystalY - 16);
  ctx.lineTo(cx - 9, crystalY - 2);
  ctx.lineTo(cx, crystalY + 9);
  ctx.closePath();
  ctx.fill();

  // Faceta Lateral Direita (Sombra Criptográfica)
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(cx, crystalY - 16);
  ctx.lineTo(cx + 4, crystalY - 2);
  ctx.lineTo(cx, crystalY + 9);
  ctx.closePath();
  ctx.fill();

  // Ponto reluzente central
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 2, crystalY - 7, 2, 4);

  // ── 5. Partículas Mágicas Flutuando em Volta do Cristal ──
  const sparkTime = time / 100;
  ctx.fillStyle = lightColor;
  for (let i = 0; i < 3; i++) {
    const sparkAngle = sparkTime * 0.8 + (i * Math.PI * 2) / 3;
    const sparkR = 11 + Math.sin(sparkTime + i) * 3;
    const sx = cx + Math.cos(sparkAngle) * sparkR;
    const sy = crystalY - 3 + Math.sin(sparkAngle * 1.5) * 6;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // ── 6. Pequeno Indicador Neon quando o Jogador Aproxima ──
  if (isNear) {
    const pulseAlpha = 0.85 + Math.sin(time / 150) * 0.15;
    ctx.font = "bold 8px 'JetBrains Mono', monospace";
    const tagText = "ESPAÇO";
    const tagW = ctx.measureText(tagText).width + 8;

    ctx.fillStyle = `rgba(15, 23, 42, ${pulseAlpha})`;
    ctx.fillRect(cx - tagW / 2, crystalY - 26, tagW, 11);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - tagW / 2, crystalY - 26, tagW, 11);

    ctx.fillStyle = lightColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, cx, crystalY - 21);
  }

  ctx.restore();
};

/**
 * Restaurado o Banco DeFi ATM Tradicional na Praça Central
 */
export const drawClassicAtm = (ctx: CanvasRenderingContext2D, gridX: number, gridY: number, tileSize: number, playerPos: Player) => {
  const wx = gridX * tileSize;
  const wy = gridY * tileSize;

  ctx.save();
  // Base e corpo do Caixa Eletrônico
  ctx.fillStyle = "#94a3b8"; // Slate gray
  ctx.fillRect(wx + 4, wy + 2, 24, 30);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(wx + 6, wy + 4, 20, 28);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(wx + 4, wy + 2, 24, 30);

  // Tela Verde Câmbio
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(wx + 8, wy + 8, 16, 10);
  ctx.fillStyle = "#10b981";
  ctx.fillRect(wx + 9, wy + 9, 14, 8);

  // Leitor de Cartão e Teclado
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(wx + 20, wy + 20, 6, 2);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(wx + 8, wy + 20, 10, 6);

  // Placa "ATM DEFI"
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(wx + 4, wy - 8, 24, 8);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(wx + 4, wy - 8, 24, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 6px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ATM DeFi", wx + 16, wy - 4);

  ctx.restore();
};

/**
 * Restaurado o Cyberpunk ATM original na Ilha Oeste
 */
export const drawCyberpunkAtm = (
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tileSize: number,
  playerPos: Player
) => {
  const wx = tx * tileSize;
  const wy = ty * tileSize;

  ctx.save();

  // Holographic projection base
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(wx + 16, wy + 28, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Floating Cyber Body
  const floatY = Math.sin(performance.now() / 200) * 2;

  ctx.fillStyle = "#1e1b4b"; // Deep violet
  ctx.fillRect(wx + 6, wy + 4 + floatY, 20, 20);
  ctx.strokeStyle = "#d946ef"; // Fuchsia neon outline
  ctx.lineWidth = 1.5;
  ctx.strokeRect(wx + 6, wy + 4 + floatY, 20, 20);

  // Cyber Screen
  ctx.fillStyle = "#000000";
  ctx.fillRect(wx + 8, wy + 6 + floatY, 16, 10);

  // Glitching text/data stream on screen
  ctx.fillStyle = "#22d3ee"; // Cyan
  if (Math.random() > 0.1) {
    ctx.fillRect(wx + 10, wy + 8 + floatY, 12, 1);
    ctx.fillRect(wx + 10, wy + 11 + floatY, 8, 1);
    ctx.fillRect(wx + 10, wy + 14 + floatY, 10, 1);
  }

  // Neon cables
  ctx.strokeStyle = "#06b6d4";
  ctx.beginPath();
  ctx.moveTo(wx + 10, wy + 24 + floatY);
  ctx.lineTo(wx + 14, wy + 28);
  ctx.stroke();

  ctx.strokeStyle = "#ec4899";
  ctx.beginPath();
  ctx.moveTo(wx + 22, wy + 24 + floatY);
  ctx.lineTo(wx + 18, wy + 28);
  ctx.stroke();

  // Floating Holographic Sign
  ctx.fillStyle = "rgba(217, 70, 239, 0.8)";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CYBER ATM", wx + 16, wy - 2 + floatY);

  // Prompt if player is adjacent
  const dx = Math.abs(playerPos.x - tx);
  const dy = Math.abs(playerPos.y - ty);
  if (dx <= 1 && dy <= 1) {
    const cx = wx + tileSize / 2;
    const cy = wy - 12 + floatY;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(cx - 30, cy - 8, 60, 14);
    ctx.strokeStyle = "#d946ef";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 30, cy - 8, 60, 14);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("USAR [ESPAÇO]", cx, cy - 1);
  }

  ctx.restore();
};

export const drawSpecialTerminals = (ctx: CanvasRenderingContext2D, currentRegion: MapId, playerPos: Player, tileSize: number) => {
  if (currentRegion === "center") {
    drawClassicAtm(ctx, 33, 28, tileSize, playerPos);
  } else if (currentRegion === "east") {
    drawInteractiveTerminal(ctx, 35, 28, "ALTAR DA WALLET", "#06b6d4", tileSize, playerPos);
  } else if (currentRegion === "north") {
    drawInteractiveTerminal(ctx, 31, 24, "ALTAR DO ON-RAMP", "#10b981", tileSize, playerPos);
  } else if (currentRegion === "west") {
    drawInteractiveTerminal(ctx, 31, 27, "ALTAR DE SOROBAN", "#9333ea", tileSize, playerPos);
    drawCyberpunkAtm(ctx, 47, 28, tileSize, playerPos);
  } else if (currentRegion === "south") {
    drawInteractiveTerminal(ctx, 33, 24, "ALTAR DO VIP HOLD", "#eab308", tileSize, playerPos);
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

      case "p2p_store":
      case "pixel_shop":
        drawPixelShop(ctx, worldX, worldY, dec, tileSize);
        break;

      case "burn_altar":
      case "pixel_burn_brazier":
        drawPixelBurnBrazier(ctx, worldX, worldY, dec, tileSize);
        break;

      case "pixel_faucet":
        drawPixelFaucet(ctx, worldX, worldY, dec, tileSize);
        break;
    }
  });
};
