export interface PixelCharData {
  gender?: "male" | "female";
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
  showCrown: boolean = false,
  isGM: boolean = false,
  bubbleText?: string
) => {
  ctx.save();

  // 1. Pixel shadow
  ctx.shadowBlur = 0; // prevent glow on shadow
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy + 30, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fill();

  // Se for GM, adiciona a aura dourada no personagem
  if (isGM) {
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 12;
  }

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
  const isFemale = char.gender === "female";

  if (isFemale) {
    // Hourglass female waist silhouette (16px shoulders -> 14px waist -> 16px hips)
    drawPixelRect(cx + 8, torsoY, 16, 3, char.torsoColor || "#ef4444"); // Shoulders
    drawPixelRect(cx + 9, torsoY + 3, 14, 4, char.torsoColor || "#ef4444"); // Slimmed Waist
    drawPixelRect(cx + 8, torsoY + 7, 16, 3, char.torsoColor || "#ef4444"); // Hips / Hem
  } else {
    // Solid retro male block torso (16x10px)
    drawPixelRect(cx + 8, torsoY, 16, 10, char.torsoColor || "#ef4444");
  }

  // Torso texture details
  if (direction === "up") {
    // Back of the torso details
    if (char.torsoType === "cyber") {
      drawPixelRect(cx + 10, torsoY + 2, 12, 3, "#06b6d4"); // Glowing cyber spine
    } else if (char.torsoType === "samurai") {
      drawPixelRect(cx + 9, torsoY + 6, 14, 2, "#eab308"); // Gold obi sash back
    } else if (char.torsoType === "royal" || char.torsoType === "golden_armor") {
      drawPixelRect(cx + 8, torsoY + 1, 16, 9, "#ca8a04"); // Gold cape trim back
    } else if (char.torsoType === "hoodie") {
      drawPixelRect(cx + 10, torsoY + 1, 12, 6, "rgba(0, 0, 0, 0.2)");
    }

    // Back accessories drawn ON TOP of the torso because we are looking at their back
    if (char.accessoryType === "wings") {
      drawPixelRect(cx - 4, torsoY - 2, 12, 14, "#e0e7ff", "#6366f1"); // Left Wing
      drawPixelRect(cx + 24, torsoY - 2, 12, 14, "#e0e7ff", "#6366f1"); // Right Wing
      drawPixelRect(cx + 2, torsoY + 1, 4, 10, "#fbbf24"); // Wing feathers glow
      drawPixelRect(cx + 26, torsoY + 1, 4, 10, "#fbbf24");
    } else if (char.accessoryType === "cape") {
      drawPixelRect(cx + 6, torsoY + 1, 20, 11, char.headColor);
    } else if (char.accessoryType === "backpack") {
      drawPixelRect(cx + 8, torsoY + 1, 16, 9, "#78350f");
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(cx + 10, torsoY, 2, 2);
      ctx.fillRect(cx + 20, torsoY, 2, 2);
    }
  } else {
    // Front Torso Pixel Art Details
    if (char.torsoType === "cyber") {
      // Cyberpunk glowing chest reactor & shoulder pads
      drawPixelRect(cx + 6, torsoY, 3, 4, "#06b6d4"); // Left Cyber Shoulder
      drawPixelRect(cx + 23, torsoY, 3, 4, "#06b6d4"); // Right Cyber Shoulder
      drawPixelRect(cx + 14, torsoY + 3, 4, 4, "#38bdf8", "#0284c7"); // Glowing Core Reactor
      drawPixelRect(cx + 10, torsoY + 8, 12, 1, "#06b6d4"); // Circuit line
    } else if (char.torsoType === "samurai") {
      // Samurai overlapping armor plates & Gold Obi Sash
      drawPixelRect(cx + 6, torsoY + 1, 3, 5, "#dc2626"); // Left armor pad
      drawPixelRect(cx + 23, torsoY + 1, 3, 5, "#dc2626"); // Right armor pad
      drawPixelRect(cx + 9, torsoY + 6, 14, 3, "#eab308", "#854d0e"); // Gold Obi Sash
      drawPixelRect(cx + 15, torsoY + 1, 2, 5, "#fef08a"); // Crest line
    } else if (char.torsoType === "valkyrie") {
      // Valkyrie silver chestplate & winged shoulders
      drawPixelRect(cx + 5, torsoY - 1, 4, 5, "#f472b6"); // Left Winged shoulder
      drawPixelRect(cx + 23, torsoY - 1, 4, 5, "#f472b6"); // Right Winged shoulder
      drawPixelRect(cx + 10, torsoY + 2, 12, 5, "#e2e8f0", "#94a3b8"); // Silver Chestplate
      drawPixelRect(cx + 15, torsoY + 4, 2, 2, "#ec4899"); // Magenta Heart Gem
    } else if (char.torsoType === "golden_armor") {
      // 24k Gold Knight Armor with Ruby Gem
      drawPixelRect(cx + 5, torsoY, 4, 6, "#facc15", "#854d0e"); // Gold Left Shoulder
      drawPixelRect(cx + 23, torsoY, 4, 6, "#facc15", "#854d0e"); // Gold Right Shoulder
      drawPixelRect(cx + 10, torsoY + 2, 12, 6, "#eab308", "#ca8a04"); // Gold Chestplate
      drawPixelRect(cx + 15, torsoY + 3, 2, 3, "#ef4444"); // Ruby Gem
    } else if (char.torsoType === "royal") {
      // Velvet Royal Robe with Gold Trim
      drawPixelRect(cx + 9, torsoY, 14, 2, "#facc15"); // Gold Collar
      drawPixelRect(cx + 15, torsoY + 2, 2, 7, "#fbbf24"); // Center Gold Trim
      drawPixelRect(cx + 15, torsoY + 3, 2, 2, "#38bdf8"); // Sapphire brooch
    } else if (char.torsoType === "dress") {
      // Flowing Gown overlay extending down over waist
      drawPixelRect(cx + 7, torsoY + 7, 18, 5, char.torsoColor || "#ec4899", "#831843"); // Skirt flare
      drawPixelRect(cx + 12, torsoY + 3, 8, 4, "rgba(255, 255, 255, 0.3)");
    } else if (char.torsoType === "pirate") {
      // Leather vest over ruffled shirt & red sash
      drawPixelRect(cx + 14, torsoY, 4, 5, "#f8fafc"); // White ruffled shirt V-neck
      drawPixelRect(cx + 9, torsoY + 7, 14, 2, "#dc2626"); // Red pirate sash
      drawPixelRect(cx + 15, torsoY + 6, 2, 3, "#facc15"); // Gold belt buckle
    } else if (char.torsoType === "witch_robe") {
      // Mystic robe with glowing runes & potion belt
      drawPixelRect(cx + 10, torsoY + 2, 12, 2, "#a855f7"); // Mystic Collar
      drawPixelRect(cx + 12, torsoY + 4, 8, 2, "#38bdf8"); // Glowing Rune Symbol
      drawPixelRect(cx + 9, torsoY + 7, 14, 2, "#581c87"); // Potion Belt
      drawPixelRect(cx + 11, torsoY + 7, 2, 2, "#22c55e"); // Green Potion vial
      drawPixelRect(cx + 19, torsoY + 7, 2, 2, "#ef4444"); // Red Potion vial
    } else if (char.torsoType === "suit") {
      // Tuxedo jacket, shirt & bowtie
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 14, torsoY, 4, 5); // White Shirt
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(cx + 14, torsoY + 1, 4, 1.5); // Bowtie
      ctx.fillStyle = "#facc15";
      ctx.fillRect(cx + 15, torsoY + 4, 2, 1.5); // Gold Button 1
      ctx.fillRect(cx + 15, torsoY + 6, 2, 1.5); // Gold Button 2
    } else if (char.torsoType === "striped") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(cx + 9, torsoY + 2, 14, 2);
      ctx.fillRect(cx + 9, torsoY + 6, 14, 2);
    } else if (char.torsoType === "hoodie") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(cx + 11, torsoY + 5, 10, 4);
    }
  }

  // Right Arm & Weapon / Accessory Poses
  const rightArmX = cx + 24;
  const rightArmY = cy + 12 + walkBob + rightArmYOffset;

  if (char.accessoryType === "viking_axe" && direction !== "up") {
    // Raised Viking Battleaxe Pose
    drawPixelRect(rightArmX, rightArmY - 4, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(rightArmX, rightArmY - 7, 4, 3, char.skinColor || "#ffdbac");
    // Wooden Shaft & Double Steel Axe Head
    drawPixelRect(rightArmX + 1, rightArmY - 22, 2, 18, "#78350f"); // Handle
    drawPixelRect(rightArmX - 4, rightArmY - 20, 12, 5, "#94a3b8", "#334155"); // Double Blade
    drawPixelRect(rightArmX - 5, rightArmY - 22, 3, 9, "#cbd5e1"); // Left Blade Tip
    drawPixelRect(rightArmX + 6, rightArmY - 22, 3, 9, "#cbd5e1"); // Right Blade Tip
  } else if (char.accessoryType === "magic_wand" && direction !== "up") {
    // Sorceress Wand Pose
    drawPixelRect(rightArmX, rightArmY - 4, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(rightArmX, rightArmY - 7, 4, 3, char.skinColor || "#ffdbac");
    // Wand Shaft & Glowing Mana Crystal Tip
    drawPixelRect(rightArmX + 1, rightArmY - 18, 2, 14, "#581c87"); // Wand shaft
    drawPixelRect(rightArmX - 1, rightArmY - 22, 6, 6, "#38bdf8", "#0284c7"); // Glowing Crystal Tip
    drawPixelRect(rightArmX, rightArmY - 21, 4, 4, "#e0f2fe"); // Crystal Core
  } else if (char.accessoryType === "katana" && direction !== "up") {
    // Cyber Katana Pose
    drawPixelRect(rightArmX, rightArmY - 4, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(rightArmX, rightArmY - 7, 4, 3, char.skinColor || "#ffdbac");
    // Cyber Blade
    drawPixelRect(rightArmX - 3, rightArmY - 8, 10, 2, "#06b6d4"); // Cyber Guard
    drawPixelRect(rightArmX, rightArmY - 24, 3, 16, "#38bdf8", "#0284c7"); // Cyan Blade
  } else if (char.accessoryType === "sword" && direction !== "up") {
    // Raised Steel Sword Pose
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

  // Hats, Ribbons, and Hair
  if (char.headType === "topete") {
    drawPixelRect(cx + 8, headY - 5, 16, 5, hairCol); // Raised pompadour topete
    drawPixelRect(cx + 6, headY - 2, 4, 3, hairCol);
  } else if (char.headType === "militar") {
    drawPixelRect(cx + 8, headY - 1, 16, 2, hairCol); // Very short military crop
  } else if (char.headType === "ponytail") {
    drawPixelRect(cx + 6, headY - 3, 20, 4, hairCol);
    drawPixelRect(cx + 4, headY + 1, 4, 12, hairCol);
    drawPixelRect(cx + 24, headY + 1, 4, 12, hairCol);
    // Ponytail on the side
    drawPixelRect(cx + 25, headY + 4, 5, 10, hairCol);
  } else if (char.headType === "bob") {
    drawPixelRect(cx + 6, headY - 3, 20, 5, hairCol); // Cute bob / chanel cut
    drawPixelRect(cx + 5, headY + 1, 4, 9, hairCol);
    drawPixelRect(cx + 23, headY + 1, 4, 9, hairCol);
  } else if (char.headType === "witch") {
    // Pointed witch / sorceress hat
    ctx.fillStyle = char.headColor || "#4c1d95";
    ctx.beginPath();
    ctx.moveTo(cx + 4, headY + 1);
    ctx.lineTo(cx + 16, headY - 10);
    ctx.lineTo(cx + 28, headY + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    drawPixelRect(cx + 3, headY, 26, 2, "#6d28d9"); // Brim
  } else if (char.headType === "elf_ears") {
    drawPixelRect(cx + 7, headY - 2, 18, 4, hairCol);
    // Elven ears
    drawPixelRect(cx + 4, headY + 2, 4, 3, char.skinColor);
    drawPixelRect(cx + 24, headY + 2, 4, 3, char.skinColor);
  } else if (char.headType === "flower_crown") {
    drawPixelRect(cx + 6, headY - 3, 20, 5, hairCol);
    // Flowers on head
    drawPixelRect(cx + 8, headY - 4, 3, 3, "#f472b6");
    drawPixelRect(cx + 14, headY - 4, 3, 3, "#fbbf24");
    drawPixelRect(cx + 20, headY - 4, 3, 3, "#38bdf8");
  } else if (char.headType === "pirate") {
    drawPixelRect(cx + 5, headY - 4, 22, 5, "#0f172a"); // Pirate bandana/hat
    drawPixelRect(cx + 14, headY - 3, 4, 3, "#ef4444"); // Skull or accent
  } else if (char.headType === "square") {
    drawPixelRect(cx + 7, headY - 3, 18, 4, hairCol); // Hair top
    drawPixelRect(cx + 7, headY + 1, 3, 6, hairCol);   // Left side
    drawPixelRect(cx + 22, headY + 1, 3, 6, hairCol);  // Right side
    if (isFemale) {
      // Long cascading hair strands for female
      drawPixelRect(cx + 5, headY + 2, 4, 12, hairCol);
      drawPixelRect(cx + 23, headY + 2, 4, 12, hairCol);
    }
  } else if (char.headType === "ribbon" || (isFemale && char.headType === "long_hair")) {
    drawPixelRect(cx + 6, headY - 3, 20, 5, hairCol); // Top hair
    drawPixelRect(cx + 4, headY + 1, 4, 14, hairCol); // Long left hair
    drawPixelRect(cx + 24, headY + 1, 4, 14, hairCol); // Long right hair
    // Red Hair Ribbon Bow
    drawPixelRect(cx + 14, headY - 6, 4, 3, "#ec4899");
    drawPixelRect(cx + 11, headY - 5, 3, 2, "#f472b6");
    drawPixelRect(cx + 18, headY - 5, 3, 2, "#f472b6");
  } else if (char.headType === "long_hair") {
    drawPixelRect(cx + 6, headY - 3, 20, 5, hairCol);
    drawPixelRect(cx + 4, headY + 1, 4, 15, hairCol);
    drawPixelRect(cx + 24, headY + 1, 4, 15, hairCol);
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

    // Eyelashes & Cute Blush for Female
    if (isFemale || char.faceType === "eyelashes" || char.faceType === "makeup") {
      // Top Eyelashes
      drawPixelRect(cx + 9, headY + 2, 4, 1, "#000000", "");
      drawPixelRect(cx + 18, headY + 2, 4, 1, "#000000", "");
      // Pink Blush Cheeks
      drawPixelRect(cx + 8.5, headY + 6, 3, 2, "#fda4af", "");
      drawPixelRect(cx + 19.5, headY + 6, 3, 2, "#fda4af", "");
    }

    // Custom face traits
    if (char.faceType === "glasses" || char.faceType === "visor") {
      if (char.faceType === "visor") {
        drawPixelRect(cx + 8, headY + 2, 15, 4, "#06b6d4", "#0891b2");
      } else {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx + 9, headY + 2.5, 5, 4);
        ctx.strokeRect(cx + 17, headY + 2.5, 5, 4);
        ctx.beginPath();
        ctx.moveTo(cx + 14, headY + 4.5);
        ctx.lineTo(cx + 17, headY + 4.5);
        ctx.stroke();
      }
    } else if (char.faceType === "elder_beard") {
      drawPixelRect(cx + 7, headY + 6, 18, 7, "#f8fafc"); // Long elder white beard
      ctx.fillStyle = char.skinColor;
      ctx.fillRect(cx + 14, headY + 7, 4, 1.5);
    } else if (char.faceType === "beard") {
      const beardCol = char.hairColor || "#78350f";
      drawPixelRect(cx + 8, headY + 7, 16, 4, beardCol);
      ctx.fillStyle = char.skinColor;
      ctx.fillRect(cx + 14, headY + 8, 4, 1.5); // Mouth cutout
    } else if (char.faceType === "mustache") {
      drawPixelRect(cx + 10, headY + 7, 12, 2, "#451a03"); // Pirate handlebar mustache
    } else if (char.faceType === "makeup") {
      drawPixelRect(cx + 14, headY + 8, 4, 1.5, "#e11d48"); // Red lipstick
    } else if (char.faceType === "eyepatch") {
      drawPixelRect(cx + 10, headY + 2.5, 3.5, 3.5, "#111111", "");
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 8, headY + 1.5);
      ctx.lineTo(cx + 23, headY + 5.5);
      ctx.stroke();
    } else if (char.faceType === "smile" || isFemale) {
      ctx.fillStyle = "rgba(244, 63, 94, 0.7)";
      ctx.fillRect(cx + 14.5, headY + 7.5, 3, 1.5);
    } else {
      // Simple pixel mouth
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(cx + 15, headY + 8, 2, 1);
    }
  }

  // Back accessories (Wings, Katana, Cape, Backpack) if facing up
  if (direction === "up") {
    if (char.accessoryType === "wings") {
      drawPixelRect(cx - 2, cy + 8 + walkBob, 10, 14, "#e0e7ff", "#6366f1");
      drawPixelRect(cx + 24, cy + 8 + walkBob, 10, 14, "#e0e7ff", "#6366f1");
    } else if (char.accessoryType === "katana") {
      drawPixelRect(cx + 22, cy + 6 + walkBob, 3, 20, "#e2e8f0", "#334155");
    } else if (char.accessoryType === "cape") {
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

  // ── Balão de mensagem (speech bubble) do jogador LOCAL ─────────────────────
  // Renderizado aqui para que o próprio jogador veja seu balão no canvas.
  // Outros jogadores têm seus balões renderizados em NPCManager.drawOtherPlayers().
  if (bubbleText && bubbleText.length > 0) {
    ctx.save();
    const MAX_LINE_CHARS = 22;
    const FONT_SIZE = 9;
    ctx.font = `bold ${FONT_SIZE}px 'JetBrains Mono', monospace`;

    // Quebra em até 2 linhas
    let lines: string[];
    if (bubbleText.length <= MAX_LINE_CHARS) {
      lines = [bubbleText];
    } else {
      const mid = bubbleText.lastIndexOf(" ", MAX_LINE_CHARS) || MAX_LINE_CHARS;
      lines = [
        bubbleText.slice(0, mid).trim(),
        bubbleText.slice(mid).trim().slice(0, MAX_LINE_CHARS),
      ].filter(Boolean);
    }

    const lineHeight = FONT_SIZE + 3;
    const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bW = maxLineWidth + 14;
    const bH = lines.length * lineHeight + 7;
    const bx = cx + 16 - bW / 2;
    const by = headY - bH - 10;

    // Fundo branco arredondado
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bx, by, bW, bH, 5);
    } else {
      ctx.rect(bx, by, bW, bH);
    }
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Ponteiro triangular apontando para o personagem
    ctx.beginPath();
    ctx.moveTo(cx + 12, by + bH);
    ctx.lineTo(cx + 16, by + bH + 5);
    ctx.lineTo(cx + 20, by + bH);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Texto
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, cx + 16, by + 4 + i * lineHeight);
    });
    ctx.restore();
  }

  ctx.restore();
};
