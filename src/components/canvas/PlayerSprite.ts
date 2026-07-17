import { Player } from "../../types";

export interface PixelCharData {
  skinColor: string;
  headColor: string;
  headType: string;
  torsoColor: string;
  torsoType: string;
  legsColor: string;
  shoesColor: string;
  faceType: string;
  accessoryType: string;
  hairColor?: string;
}

export const getNPCPixelChar = (id: string): PixelCharData => {
  switch (id) {
    case "guide": // Frank, o Sacerdote do Templo
      return {
        skinColor: "#ffe4e6", // Pale elder priest skin
        headColor: "#1d4ed8", // Wizard blue hood
        headType: "beanie",   // Pointer hat style
        torsoColor: "#1e3a8a", // Deep blue robes
        torsoType: "suit",    // Custom magical collar
        legsColor: "#1e3a8a",
        shoesColor: "#1e293b",
        faceType: "beard",    // Elder white beard
        accessoryType: "cape", // Celestial cape
        hairColor: "#f8fafc", // White hair
      };
    case "keymaster": // Kael, o Ferreiro de Raros
      return {
        skinColor: "#ffdbac",
        headColor: "#ea580c",
        headType: "horns",    // Elf pointed ears style
        torsoColor: "#166534", // Dwarven green smithing armor
        torsoType: "striped",
        legsColor: "#3f6212",
        shoesColor: "#78350f",
        faceType: "none",
        accessoryType: "sword", // Wielding blacksmith hammer / sword
        hairColor: "#f59e0b", // Elven golden-blonde hair
      };
    case "portmaster": // Capitão HC, Guardião do Porto
      return {
        skinColor: "#e0a96d",
        headColor: "#020617", // Navy officer hat
        headType: "beanie",
        torsoColor: "#0f172a", // Navy blue captain coat
        torsoType: "classic",
        legsColor: "#1e293b",
        shoesColor: "#020617",
        faceType: "beard",
        accessoryType: "backpack",
        hairColor: "#451a03",
      };
    case "scholar": // Alquimista de Soroban
      return {
        skinColor: "#fce7f3", // Pale magical pink skin
        headColor: "#ec4899", // Magical hair color
        headType: "square",
        torsoColor: "#6b21a8", // Alchemist violet gown
        torsoType: "striped",
        legsColor: "#4c1d95",
        shoesColor: "#1e1b4b",
        faceType: "glasses",  // Smart scholar glasses
        accessoryType: "none",
        hairColor: "#ec4899",
      };
    case "sage": // Bobba, o Sábio do Deserto
      return {
        skinColor: "#ca8a04", // Sun-tanned desert skin
        headColor: "#fbbf24", // Golden crown / pharaoh hat
        headType: "square",
        torsoColor: "#78350f", // Earthy desert brown garments
        torsoType: "suit",
        legsColor: "#ca8a04",
        shoesColor: "#451a03",
        faceType: "beard",    // Wise grey beard
        accessoryType: "none",
        hairColor: "#94a3b8",
      };
    default:
      return {
        skinColor: "#ffdbac",
        headColor: "#3b82f6",
        headType: "square",
        torsoColor: "#ef4444",
        torsoType: "classic",
        legsColor: "#3b82f6",
        shoesColor: "#1e293b",
        faceType: "none",
        accessoryType: "none",
      };
  }
};

export const drawPixelCharacter = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  char: PixelCharData,
  isMoving: boolean,
  frame: number,
  direction: "down" | "up" | "left" | "right",
  showCrown: boolean = false
) => {
  ctx.save();

  // 1. Pixel shadow
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy + 30, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fill();

  // Bobbing / swing offsets
  let walkBob = 0;
  let leftLegYOffset = 0;
  let rightLegYOffset = 0;
  let leftArmYOffset = 0;
  let rightArmYOffset = 0;

  if (isMoving) {
    walkBob = Math.sin(frame * Math.PI * 2) > 0 ? 1 : 0;
    const legSwing = Math.sin(frame * Math.PI * 2);
    leftLegYOffset = legSwing > 0 ? -1.5 : 0;
    rightLegYOffset = legSwing < 0 ? -1.5 : 0;
    leftArmYOffset = legSwing < 0 ? -0.5 : 0.5;
    rightArmYOffset = legSwing > 0 ? -0.5 : 0.5;
  }

  const drawPixelRect = (rx: number, ry: number, rw: number, rh: number, fill: string, stroke: string = "#000000") => {
    ctx.fillStyle = fill;
    ctx.fillRect(rx, ry, rw, rh);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  };

  // Back accessories (Cape or Backpack) if not facing up (drawn behind)
  if (direction !== "up") {
    if (char.accessoryType === "cape") {
      drawPixelRect(cx + 6, cy + 13 + walkBob, 20, 11, char.headColor);
    } else if (char.accessoryType === "backpack") {
      drawPixelRect(cx + 8, cy + 12 + walkBob, 16, 9, "#78350f");
    }
  }

  // 2. Legs & Shoes (with outlines)
  // Left leg
  drawPixelRect(cx + 8, cy + 22 + leftLegYOffset, 4, 6, char.legsColor || "#3b82f6");
  drawPixelRect(cx + 6, cy + 27 + leftLegYOffset, 6, 3, char.shoesColor || "#1e293b");

  // Right leg
  drawPixelRect(cx + 20, cy + 22 + rightLegYOffset, 4, 6, char.legsColor || "#3b82f6");
  drawPixelRect(cx + 20, cy + 27 + rightLegYOffset, 6, 3, char.shoesColor || "#1e293b");

  // 3. Torso / Arms
  // Left Arm
  const leftArmX = cx + 4;
  const leftArmY = cy + 12 + walkBob + leftArmYOffset;
  drawPixelRect(leftArmX, leftArmY, 4, 7, char.torsoColor || "#ef4444");
  drawPixelRect(leftArmX, leftArmY + 7, 4, 3, char.skinColor || "#ffdbac");

  // Torso Main
  const torsoY = cy + 12 + walkBob;
  drawPixelRect(cx + 8, torsoY, 16, 10, char.torsoColor || "#ef4444");

  // Torso texture details
  if (direction === "up") {
    // Back of the torso details
    if (char.torsoType === "striped") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(cx + 9, torsoY + 2, 14, 2);
      ctx.fillRect(cx + 9, torsoY + 6, 14, 2);
    } else if (char.torsoType === "hoodie") {
      // Render a cool hood on the back of the hoodie
      drawPixelRect(cx + 10, torsoY + 1, 12, 6, "rgba(0, 0, 0, 0.2)");
    }
    // Back accessories drawn ON TOP of the torso because we are looking at their back
    if (char.accessoryType === "cape") {
      drawPixelRect(cx + 6, torsoY + 1, 20, 10, char.headColor);
    } else if (char.accessoryType === "backpack") {
      // Draw the backpack
      drawPixelRect(cx + 8, torsoY + 1, 16, 9, "#78350f");
      // Draw backpack straps over shoulders
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(cx + 10, torsoY, 2, 2);
      ctx.fillRect(cx + 20, torsoY, 2, 2);
    }
  } else {
    // Front details
    if (char.torsoType === "striped") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(cx + 9, torsoY + 2, 14, 2);
      ctx.fillRect(cx + 9, torsoY + 6, 14, 2);
    } else if (char.torsoType === "suit") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 15, torsoY, 2, 3);
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(cx + 15, torsoY + 3, 2, 4);
    } else if (char.torsoType === "hoodie") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(cx + 11, torsoY + 5, 10, 4);
    }
  }

  // Right Arm (Weapon holding / Regular)
  const rightArmX = cx + 24;
  const rightArmY = cy + 12 + walkBob + rightArmYOffset;

  if (char.accessoryType === "sword" && direction !== "up") {
    // Raised sword pose!
    drawPixelRect(rightArmX, rightArmY - 4, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(rightArmX, rightArmY - 7, 4, 3, char.skinColor || "#ffdbac");
    
    // Sword details
    drawPixelRect(rightArmX - 4, rightArmY - 10, 12, 2, "#d97706"); // Guard
    drawPixelRect(rightArmX, rightArmY - 24, 4, 14, "#f1f5f9", "#475569"); // Blade
    drawPixelRect(rightArmX + 1, rightArmY - 6, 2, 4, "#78350f"); // Handle
  } else {
    drawPixelRect(rightArmX, rightArmY, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(rightArmX, rightArmY + 7, 4, 3, char.skinColor || "#ffdbac");
  }

  // 4. Head & Face
  const headY = cy + 2 + walkBob;
  const hairCol = char.hairColor || char.headColor || "#78350f";
  const headFill = (direction === "up" && char.headType !== "helmet") ? hairCol : (char.skinColor || "#ffdbac");
  drawPixelRect(cx + 8, headY, 16, 11, headFill);

  // Hats and Hair
  if (char.headType === "square") {
    drawPixelRect(cx + 7, headY - 3, 18, 4, hairCol); // Hair top
    drawPixelRect(cx + 7, headY + 1, 3, 6, hairCol);   // Left side
    drawPixelRect(cx + 22, headY + 1, 3, 6, hairCol);  // Right side
  } else if (char.headType === "beanie") {
    if (char.headColor === "#1d4ed8") {
      // High pointy magical wizard hat!
      ctx.fillStyle = char.headColor;
      ctx.beginPath();
      ctx.moveTo(cx + 5, headY + 1);
      ctx.lineTo(cx + 16, headY - 8);
      ctx.lineTo(cx + 27, headY + 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      // Star on tip
      drawPixelRect(cx + 14, headY - 11, 4, 3, "#fbbf24");
    } else {
      const capCol = char.headColor || "#dc2626";
      drawPixelRect(cx + 7, headY - 4, 18, 5, capCol);
      drawPixelRect(cx + 14, headY - 7, 4, 3, "#ffffff"); // Pom-pom
    }
  } else if (char.headType === "helmet") {
    const helmCol = char.headColor || "#64748b";
    drawPixelRect(cx + 7, headY - 3, 18, 14, helmCol);
    if (direction !== "up") {
      drawPixelRect(cx + 10, headY + 3, 12, 3, "#38bdf8", "#0f172a"); // Visor glow
    }
    drawPixelRect(cx + 14, headY - 6, 4, 3, "#dc2626"); // Plume
  } else if (char.headType === "horns") {
    drawPixelRect(cx + 7, headY - 2, 18, 3, hairCol);
    if (char.skinColor === "#ffdbac" && char.hairColor === "#f59e0b") {
      // Pointed Elven Ears!
      drawPixelRect(cx + 4, headY + 2, 4, 2, char.skinColor);
      drawPixelRect(cx + 24, headY + 2, 4, 2, char.skinColor);
    } else {
      // Devil horns
      drawPixelRect(cx + 5, headY - 4, 3, 4, char.headColor || "#dc2626");
      drawPixelRect(cx + 24, headY - 4, 3, 4, char.headColor || "#dc2626");
    }
  }

  // Face details if not helmet
  if (char.headType !== "helmet" && direction !== "up") {
    let pupilShiftX = 0;
    if (direction === "left") pupilShiftX = -1;
    else if (direction === "right") pupilShiftX = 1;

    // Left eye
    drawPixelRect(cx + 10, headY + 3, 3, 3, "#ffffff", "");
    drawPixelRect(cx + 11 + pupilShiftX, headY + 4, 1.5, 1.5, "#000000", "");

    // Right eye
    drawPixelRect(cx + 18, headY + 3, 3, 3, "#ffffff", "");
    drawPixelRect(cx + 18.5 + pupilShiftX, headY + 4, 1.5, 1.5, "#000000", "");

    // Custom face traits
    if (char.faceType === "glasses") {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx + 9, headY + 2.5, 5, 4);
      ctx.strokeRect(cx + 17, headY + 2.5, 5, 4);
      ctx.beginPath();
      ctx.moveTo(cx + 14, headY + 4.5);
      ctx.lineTo(cx + 17, headY + 4.5);
      ctx.stroke();
    } else if (char.faceType === "beard") {
      const beardCol = char.hairColor || "#78350f";
      drawPixelRect(cx + 8, headY + 7, 16, 4, beardCol);
      ctx.fillStyle = char.skinColor;
      ctx.fillRect(cx + 14, headY + 8, 4, 1.5); // Mouth cutout
    } else if (char.faceType === "eyepatch") {
      drawPixelRect(cx + 10, headY + 2.5, 3.5, 3.5, "#111111", "");
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 8, headY + 1.5);
      ctx.lineTo(cx + 23, headY + 5.5);
      ctx.stroke();
    } else if (char.faceType === "smile") {
      ctx.fillStyle = "rgba(244, 63, 94, 0.5)";
      ctx.fillRect(cx + 9, headY + 6, 2, 1.5);
      ctx.fillRect(cx + 20, headY + 6, 2, 1.5);
      
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 13, headY + 7.5);
      ctx.lineTo(cx + 15, headY + 9);
      ctx.lineTo(cx + 17, headY + 7.5);
      ctx.stroke();
    } else {
      // Simple pixel mouth
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(cx + 15, headY + 8, 2, 1);
    }
  }

  // Back accessories if facing up
  if (direction === "up") {
    if (char.accessoryType === "cape") {
      drawPixelRect(cx + 6, cy + 13 + walkBob, 20, 11, char.headColor);
    } else if (char.accessoryType === "backpack") {
      drawPixelRect(cx + 8, cy + 12 + walkBob, 16, 9, "#78350f");
    }
  }

  // Crown floating on top
  if (showCrown) {
    const crownY = headY - 11 + Math.sin(performance.now() / 200) * 1.5;
    drawPixelRect(cx + 9, crownY, 14, 5, "#eab308");
    ctx.fillStyle = "#facc15";
    ctx.fillRect(cx + 9, crownY - 2, 2, 2);
    ctx.fillRect(cx + 15, crownY - 2, 2, 2);
    ctx.fillRect(cx + 21, crownY - 2, 2, 2);
  }

  ctx.restore();
};
