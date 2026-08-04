/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GameFiNow - v0.8.2
 * gameData.ts — Static Game Data & World Configuration
 *
 * Contains:
 *   - Tile type enums (TileType) for the 60x60 tilemap grid
 *   - GameDecoration and GameCreature interfaces
 *   - INITIAL_QUESTS: starting state for the 4-quest onboarding journey
 *     (Wallet Forge → On-Ramp → Soroban Swap → VIP Hold)
 *   - INITIAL_NPCS: all NPC definitions (James, Kael, Captain HC, Alchemist, Elder Bobba)
 *     NPC dialogue texts are loaded from i18n JSON at runtime via handleTalkToNPC()
 *   - isBridgeBlocked(): enforces quest-gated bridges between map zones
 *   - isCollidable(): collision detection helper
 */

import { NPC, Quest } from "./types";

// Map grid dimensions
export const GRID_COLS = 60;
export const GRID_ROWS = 60;
export const TILE_SIZE = 32; // Pixels per tile

// Tile type constants
export enum TileType {
  WATER = 0,
  GRASS = 1,
  BRIDGE = 2,
  FLOOR_DARK = 3,
  WALL = 4,
  SAND = 5,
  STONE_PATH = 6,
  TEMPLE_FLOOR = 7,
  HEDGE = 8,
  PORTAL_EAST = 9,
  PORTAL_WEST = 10,
  PORTAL_NORTH = 11,
  PORTAL_SOUTH = 12,
  PORTAL_CENTER = 13,
  BLOCK = 14,
  CROPS = 15,
  FENCE = 16,
}

// Decoration interface for high-fidelity assets
export interface GameDecoration {
  x: number;
  y: number;
  type: "tree" | "bench" | "lamp" | "barrel" | "box" | "statue" | "flower_pot" | "boat" | "stand" | "palm_tree" | "umbrella" | "towel" | "sandcastle" | "p2p_store" | "burn_altar" | "pixel_shop" | "pixel_burn_brazier" | "pixel_faucet" | "mine" | "stellar_nucleus";
  color?: string;
  text?: string;
  subText?: string;
  width?: number;
  height?: number;
  // Mining specific
  mineRarity?: "common" | "uncommon" | "rare" | "epic";
}

// Passive creature/monster interface (slime blobs)
export interface GameCreature {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  frame: number;
  color: string;
  level: number;
  hp: number;
  maxHp: number;
  bounceOffset: number;
  dir: "left" | "right";
}

// Mock creatures for testing Battle System
export const MOCK_CREATURES: GameCreature[] = [
  {
    id: "mob_1",
    name: "Slime",
    x: 27,
    y: 32,
    targetX: 27,
    targetY: 32,
    isMoving: false,
    frame: 0,
    color: "#22c55e",
    level: 2,
    hp: 40,
    maxHp: 40,
    bounceOffset: 0,
    dir: "left"
  }
];

// Export decorations list
export const MAP_DECORATIONS: GameDecoration[] = [
  // --- JAZIDAS DE MINERAÇÃO ---
  { x: 38, y: 15, type: "mine", mineRarity: "common" }, // Norte (Porto)
  { x: 12, y: 48, type: "mine", mineRarity: "uncommon" }, // Sul (Santuário)
  { x: 8, y: 22, type: "mine", mineRarity: "rare" },    // Oeste (Bazaar)
  { x: 50, y: 38, type: "mine", mineRarity: "epic" },   // Leste (Caverna)

  // Central Statue / Coin Fountain
  { x: 30, y: 30, type: "statue" },
  
  // Street Lamps around crossroads
  { x: 25, y: 25, type: "lamp" },
  { x: 35, y: 25, type: "lamp" },
  { x: 25, y: 35, type: "lamp" },
  { x: 35, y: 35, type: "lamp" },
  { x: 29, y: 26, type: "lamp" },
  { x: 31, y: 26, type: "lamp" },
  { x: 29, y: 34, type: "lamp" },
  { x: 31, y: 34, type: "lamp" },

  // Benches along cobblestone paths
  { x: 26, y: 27, type: "bench" },
  { x: 34, y: 27, type: "bench" },
  { x: 26, y: 33, type: "bench" },
  { x: 34, y: 33, type: "bench" },

  // Trees in Grass Fields
  { x: 24, y: 24, type: "tree" },
  { x: 36, y: 24, type: "tree" },
  { x: 24, y: 36, type: "tree" },
  { x: 36, y: 36, type: "tree" },
  { x: 23, y: 27, type: "tree" },
  { x: 37, y: 27, type: "tree" },
  { x: 23, y: 33, type: "tree" },
  { x: 37, y: 33, type: "tree" },

  // Barrels and boxes near stalls/bridges
  { x: 23, y: 29, type: "barrel" },
  { x: 23, y: 31, type: "box" },
  { x: 37, y: 29, type: "barrel" },
  { x: 37, y: 31, type: "box" },

  // North Island (Anchor Port) beautiful decorative elements
  { x: 15, y: 8, type: "lamp" },
  { x: 45, y: 8, type: "lamp" },
  { x: 6, y: 3, type: "barrel" },
  { x: 7, y: 3, type: "box" },
  { x: 53, y: 3, type: "barrel" },
  { x: 54, y: 3, type: "box" },
  { x: 20, y: 9, type: "bench" },
  { x: 40, y: 9, type: "bench" },
  { x: 14, y: 11, type: "lamp" },
  { x: 16, y: 11, type: "lamp" },
  { x: 44, y: 11, type: "lamp" },
  { x: 46, y: 11, type: "lamp" },

  // South Island (Holder Sanctuary) mystical items
  { x: 15, y: 52, type: "lamp" },
  { x: 45, y: 52, type: "lamp" },
  { x: 25, y: 56, type: "statue" },
  { x: 35, y: 56, type: "statue" },
  { x: 18, y: 47, type: "flower_pot" },
  { x: 42, y: 47, type: "flower_pot" },
  { x: 28, y: 50, type: "lamp" },
  { x: 32, y: 50, type: "lamp" },

  // West Island (Soroban Bazaar) market crates & stalls
  { x: 4, y: 18, type: "box" },
  { x: 5, y: 18, type: "barrel" },
  { x: 4, y: 32, type: "box" },
  { x: 4, y: 40, type: "barrel" },
  { x: 11, y: 16, type: "lamp" },
  { x: 11, y: 43, type: "lamp" },
  { x: 10, y: 26, type: "bench" },
  { x: 10, y: 34, type: "bench" },

  // East Island (Wallet Forge) knight fortress ornaments
  { x: 56, y: 18, type: "barrel" },
  { x: 56, y: 41, type: "box" },
  { x: 49, y: 24, type: "lamp" },
  { x: 49, y: 36, type: "lamp" },
  { x: 53, y: 20, type: "statue" },
  { x: 53, y: 40, type: "statue" },
];

// Generate the procedural map grid with hedges, portals, and pathways
export function generateMap(): number[][] {
  const grid: number[][] = [];
  
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.WATER;

      // 1. Center Island (Spawn Town Square & Gardens): cols 18..42, rows 18..42
      if (c >= 18 && c <= 42 && r >= 18 && r <= 42) {
        // Outer Shore / Garden Border
        if (c === 18 || c === 42 || r === 18 || r === 42) {
          if ((r >= 28 && r <= 31) || (c >= 28 && c <= 31)) {
            tile = TileType.STONE_PATH;
          } else {
            // Alternating gorgeous hedges and sand beaches
            tile = (c + r) % 2 === 0 ? TileType.HEDGE : TileType.SAND;
          }
        } else {
          tile = TileType.GRASS;
        }

        // Beautiful town crossroads cobblestone path
        if ((c >= 27 && c <= 33) || (r >= 27 && r <= 33)) {
          tile = TileType.STONE_PATH;
        }

        // Corner flower-hedges in central park
        if ((c === 20 || c === 40) && (r === 20 || r === 40)) {
          tile = TileType.HEDGE;
        }
      }
      
      // 2. North Island (Anchor Port - Massive Coastal Docks): cols 2..57, rows 1..12
      else if (c >= 2 && c <= 57 && r >= 1 && r <= 12) {
        tile = TileType.FLOOR_DARK;

        // Fortress walls on top & sides
        if (r === 1 || c === 2 || c === 57) {
          tile = TileType.WALL;
        }

        // Grand cobblestone paths
        if (r >= 10 && r <= 12 && c >= 10 && c <= 50) {
          tile = TileType.STONE_PATH;
        }

        // Piers/Docks extending south (Bridge-type tiles)
        if (r >= 11 && r <= 12 && (c === 15 || c === 20 || c === 40 || c === 45)) {
          tile = TileType.BRIDGE;
        }

        // Decorative sand patches representing a sandy shoreline gap
        if (r === 12 && !(c === 15 || c === 20 || c === 40 || c === 45 || (c >= 27 && c <= 33))) {
          tile = TileType.SAND;
        }

        // Courtyard flower garden
        if (r >= 3 && r <= 6 && ((c >= 6 && c <= 12) || (c >= 48 && c <= 54))) {
          tile = (c === 6 || c === 12 || c === 48 || c === 54 || r === 3 || r === 6) ? TileType.HEDGE : TileType.GRASS;
        }
      }

      // 3. South Island (Holder Sanctuary - Ancient Temple Hall): cols 2..57, rows 48..59
      else if (c >= 2 && c <= 57 && r >= 48 && r <= 59) {
        tile = TileType.TEMPLE_FLOOR;

        // Giant ancient walls
        if (r === 59 || c === 2 || c === 57) {
          tile = TileType.WALL;
        }

        // Inner sacred pool of water surrounded by sand
        if (r >= 52 && r <= 56 && c >= 6 && c <= 14) {
          if (r === 52 || r === 56 || c === 6 || c === 14) {
            tile = TileType.SAND;
          } else {
            tile = TileType.WATER;
          }
        }

        // Ancient sanctuary pillar partitions
        if ((r === 51 && ((c >= 18 && c <= 25) || (c >= 35 && c <= 42))) || (c === 22 && r >= 52 && r <= 56) || (c === 38 && r >= 52 && r <= 56)) {
          tile = TileType.WALL;
        }

        // Shrubbery inside corridors
        if (r >= 49 && r <= 50 && ((c >= 4 && c <= 8) || (c >= 51 && c <= 55))) {
          tile = TileType.HEDGE;
        }
      }

      // 4. West Island (Soroban Swap - Grand Floating Bazaar): cols 1..12, rows 2..57
      else if (c >= 1 && c <= 12 && r >= 2 && r <= 57) {
        tile = TileType.FLOOR_DARK;

        // West boundary walls
        if (c === 1 || r === 2 || r === 57) {
          tile = TileType.WALL;
        }

        // Desert beaches on the west shore
        if (c >= 2 && c <= 3 && r >= 4 && r <= 55) {
          // Leave room for bazaar passages
          if (r % 8 !== 0) {
            tile = TileType.SAND;
          }
        }

        // Market pathways
        if (c === 10 || c === 11) {
          tile = TileType.STONE_PATH;
        }

        // Ornamental water canals crossed by wooden bridges
        if ((r === 18 || r === 38) && c >= 4 && c <= 11) {
          if (c === 10 || c === 11) {
            tile = TileType.BRIDGE;
          } else {
            tile = TileType.WATER;
          }
        }

        // Hedges around bazaar tables
        if (r >= 26 && r <= 30 && c >= 5 && c <= 7) {
          tile = TileType.HEDGE;
        }
      }

      // 5. East Island (Wallet Forge - Fortress of Cryptographic Fire): cols 48..59, rows 2..57
      else if (c >= 48 && c <= 59 && r >= 2 && r <= 57) {
        tile = TileType.TEMPLE_FLOOR;

        // East boundary walls
        if (c === 59 || r === 2 || r === 57) {
          tile = TileType.WALL;
        }

        // Forging corridor pathing
        if (c === 49 || c === 50) {
          tile = TileType.STONE_PATH;
        }

        // Castle battlements partitions
        if ((r === 18 && c >= 50 && c <= 57) || (r === 41 && c >= 50 && c <= 57)) {
          tile = TileType.WALL;
        }

        // Courtyard garden grass patches
        if (r >= 22 && r <= 25 && c >= 52 && c <= 56) {
          tile = TileType.GRASS;
        }
        if (r >= 33 && r <= 36 && c >= 52 && c <= 56) {
          tile = TileType.GRASS;
        }

        // Cooling water pool
        if (r >= 28 && r <= 30 && c >= 53 && c <= 56) {
          tile = TileType.WATER;
        }
      }

      // Bridges serving as short portal launch platforms (aligned with expanded limits)
      else if ((r === 29 || r === 30) && c >= 43 && c <= 47) {
        tile = TileType.BRIDGE;
      }
      else if ((r === 29 || r === 30) && c >= 13 && c <= 17) {
        tile = TileType.BRIDGE;
      }
      else if ((c === 29 || c === 30) && r >= 13 && r <= 17) {
        tile = TileType.BRIDGE;
      }
      else if ((c === 29 || c === 30) && r >= 43 && r <= 47) {
        tile = TileType.BRIDGE;
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // Inject Portals at Town Exits (Center Island borders at the extreme edges)
  grid[29][42] = TileType.PORTAL_EAST;
  grid[30][42] = TileType.PORTAL_EAST;

  grid[29][18] = TileType.PORTAL_WEST;
  grid[30][18] = TileType.PORTAL_WEST;

  grid[18][29] = TileType.PORTAL_NORTH;
  grid[18][30] = TileType.PORTAL_NORTH;

  grid[42][29] = TileType.PORTAL_SOUTH;
  grid[42][30] = TileType.PORTAL_SOUTH;

  // Inject Center Return Portals in outer islands (placed at borders)
  grid[29][48] = TileType.PORTAL_CENTER;
  grid[30][48] = TileType.PORTAL_CENTER;

  grid[29][12] = TileType.PORTAL_CENTER;
  grid[30][12] = TileType.PORTAL_CENTER;

  grid[12][29] = TileType.PORTAL_CENTER;
  grid[12][30] = TileType.PORTAL_CENTER;

  grid[48][29] = TileType.PORTAL_CENTER;
  grid[48][30] = TileType.PORTAL_CENTER;

  // Terminals and monuments blocks (Wall-types for collision)
  grid[30][54] = TileType.WALL; // Wallet forge pedestal
  grid[6][30] = TileType.WALL;  // OnRamp pedestal
  grid[30][6] = TileType.WALL;  // Soroban Swap pedestal
  grid[54][30] = TileType.WALL; // Hold Chamber pedestal

  return grid;
}

/// Initial state of Quests
export const INITIAL_QUESTS: Record<string, Quest> = {
  wallet: {
    id: "wallet",
    title: "1. Registro no Templo Stellar",
    description: "Crie a sua própria conta segura na rede Stellar gerando seu par de chaves públicas e privadas.",
    instructions: "Entre no Portal Leste (Ciano) na recepção para ir à Forja do Destino e fale com Kael [NPC], o Ferreiro de Itens Raros.",
    reward: "Chave Pública (Endereço G...) + Chave Secreta (Seed Secreta)",
    status: "active",
  },
  onramp: {
    id: "onramp",
    title: "2. Adquirir Moedas do Templo (On-Ramp)",
    description: "Compre seus primeiros Lumens (XLM) convertendo ouro fictício no balcão de câmbio do templo.",
    instructions: "Entre no Portal Norte (Verde) para ir ao Porto de Câmbio e fale com o Capitão HC [NPC].",
    reward: "150 XLM de moedas para gastar no continente",
    status: "locked",
  },
  soroban: {
    id: "soroban",
    title: "3. Negociar Raros Soroban (Smart Contracts)",
    description: "Use contratos inteligentes Soroban para trocar seus XLM por USDC (Ouro Estável) ou Runas de Batalha SORO.",
    instructions: "Entre no Portal Oeste (Roxo) para ir ao Mercado do Templo e fale com a Alquimista [NPC].",
    reward: "Runas de Batalha SORO + USDC de Platina",
    status: "locked",
  },
  hold: {
    id: "hold",
    title: "4. Cofre do VIP Legend Holder",
    description: "Mostre seu compromisso de longo prazo travando suas moedas em um cofre inteligente para se tornar um Guardião Lendário.",
    instructions: "Entre no Portal Sul (Dourado) para ir à Câmara Secreta e fale com Bobba [NPC], o Ancião.",
    reward: "Título de Guardião Lendário VIP Stellar Holder 🌟",
    status: "locked",
  },

  // ── Kill Quests — Uma por mapa, independentes das quests de blockchain ─────
  kill_center: {
    id: "kill_center",
    title: "⚔️ Exterminador do Centro",
    description: "A praça central está infestada de Blobs! Elimine 5 deles para proteger os viajantes.",
    instructions: "Derrote 5 Slimes na praça central. Use [Z] para atacar quando estiver próximo.",
    reward: "200 XP + 1x Núcleo de Slime",
    status: "locked",
    killCount: 0,
    killGoal: 5,
    targetCreature: "Blob",
    targetMap: "center",
    xpReward: 200,
    dropItemId: "slime_core",
  },
  kill_east: {
    id: "kill_east",
    title: "🪱 Guerreiro da Forja Leste",
    description: "Vermes das Cavernas ameaçam a Forja de Kael. Extermínio necessário!",
    instructions: "Derrote 5 Cave Worms na região Leste. Use [Z] para atacar quando estiver próximo.",
    reward: "450 XP + 1x Presas de Verme",
    status: "locked",
    killCount: 0,
    killGoal: 5,
    targetCreature: "Cave Worm",
    targetMap: "east",
    xpReward: 450,
    dropItemId: "worm_fang",
  },
  kill_north: {
    id: "kill_north",
    title: "🦀 Caçador do Porto Norte",
    description: "Os Caranguejos invadiram o Porto do Norte! O Capitão HC precisa da sua ajuda.",
    instructions: "Derrote 5 Crabs na região Norte. Use [Z] para atacar quando estiver próximo.",
    reward: "350 XP + 1x Concha de Caranguejo",
    status: "locked",
    killCount: 0,
    killGoal: 5,
    targetCreature: "Crab",
    targetMap: "north",
    xpReward: 350,
    dropItemId: "crab_shell",
  },
  kill_west: {
    id: "kill_west",
    title: "🐝 Desbravador do Bazar Oeste",
    description: "As Abelhas do Oeste estão atacando os mercadores! Defenda o Bazar.",
    instructions: "Derrote 5 Bees na região Oeste. Use [Z] para atacar quando estiver próximo.",
    reward: "500 XP + 1x Ferrão de Abelha",
    status: "locked",
    killCount: 0,
    killGoal: 5,
    targetCreature: "Bee",
    targetMap: "west",
    xpReward: 500,
    dropItemId: "bee_stinger",
  },
  kill_south: {
    id: "kill_south",
    title: "🐍 Herói do Santuário Sul",
    description: "Serpentes místicas dominaram o Santuário Sul. Apenas um herói lendário pode pará-las.",
    instructions: "Derrote 5 Snakes na região Sul. Use [Z] para atacar quando estiver próximo.",
    reward: "750 XP + 1x Escama de Serpente",
    status: "locked",
    killCount: 0,
    killGoal: 5,
    targetCreature: "Snake",
    targetMap: "south",
    xpReward: 750,
    dropItemId: "snake_scale",
  },
};

// NPCs list
export const INITIAL_NPCS: NPC[] = [
  {
    id: "guide",
    name: "James [NPC]",
    x: 27,
    y: 28,
    dir: "down",
    dialogs: [
      "Olá, jovem herói! Bem-vindo ao saguão principal do Templo Stellar!",
      "Eu sou James [NPC], o Mestre do Templo. Meu trabalho é garantir que você não seja derrotado por trolls e aprenda tudo sobre a rede Stellar!",
      "Para começar a sua jornada e poder negociar Runas Raras, você precisa de uma conta/carteira Stellar para guardar seus ativos de batalha.",
      "Siga para o Leste (direita) cruzando a ponte e fale com Kael [NPC], o Ferreiro de Raros, para forjar suas chaves mágicas!"
    ],
    activeQuestDialogs: [
      "Ainda sem uma conta? Vá para o Leste e fale com o Kael [NPC] para forjar seu par de chaves criptográficas!"
    ],
    completedDialogs: [
      "Sensacional! Você já registrou sua carteira Stellar. Veja seu endereço seguro no HUD na barra superior!",
      "Sua próxima missão é adquirir suas primeiras moedas XLM. O corredor ao Norte foi liberado!",
      "Entre no Portal Norte e fale com o lendário Capitão HC [NPC] na guarita de câmbio para realizar seu primeiro On-Ramp!"
    ],
    color: "#0c3150",
    accentColor: "#f0b000",
    emoji: "🧙‍♂️",
  },
  {
    id: "keymaster",
    name: "Kael [NPC]",
    x: 52,
    y: 30,
    dir: "left",
    dialogs: [
      "Saudações de batalha! Eu sou o Kael [NPC], o maior ferreiro de Magic Plate Armors e Elmos Raros deste templo.",
      "Na Stellar, você não faz login com e-mail e senha tradicionais. Você cria sua conta através de Criptografia Assimétrica de herói!",
      "A Chave Pública (começa com 'G') é o seu endereço ou ID do Templo. Todos no continente podem ver para te enviar moedas.",
      "A Chave Secreta (começa com 'S') é a chave do seu baú pessoal de tesouros. Se algum orc conseguir ela, levará todos os seus raros! Nunca revele ela a ninguém!",
      "Aproxime-se do Altar de Chaves logo atrás de mim para forjar a sua conta!"
    ],
    activeQuestDialogs: [
      "Use o terminal azul de chaves cybernéticas para gerar seu par de chaves e receber seu endereço de hotel!"
    ],
    completedDialogs: [
      "Sua conta foi criada e registrada com sucesso no Ledger da rede Stellar!",
      "Agora que possui uma identidade, você está pronto para pegar moedas de catálogo. Siga para o Norte e fale com o Capitão HC [NPC]!"
    ],
    questTrigger: "wallet",
    color: "#ea580c",
    accentColor: "#f97316",
    emoji: "🧝",
  },
  {
    id: "portmaster",
    name: "Capitão HC [NPC]",
    x: 30,
    y: 8,
    dir: "down",
    dialogs: [
      "Ahoy, aventureiro! Eu sou o Capitão HC [NPC], encarregado das rotas navais e das pontes financeiras do continente.",
      "Na rede Stellar, chamamos as rampas de depósito e saque de 'Anchors' (Âncoras). Elas convertem ouro fictício em moedas digitais de verdade (XLM).",
      "Sem uma âncora, as moedas do mundo real não conseguiriam entrar na blockchain!",
      "Aproxime-se do Altar de Câmbio ao meu lado para fazer um depósito de ouro simulado e ganhar suas primeiras Crystal Coins!"
    ],
    activeQuestDialogs: [
      "Acesse o Terminal de Câmbio ao meu lado para depositar via PIX ou Cartão fictício e carregar seu saldo!"
    ],
    completedDialogs: [
      "Transação de elite, aventureiro! A âncora identificou seu depósito e enviou 150 XLM de saldo para você.",
      "Seu saldo atualizado já brilha no topo direito! Agora você pode negociar ativos no catálogo.",
      "Siga para o Leste até o Mercado de Soroban para negociar via Smart Contracts!"
    ],
    questTrigger: "onramp",
    color: "#16a34a",
    accentColor: "#22c55e",
    emoji: "👑",
  },
  {
    id: "scholar",
    name: "Alquimista [NPC]",
    x: 8,
    y: 30,
    dir: "right",
    dialogs: [
      "Bem-vindo à Central de Negociação do Templo!",
      "Soroban é o motor de contratos inteligentes (Smart Contracts) ultra-eficientes da Stellar.",
      "Com eles, programamos regras financeiras inquebráveis. Podemos trocar (Swap) moedas instantaneamente sem intermediários ou bancos!",
      "Para provar suas habilidades, aproxime-se do painel alquímico roxo ao meu lado.",
      "Dispare o contrato inteligente para trocar 50 XLM por USDC (Dólar Digital) ou tokens de governança SORO!"
    ],
    activeQuestDialogs: [
      "Aproxime-se do terminal roxo de Soroban e execute o swap automático via Smart Contract!"
    ],
    completedDialogs: [
      "Magnífico! A troca foi liquidada em menos de 2 segundos com taxas de centésimos de centavo!",
      "Seu inventário agora possui USDC e tokens SORO. Você é um mestre da negociação no catálogo!",
      "O último teste te aguarda no Sul. Vá até a Câmara de Hold e fale com Bobba [NPC], o Ancião!"
    ],
    questTrigger: "soroban",
    color: "#7c3aed",
    accentColor: "#8b5cf6",
    emoji: "🔮",
  },
  {
    id: "sage",
    name: "Bobba [NPC]",
    x: 30,
    y: 52,
    dir: "up",
    dialogs: [
      "Bobba bobba bobba! Que jornada fantástica, jovem guerreiro!",
      "Você forjou chaves, adquiriu moedas com o Anchor e negociou raros usando contratos inteligentes Soroban.",
      "O teste final é a virtude máxima: a paciência e lealdade, isto é, fazer 'Hold'.",
      "Travar suas moedas em um contrato de garantia (Escrow) descentralizado comprova que você é um holder fiel ao ecossistema.",
      "Aproxime-se da Câmara Dourada de Hold à frente para travar um percentual de XLM e ganhar o título de Guardião Lendário!"
    ],
    activeQuestDialogs: [
      "Interaja com a Câmara Sagrada dourada para selar seu hold de longo prazo e ganhar a insígnia definitiva!"
    ],
    completedDialogs: [
      "🌟 O templo celebra em festa! Você concluiu todos os módulos do Onboarding Archipelago!",
      "Suas moedas estão trancadas em segurança no cofre. Você é oficialmente um Guardião Lendário Stellar Holder!",
      "Lembre-se: transações velozes, taxas ínfimas e finanças acessíveis de verdade. Agora relaxe na taverna com hidromel! Bobba!"
    ],
    questTrigger: "hold",
    color: "#ca8a04",
    accentColor: "#eab308",
    emoji: "🧙‍♂️",
  }
];

// Helper to determine if a tile blocks movement (Collision logic)
export function isCollidable(tileType: number): boolean {
  return (
    tileType === TileType.WATER ||
    tileType === TileType.WALL ||
    tileType === TileType.BLOCK ||
    tileType === TileType.FENCE
  );
}

// Check if a bridge path is blocked by quest barriers
export function isBridgeBlocked(c: number, r: number, quests: Record<string, Quest>): { blocked: boolean; message: string } {
  // Bridge to North (Anchor Port): col 29..30, rows 13..17
  if ((c === 29 || c === 30) && r >= 13 && r <= 17) {
    if (quests.wallet.status !== "completed") {
      return { 
        blocked: true, 
        message: "north" 
      };
    }
  }

  // Bridge to West (Soroban Smart Swap): row 29..30, cols 13..17
  if ((r === 29 || r === 30) && c >= 13 && c <= 17) {
    if (quests.onramp.status !== "completed") {
      return { 
        blocked: true, 
        message: "west" 
      };
    }
  }

  // Bridge to South (Santuário do Holder): col 29..30, rows 43..47
  if ((c === 29 || c === 30) && r >= 43 && r <= 47) {
    if (quests.soroban.status !== "completed") {
      return { 
        blocked: true, 
        message: "south" 
      };
    }
  }

  return { blocked: false, message: "" };
}
