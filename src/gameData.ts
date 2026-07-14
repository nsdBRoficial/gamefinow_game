/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
}

// Decoration interface for high-fidelity assets
export interface GameDecoration {
  x: number;
  y: number;
  type: "tree" | "bench" | "lamp" | "barrel" | "box" | "statue" | "flower_pot";
  color?: string;
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

// Export decorations list
export const MAP_DECORATIONS: GameDecoration[] = [
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

  // NEW Scenic decorations for the massive expanded islands
  { x: 12, y: 4, type: "tree" },
  { x: 48, y: 4, type: "tree" },
  { x: 15, y: 8, type: "lamp" },
  { x: 45, y: 8, type: "lamp" },
  { x: 12, y: 56, type: "tree" },
  { x: 48, y: 56, type: "tree" },
  { x: 15, y: 52, type: "lamp" },
  { x: 45, y: 52, type: "lamp" },
  { x: 4, y: 12, type: "tree" },
  { x: 4, y: 48, type: "tree" },
  { x: 8, y: 15, type: "lamp" },
  { x: 8, y: 45, type: "lamp" },
  { x: 56, y: 12, type: "tree" },
  { x: 56, y: 48, type: "tree" },
  { x: 52, y: 15, type: "lamp" },
  { x: 52, y: 45, type: "lamp" },
];

// Generate the procedural map grid with hedges, portals, and pathways
export function generateMap(): number[][] {
  const grid: number[][] = [];
  
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.WATER;

      // 1. Center Island (Spawn Town Square): cols 18..42, rows 18..42 (expanded!)
      if (c >= 18 && c <= 42 && r >= 18 && r <= 42) {
        // Outer Hedge Border
        if (c === 18 || c === 42 || r === 18 || r === 42) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.GRASS;
        }

        // Beautiful town crossroads cobblestone path
        if ((c >= 27 && c <= 33) || (r >= 27 && r <= 33)) {
          tile = TileType.STONE_PATH;
        }
      }
      
      // 2. North Island (Anchor Port): cols 10..50, rows 1..12 (expanded!)
      else if (c >= 10 && c <= 50 && r >= 1 && r <= 12) {
        if (r === 12) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.FLOOR_DARK;
        }
        if (c === 10 || c === 50 || r === 1) {
          tile = TileType.WALL;
        }
      }

      // 3. South Island (Holder Sanctuary): cols 10..50, rows 48..59 (expanded!)
      else if (c >= 10 && c <= 50 && r >= 48 && r <= 59) {
        if (r === 48) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.TEMPLE_FLOOR;
        }
        if (c === 10 || c === 50 || r === 59) {
          tile = TileType.WALL;
        }
      }

      // 4. West Island (Soroban Smart Swap): cols 1..12, rows 10..50 (expanded!)
      else if (c >= 1 && c <= 12 && r >= 10 && r <= 50) {
        if (c === 12) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.FLOOR_DARK;
        }
        if (c === 1 || r === 10 || r === 50) {
          tile = TileType.WALL;
        }
      }

      // 5. East Island (Wallet Forge): cols 48..59, rows 10..50 (expanded!)
      else if (c >= 48 && c <= 59 && r >= 10 && r <= 50) {
        if (c === 48) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.TEMPLE_FLOOR;
        }
        if (c === 59 || r === 10 || r === 50) {
          tile = TileType.WALL;
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
    title: "1. Registro no Templo de Thais",
    description: "Crie a sua própria conta segura na rede Stellar gerando seu par de chaves públicas e privadas.",
    instructions: "Entre no Portal Leste (Ciano) na recepção para ir à Forja do Destino e fale com Pixel, o Ferreiro de Itens Raros.",
    reward: "Chave Pública (Endereço G...) + Chave Secreta (Seed Secreta)",
    status: "active",
  },
  onramp: {
    id: "onramp",
    title: "2. Adquirir Moedas do Templo (On-Ramp)",
    description: "Compre seus primeiros Lumens (XLM) convertendo ouro fictício no balcão de câmbio do templo.",
    instructions: "Entre no Portal Norte (Verde) para ir ao Porto de Câmbio e fale com o Capitão HC.",
    reward: "150 XLM de moedas para gastar no continente",
    status: "locked",
  },
  soroban: {
    id: "soroban",
    title: "3. Negociar Raros Soroban (Smart Contracts)",
    description: "Use contratos inteligentes Soroban para trocar seus XLM por USDC (Ouro Estável) ou Runas de Batalha SORO.",
    instructions: "Entre no Portal Oeste (Roxo) para ir ao Mercado do Templo e fale com a Alquimista.",
    reward: "Runas de Batalha SORO + USDC de Platina",
    status: "locked",
  },
  hold: {
    id: "hold",
    title: "4. Cofre do VIP Legend Holder",
    description: "Mostre seu compromisso de longo prazo travando suas moedas em um cofre inteligente para se tornar um Guardião Lendário.",
    instructions: "Entre no Portal Sul (Dourado) para ir à Câmara Secreta e fale com Bobba, o Ancião.",
    reward: "Título de Guardião Lendário VIP Stellar Holder 🌟",
    status: "locked",
  },
};

// NPCs list
export const INITIAL_NPCS: NPC[] = [
  {
    id: "guide",
    name: "Frank, o Mestre do Templo",
    x: 27,
    y: 28,
    dir: "down",
    dialogs: [
      "Olá, jovem herói! Bem-vindo ao saguão principal do Templo Stellar!",
      "Eu sou Frank, o Mestre do Templo. Meu trabalho é garantir que você não seja derrotado por trolls e aprenda tudo sobre a rede Stellar!",
      "Para começar a sua jornada e poder negociar Runas Raras, você precisa de uma conta/carteira Stellar para guardar seus ativos de batalha.",
      "Siga para o Leste (direita) cruzando a ponte e fale com Pixel, o Ferreiro de Raros, para forjar suas chaves mágicas!"
    ],
    activeQuestDialogs: [
      "Ainda sem uma conta? Vá para o Leste e fale com o Pixel para forjar seu par de chaves criptográficas!"
    ],
    completedDialogs: [
      "Sensacional! Você já registrou sua carteira Stellar. Veja seu endereço seguro no HUD na barra superior!",
      "Sua próxima missão é adquirir suas primeiras moedas XLM. O corredor ao Norte foi liberado!",
      "Entre no Portal Norte e fale com o lendário Capitão HC na guarita de câmbio para realizar seu primeiro On-Ramp!"
    ],
    color: "#0c3150",
    accentColor: "#f0b000",
    emoji: "🧙‍♂️",
  },
  {
    id: "keymaster",
    name: "Pixel, o Ferreiro de Raros",
    x: 52,
    y: 30,
    dir: "left",
    dialogs: [
      "Saudações de batalha! Eu sou o Pixel, o maior ferreiro de Magic Plate Armors e Elmos Raros deste templo.",
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
      "Agora que possui uma identidade, você está pronto para pegar moedas de catálogo. Siga para o Norte e fale com o Capitão HC!"
    ],
    questTrigger: "wallet",
    color: "#ea580c",
    accentColor: "#f97316",
    emoji: "🧝",
  },
  {
    id: "portmaster",
    name: "Capitão HC (Herói do Continente)",
    x: 30,
    y: 8,
    dir: "down",
    dialogs: [
      "Ahoy, aventureiro! Eu sou o Capitão HC, encarregado das rotas navais e das pontes financeiras do continente.",
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
    name: "Alquimista de Soroban",
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
      "O último teste te aguarda no Sul. Vá até a Câmara de Hold e fale com Bobba, o Ancião!"
    ],
    questTrigger: "soroban",
    color: "#7c3aed",
    accentColor: "#8b5cf6",
    emoji: "🔮",
  },
  {
    id: "sage",
    name: "Bobba, o Sábio do Deserto",
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
  },
];

// Helper to determine if a tile blocks movement (Collision logic)
export function isCollidable(tileType: number): boolean {
  return (
    tileType === TileType.WATER ||
    tileType === TileType.WALL
  );
}

// Check if a bridge path is blocked by quest barriers
export function isBridgeBlocked(c: number, r: number, quests: Record<string, Quest>): { blocked: boolean; message: string } {
  // Bridge to North (Anchor Port): col 29..30, rows 13..17
  if ((c === 29 || c === 30) && r >= 13 && r <= 17) {
    if (quests.wallet.status !== "completed") {
      return { 
        blocked: true, 
        message: "O portão de energia Azul está trancado! Complete a missão 'Forja da Carteira' no Leste para liberá-lo." 
      };
    }
  }

  // Bridge to West (Soroban Smart Swap): row 29..30, cols 13..17
  if ((r === 29 || r === 30) && c >= 13 && c <= 17) {
    if (quests.onramp.status !== "completed") {
      return { 
        blocked: true, 
        message: "O portão de energia Roxo está trancado! Complete a missão 'Portal de Câmbio (On-Ramp)' no Norte para liberá-lo." 
      };
    }
  }

  // Bridge to South (Santuário do Holder): col 29..30, rows 43..47
  if ((c === 29 || c === 30) && r >= 43 && r <= 47) {
    if (quests.soroban.status !== "completed") {
      return { 
        blocked: true, 
        message: "O portão de energia Dourado está trancado! Complete a missão 'Mercado Soroban' no Oeste para liberá-lo." 
      };
    }
  }

  return { blocked: false, message: "" };
}
