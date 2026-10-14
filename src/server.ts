/**
 * -----------------------------------------------------------------------------
 * 🛠️ SERVIDORES DE BACKEND, MULTIPLAYER REALTIME (SOCKET.IO) & RELAYER STELLAR
 * -----------------------------------------------------------------------------
 * Módulo principal responsável por:
 * 1. Inicializar o servidor Express e Socket.io para comunicação MMO em tempo real.
 * 2. Autenticação e validação de tokens JWT para permissões de GM (Game Master).
 * 3. Integração direta com Supabase PostgreSQL para controle de banimentos e punições.
 * 4. Endpoint Relayer (/api/relayer/submit) que inspeciona e valida atômica e on-chain
 *    a presença da taxa da Tesouraria (0.5% em XLM) antes da publicação na Stellar Testnet.
 * -----------------------------------------------------------------------------
 */
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { Keypair, Horizon, Networks, TransactionBuilder, Operation, Asset, Transaction, Memo } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

import { adminRouter } from "./routes/adminRoutes";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
app.set("io", io);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const VAULT_SEED = process.env.VAULT_SEED || "walletnow-vault"; // Fallback para desenvolvimento local apenas

let VAULT_KEYPAIR: Keypair;
try {
  VAULT_KEYPAIR = Keypair.fromSecret(VAULT_SEED);
} catch (e) {
  console.log("Inicializando com seed fallback local.");
  const encoder = new TextEncoder();
  const seedBytes = new Uint8Array(32);
  const textBytes = encoder.encode(VAULT_SEED);
  seedBytes.set(textBytes.slice(0, 32));
  VAULT_KEYPAIR = Keypair.fromRawEd25519Seed(Buffer.from(seedBytes));
}

// Inicializa a conexão com o Stellar Horizon Testnet
const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org");

const ISSUER_USDW = "GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ";
const ISSUER_BRW = "GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "super-secret-jwt-token-with-at-least-32-characters";

function getAsset(code: string) {
  if (code === "XLM") return Asset.native();
  if (code === "USDW") return new Asset("USDW", ISSUER_USDW);
  if (code === "BRW") return new Asset("BRW", ISSUER_BRW);
  return Asset.native();
}

// ─── Endpoint de Autenticação Supabase (Achado 4) ──────────────────────────
app.post("/api/auth/token", (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: "Missing publicKey" });

  try {
    // Valida se a chave é válida na curva Ed25519 do Stellar, a menos que seja anônimo
    if (!publicKey.startsWith("anon_")) {
      Keypair.fromPublicKey(publicKey);
    }

    // Emite um JWT para o Supabase com o payload exigido (papel: authenticated)
    const token = jwt.sign(
      {
        aud: "authenticated",
        role: "authenticated",
        sub: crypto.randomUUID(),       // GoTrue EXIGE que o sub seja um UUID válido
        app_metadata: { stellar_address: publicKey }, // A RLS vai ler daqui!
        email: `${publicKey.substring(0, 10)}@gamefinow.local` 
      },
      SUPABASE_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });
  } catch (err: any) {
    console.error("Auth token error for publicKey:", publicKey, "Error:", err);
    return res.status(400).json({ error: "Invalid public key or server error", details: err?.message });
  }
});

app.use("/api/admin", adminRouter);

// ─── Endpoints do Relayer (Validação e Fee) ──────────────────────────────────

const GAMEFI_TREASURY_PUBLIC_KEY = process.env.VITE_GAMEFI_TREASURY_PUBLIC_KEY || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
const GAMEFI_FEE_PERCENTAGE = 0.005;

const ESTIMATED_XLM_RATES: Record<string, number> = {
  XLM: 1.0, USDW: 8.0, USDC: 8.0, BRW: 1.5, SRT: 0.5, GAMEFI: 2.0
};

function estimateFeeInXlm(assetCode: string, amount: number): number {
  const rateInXlm = ESTIMATED_XLM_RATES[assetCode.toUpperCase()] || 1.0;
  const feeInXlm = (amount * rateInXlm) * GAMEFI_FEE_PERCENTAGE;
  return Number(Math.max(feeInXlm, 0.01).toFixed(7));
}

app.post("/api/relayer/submit", async (req, res) => {
  const { signedXdr } = req.body;
  if (!signedXdr) return res.status(400).json({ error: "Missing signedXdr" });

  try {
    const tx = new Transaction(signedXdr, Networks.TESTNET);
    let requiresFee = false;
    let requiredFeeAmount = 0;
    let paidFeeAmount = 0;
    
    // Parse operations to find if there's a stake/swap and check if fee was paid
    for (const op of tx.operations) {
      if (op.type === "payment") {
        if (op.destination === VAULT_KEYPAIR.publicKey()) {
          requiresFee = true;
          requiredFeeAmount += estimateFeeInXlm(op.asset.isNative() ? "XLM" : op.asset.code, parseFloat(op.amount));
        } else if (op.destination === GAMEFI_TREASURY_PUBLIC_KEY && op.asset.isNative()) {
          paidFeeAmount += parseFloat(op.amount);
        }
      } else if (op.type === "pathPaymentStrictSend") {
        requiresFee = true;
        requiredFeeAmount += estimateFeeInXlm(op.sendAsset.isNative() ? "XLM" : op.sendAsset.code, parseFloat(op.sendAmount));
      }
    }

    // Verify Fee
    if (requiresFee) {
      // Allow a small floating point margin (0.0001)
      if (paidFeeAmount < (requiredFeeAmount - 0.0001)) {
        console.warn(`[Relayer] Blocked TX. Required fee: ${requiredFeeAmount}, Paid: ${paidFeeAmount}`);
        return res.status(400).json({ error: `Taxa do GameFi não paga corretamente. Necessário: ${requiredFeeAmount} XLM` });
      }
    }

    console.log("[Relayer] TX Validada e Aprovada! Submetendo...");
    const response = await horizonServer.submitTransaction(tx);
    return res.json({ txHash: response.hash });
  } catch (error: any) {
    console.error("[Relayer] Erro ao submeter TX:", error?.response?.data || error);
    return res.status(500).json({ error: "Falha na simulação/submissão da transação." });
  }
});

// ─── Endpoints do Vault ──────────────────────────────────────────────────
app.post("/api/vault/withdraw", async (req, res) => {
  const { walletAddress, asset, amount } = req.body;

  if (!walletAddress || !asset || !amount) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log(`[Backend Vault] Iniciando saque de ${amount} ${asset} para ${walletAddress}`);
    
    // Verifica a existência do Vault
    const vaultAddress = VAULT_KEYPAIR.publicKey();
    const vaultAcc = await horizonServer.loadAccount(vaultAddress);
    const assetObj = getAsset(asset);

    const tx = new TransactionBuilder(vaultAcc, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        Operation.payment({
          destination: walletAddress,
          asset: assetObj,
          amount: parseFloat(amount).toFixed(7)
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(VAULT_KEYPAIR);
    
    console.log("[Backend Vault] Submetendo transação...");
    const response = await horizonServer.submitTransaction(tx);
    
    console.log(`[Backend Vault] Sucesso: ${response.hash}`);
    return res.json({ txHash: response.hash });

  } catch (error: any) {
    console.error("[Backend Vault] Erro no saque:", error?.response?.data || error);
    return res.status(500).json({ error: "Erro ao realizar o saque do vault" });
  }
});

// ─── Endpoint de Recompensa de Mineração (Mint On-Chain GAMEFI) ─────────────
const GAMEFI_ASSET_CODE = process.env.VITE_GAMEFI_TOKEN_CODE || "GAMEFI";
const GAMEFI_ASSET_ISSUER = process.env.VITE_GAMEFI_TOKEN_ISSUER || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";

// Tabela de recompensas por raridade (min, max)
const MINING_REWARDS: Record<string, { gems: [number, number]; gamefi: [number, number]; xp: number; minDurationMs: number }> = {
  common:   { gems: [1, 2],   gamefi: [0.5, 1],   xp: 50,   minDurationMs: 5   * 60 * 1000 },
  uncommon: { gems: [3, 5],   gamefi: [2, 4],     xp: 150,  minDurationMs: 15  * 60 * 1000 },
  rare:     { gems: [8, 12],  gamefi: [8, 15],    xp: 400,  minDurationMs: 30  * 60 * 1000 },
  epic:     { gems: [20, 30], gamefi: [30, 50],   xp: 1000, minDurationMs: 60  * 60 * 1000 },
};

// Anti-abuse: guarda o timestamp de início da mineração por carteira
const activeMiningMap = new Map<string, { startedAt: number; rarity: string }>();

app.post("/api/mining/start", (req, res) => {
  const { walletAddress, rarity } = req.body;
  if (!walletAddress || !rarity || !MINING_REWARDS[rarity]) {
    return res.status(400).json({ error: "walletAddress e rarity válidos são obrigatórios." });
  }
  activeMiningMap.set(walletAddress, { startedAt: Date.now(), rarity });
  console.log(`[Mining] Início registrado para ${walletAddress} | Raridade: ${rarity}`);
  return res.json({ success: true, startedAt: Date.now() });
});

app.post("/api/mining/collect", async (req, res) => {
  const { walletAddress, rarity } = req.body;

  if (!walletAddress || !rarity || !MINING_REWARDS[rarity]) {
    return res.status(400).json({ error: "walletAddress e rarity válidos são obrigatórios." });
  }

  // Validação anti-abuse: verifica se o tempo mínimo passou
  const miningEntry = activeMiningMap.get(walletAddress);
  const rewardConfig = MINING_REWARDS[rarity];

  if (!miningEntry || miningEntry.rarity !== rarity) {
    return res.status(400).json({ error: "Nenhuma mineração ativa encontrada para esta carteira e raridade." });
  }

  const elapsed = Date.now() - miningEntry.startedAt;
  if (elapsed < rewardConfig.minDurationMs - 5000) { // 5s de tolerância
    const remaining = Math.ceil((rewardConfig.minDurationMs - elapsed) / 1000);
    return res.status(400).json({ error: `Mineração ainda não concluída. Aguarde mais ${remaining}s.` });
  }

  // Calcula recompensas com aleatoriedade dentro da faixa
  const randBetween = (min: number, max: number) =>
    Number((Math.random() * (max - min) + min).toFixed(7));

  const gems = Math.floor(randBetween(rewardConfig.gems[0], rewardConfig.gems[1] + 1));
  const gamefiAmount = randBetween(rewardConfig.gamefi[0], rewardConfig.gamefi[1]);
  const xp = rewardConfig.xp;

  try {
    console.log(`[Mining] Iniciando mint de ${gamefiAmount} ${GAMEFI_ASSET_CODE} para ${walletAddress}`);

    const vaultAcc = await horizonServer.loadAccount(VAULT_KEYPAIR.publicKey());
    const gamefiAsset = new Asset(GAMEFI_ASSET_CODE, GAMEFI_ASSET_ISSUER);

    const tx = new TransactionBuilder(vaultAcc, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: walletAddress,
          asset: gamefiAsset,
          amount: gamefiAmount.toFixed(7),
        })
      )
      .addMemo(Memo.text(`Mining:${rarity}:${gems}gems`))
      .setTimeout(30)
      .build();

    tx.sign(VAULT_KEYPAIR);

    console.log("[Mining] Submetendo transação on-chain...");
    const response = await horizonServer.submitTransaction(tx);
    const txHash = response.hash;

    // Remove da lista de ativos após coleta
    activeMiningMap.delete(walletAddress);

    console.log(`[Mining] ✅ Mint concluído! Hash: ${txHash} | Gems: ${gems} | GAMEFI: ${gamefiAmount} | XP: ${xp}`);

    return res.json({ txHash, gems, gamefi: gamefiAmount, xp, rarity });

  } catch (error: any) {
    console.error("[Mining] Erro no mint:", error?.response?.data || error);
    return res.status(500).json({ error: "Falha ao mintar GAMEFI on-chain. Tente novamente." });
  }
});

// ─── Socket.io Multiplayer ───────────────────────────────────────────────



interface PlayerState {
  socketId: string;
  mapId: string;
  playerId: string;
  payload: any;
  isGM?: boolean;
  moveCount?: number;
  lastMoveReset?: number;
  isSuspicious?: boolean;
}
export const playersState = new Map<string, PlayerState>();
app.locals.playersState = playersState;


function broadcastGlobalPresence() {
  const globalSummary: Array<{ playerId: string; name: string; mapId: string; level?: number; playerClass?: string; guildTag?: string }> = [];
  playersState.forEach((state) => {
    globalSummary.push({
      playerId: state.playerId,
      name: state.payload?.name || "Anônimo",
      mapId: state.mapId,
      level: state.payload?.level || 1,
      playerClass: state.payload?.playerClass,
      guildTag: state.payload?.guildTag,
    });
  });

  io.emit("global_online_sync", {
    totalOnline: playersState.size,
    players: globalSummary,
  });
}

// ─── Sistema PVP Arena (Server-Authoritative) ────────────────────────────────

/** Mapa de sessões PVP ativas: sessionId → PvpSession */
const pvpSessions = new Map<string, any>();

/** Mapa de qual sessão cada player está: playerId → sessionId */
const playerSessionMap = new Map<string, string>();

/** Timestamps do último ataque por player (anti-spam) */
const lastAttackTime = new Map<string, number>();

/** Timestamps do último cast por player (GCD server-side) */
const lastSpellTime = new Map<string, number>();

/** GCDs das magias (ms) — espelhados do gameStore */
const SERVER_SPELL_GCD: Record<string, number> = {
  heal: 800, fire: 1500, lightning: 2500, default: 1000
};

/** Range máximo de ataque por tipo */
const SERVER_ATTACK_RANGE: Record<string, number> = {
  physical_melee: 2, physical_ranger: 3, magic_damage: 5, magic_heal: 6,
};

/** Classe → tipo de ataque físico */
function getPhysicalRangeByClass(playerClass?: string): number {
  if (playerClass === "cosmic_ranger") return SERVER_ATTACK_RANGE.physical_ranger;
  return SERVER_ATTACK_RANGE.physical_melee;
}

/** Distância euclidiana entre dois jogadores na arena */
function arenaDistance(a: any, b: any): number {
  return Math.sqrt(Math.pow(a.arenaX - b.arenaX, 2) + Math.pow(a.arenaY - b.arenaY, 2));
}

/** Calcula dano físico PVP (server-authoritative) */
function serverCalcPhysicalDmg(attacker: any, target: any): { damage: number; isCrit: boolean } {
  const strBonus = (attacker.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => acc + (b.statModifiers?.strBonus ?? 0), 0);

  const agiBonus = (attacker.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => acc + (b.statModifiers?.agiBonus ?? 0), 0);

  const baseAtk = (attacker.attack || 10) * (1 + strBonus / 100);
  const baseDefense = (target.defense || 5) / 2;
  const baseDmg = Math.max(1, baseAtk - baseDefense);
  const roll = 0.85 + Math.random() * 0.3;
  const critChance = 0.05 + agiBonus / 100;
  const isCrit = Math.random() < critChance;
  const critMult = isCrit ? 2.0 : 1.0;

  // Redução de dano dos buffs defensivos do alvo
  const defReduction = (target.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => {
      if (b.statModifiers?.invulnerable) return 1; // Flag para invulnerabilidade
      return acc + (b.statModifiers?.damageReduction ?? 0);
    }, 0);
  const defFactor = Math.max(0.2, 1 - defReduction);

  const finalDmg = Math.max(1, Math.floor(baseDmg * roll * critMult * defFactor));

  // Anti-cheat: teto máximo por nível
  const maxAllowed = (attacker.level || 1) * 80;
  return { damage: Math.min(finalDmg, maxAllowed), isCrit };
}

/** Calcula dano mágico PVP (server-authoritative) */
function serverCalcMagicDmg(attacker: any, spellPower: number, target: any): { damage: number; isCrit: boolean } {
  const intBonus = (attacker.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => acc + (b.statModifiers?.intBonus ?? 0), 0);

  const agiBonus = (attacker.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => acc + (b.statModifiers?.agiBonus ?? 0), 0);

  const intValue = (attacker.attack || 10) + intBonus;
  const baseDmg = (spellPower || 30) * (1 + intValue / 80);
  const roll = 0.85 + Math.random() * 0.3;
  const critChance = 0.05 + agiBonus / 100;
  const isCrit = Math.random() < critChance;
  const critMult = isCrit ? 2.0 : 1.0;

  const defFactor = (target.activeBuffs || [])
    .filter((b: any) => b.expiresAt > Date.now())
    .reduce((acc: number, b: any) => {
      if (b.statModifiers?.invulnerable) return 0;
      return Math.max(0.2, acc - (b.statModifiers?.damageReduction ?? 0));
    }, 1.0);

  const finalDmg = Math.max(1, Math.floor(baseDmg * roll * critMult * defFactor));
  const maxAllowed = (attacker.level || 1) * 80;
  return { damage: Math.min(finalDmg, maxAllowed), isCrit };
}

/** Verifica se a partida acabou e emite o resultado */
function checkArenaEnd(session: any, sessionId: string): void {
  const alive = session.players.filter((p: any) => !p.isEliminated);
  if (alive.length > 1) return; // Ainda há combate

  session.status = "finished";
  session.finishedAt = Date.now();

  const winner = alive[0] || null;
  if (winner) {
    session.winnerId = winner.playerId;
    session.winnerName = winner.name;
  }

  // Calcula recompensas
  const rewards: Record<string, { xp: number; gamefi: number; result: string }> = {};
  session.players.forEach((p: any, idx: number) => {
    if (winner && p.playerId === winner.playerId) {
      rewards[p.playerId] = { xp: 150, gamefi: 0.5, result: "victory" };
    } else if (idx === 1) {
      rewards[p.playerId] = { xp: 60, gamefi: 0, result: "runner_up" };
    } else {
      rewards[p.playerId] = { xp: 30, gamefi: 0, result: "eliminated" };
    }
  });

  io.to(`arena:${sessionId}`).emit("arena_match_end", {
    winnerId: winner?.playerId ?? null,
    winnerName: winner?.name ?? null,
    sessionId,
    rewards,
  });

  console.log(`[Arena] Sessão ${sessionId} finalizada. Vencedor: ${winner?.name ?? "Nenhum"}`);

  // Limpa a sessão após 10s
  setTimeout(() => {
    pvpSessions.delete(sessionId);
    session.players.forEach((p: any) => playerSessionMap.delete(p.playerId));
    // Limpa timestamps
    session.players.forEach((p: any) => {
      lastAttackTime.delete(p.playerId);
      lastSpellTime.delete(p.playerId);
    });
    console.log(`[Arena] Sessão ${sessionId} removida da memória.`);
  }, 10000);
}

io.on("connection", (socket) => {
  console.log(`[Socket] Conexão recebida: ${socket.id}`);

  // Envia presença global inicial
  broadcastGlobalPresence();

  // Quando o jogador entra em um mapa
  socket.on("join_map", (data: { mapId: string, playerId: string, playerPayload: any, adminToken?: string }) => {
    let isGM = false;
    if (data.adminToken) {
      try {
        const decoded = jwt.verify(data.adminToken, SUPABASE_JWT_SECRET) as any;
        if (decoded.role === "admin") {
          isGM = true;
          data.playerPayload.isGM = true;
        }
      } catch(e) {}
    }

    const roomName = `map:${data.mapId}`;
    
    // Verifica se usuário está suspenso
    (async () => {
      try {
        console.log(`[DEBUG] join_map recebido para o player: ${data.playerId}`);
        // Usuários convidados anônimos não existem na tabela de players do Supabase
        if (data.playerId && !data.playerId.startsWith("anon_")) {
          const { data: userRow } = await supabaseAdmin
            .from("players")
            .select("is_banned, suspended_until")
            .eq("id", data.playerId)
            .maybeSingle();
            
          if (userRow) {
            const isSuspended = userRow.is_banned || (userRow.suspended_until && new Date(userRow.suspended_until) > new Date());
            if (isSuspended) {
              socket.emit("kick_user", { reason: "Sua conta está suspensa." });
              setTimeout(() => {
                socket.disconnect();
              }, 500);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("[Socket] Aviso ao verificar suspensão (ignorado para não interromper conexão):", e);
      }

      socket.rooms.forEach(room => {
        // Sai apenas de outras rooms de mapa e avisa o mapa anterior da saída
        if (room !== socket.id && room.startsWith("map:") && room !== roomName) {
          socket.to(room).emit("player_leave", { playerId: data.playerId });
          socket.leave(room);
        }
      });

      socket.join(roomName);
      console.log(`[Socket] ${data.playerId} entrou no mapa ${data.mapId}${isGM ? ' (GAME MASTER)' : ''}`);

      if (data.playerPayload) {
        data.playerPayload.map_id = data.mapId;
        data.playerPayload.player_id = data.playerId;
      }

      // Remove sessões anteriores do mesmo playerId (evita duplicatas e fantasmas ao recarregar a página)
      playersState.forEach((state, sId) => {
        if (sId !== socket.id && state.playerId === data.playerId) {
          playersState.delete(sId);
        }
      });

      // Guarda estado do jogador
      playersState.set(socket.id, {
        socketId: socket.id,
        mapId: data.mapId,
        playerId: data.playerId,
        payload: data.playerPayload,
        isGM
      });

      // Envia aos recém-chegados os jogadores que já estão no mapa
      const existingPlayers: any[] = [];
      playersState.forEach((state, sId) => {
        if (sId !== socket.id && state.mapId === data.mapId && state.payload) {
          state.payload.map_id = state.mapId;
          state.payload.player_id = state.playerId;
          existingPlayers.push(state.payload);
        }
      });
      socket.emit("sync_players", existingPlayers);

      // Avisa aos outros que ele chegou com as infos completas
      if (data.playerPayload) {
        socket.to(roomName).emit("player_move", data.playerPayload);
      }

      // Atualiza presença global para todos os clientes
      broadcastGlobalPresence();
    })();
  });

  // Quando o jogador se move ou altera a aparência
  socket.on("player_move", (data: { mapId: string, payload: any }) => {
    const state = playersState.get(socket.id);
    if (state) {
      const now = Date.now();
      if (!state.lastMoveReset || now - state.lastMoveReset > 1000) {
        state.lastMoveReset = now;
        state.moveCount = 0;
      }
      state.moveCount = (state.moveCount || 0) + 1;
      
      // Se mover mais de 25 vezes por segundo, marca como bot suspeito
      if (state.moveCount > 25) {
        state.isSuspicious = true;
      }

      state.mapId = data.mapId;
      if (data.payload) {
        data.payload.map_id = data.mapId;
        data.payload.player_id = state.playerId;
      }
      state.payload = data.payload;
      if (data.payload) {
        data.payload.isSuspicious = state.isSuspicious;
        if (state.isGM) {
          data.payload.isGM = true;
        }
      }
    }
    
    socket.to(`map:${data.mapId}`).emit("player_move", data.payload);
  });

  // Chat local do mapa e Comandos GM
  socket.on("chat_message", (data: { mapId: string, payload: any }) => {
    const state = playersState.get(socket.id);
    const text = data.payload?.text || "";

    if (state?.isGM && text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      if (cmd === "/announce") {
        const msg = args.join(" ");
        io.emit("announce", { msg, from: state.payload.name });
        return;
      }
      if (cmd === "/kick") {
        const targetId = args[0];
        io.emit("kick_user", { playerId: targetId, reason: "Kickado pelo Game Master" });
        return;
      }
      if (cmd === "/teleport") {
        const targetId = args[0];
        let targetMap = "";
        playersState.forEach((s) => {
          if (s.playerId === targetId) targetMap = s.mapId;
        });
        if (targetMap) {
          socket.emit("force_teleport", { mapId: targetMap });
        }
        return;
      }
    }

    socket.to(`map:${data.mapId}`).emit("chat_message", data.payload);
  });

  // Chat Global (Todos os mapas)
  socket.on("chat_global_message", (data: { payload: any }) => {
    io.emit("chat_global_message", data.payload);
  });

  // Gerenciamento de sala de Guilda
  socket.on("join_guild", (guildId: string) => {
    if (guildId) {
      socket.join(`guild:${guildId}`);
    }
  });

  socket.on("guild_chat_message", (data: { guildId: string, payload: any }) => {
    if (data.guildId) {
      io.to(`guild:${data.guildId}`).emit("guild_chat_message", data.payload);
    }
  });

  // ─── NOVO SISTEMA PVP UNIFICADO (OPEN-PVP NA ARENA) ──────────────────────
  socket.on("pvp_attack", (data: {
    attackerId: string;
    attackerName?: string;
    targetId: string;
    mapId: string;
    damage: number;
    isCrit?: boolean;
    timestamp?: number;
  }) => {
    let attackerState: PlayerState | null = null;
    let targetState: PlayerState | null = null;

    playersState.forEach((state) => {
      if (state.playerId === data.attackerId) attackerState = state;
      if (state.playerId === data.targetId) targetState = state;
    });

    if (!attackerState || !targetState) return;
    if (attackerState.mapId !== targetState.mapId) return;
    if (attackerState.mapId !== "arena" && !attackerState.isGM) return;

    const now = Date.now();
    const lastAtk = lastAttackTime.get(data.attackerId) || 0;
    if (now - lastAtk < 800) return;
    lastAttackTime.set(data.attackerId, now);

    const dist = Math.hypot(
      (attackerState.payload?.x ?? 0) - (targetState.payload?.x ?? 0),
      (attackerState.payload?.y ?? 0) - (targetState.payload?.y ?? 0)
    );
    if (dist > 3.5 && !attackerState.isGM) return;

    let { damage, isCrit } = serverCalcPhysicalDmg(attackerState.payload || {}, targetState.payload || {});
    if (data.damage && data.damage > 0) {
      damage = Math.min(data.damage, damage * 1.5);
    }
    if (data.isCrit !== undefined) {
      isCrit = data.isCrit;
    }

    const currentTargetHp = targetState.payload?.hp ?? 100;
    const maxTargetHp = targetState.payload?.maxHp ?? 100;
    const newTargetHp = Math.max(0, currentTargetHp - damage);
    targetState.payload.hp = newTargetHp;

    console.log(`[PVP] ${attackerState.payload?.name || data.attackerId} causou ${damage} em ${targetState.payload?.name || data.targetId} (HP: ${newTargetHp}/${maxTargetHp})`);

    io.to(`map:${attackerState.mapId}`).emit("pvp_player_hit", {
      attackerId: data.attackerId,
      attackerName: attackerState.payload?.name || "Guerreiro",
      targetId: data.targetId,
      damage,
      isCrit,
      currentHp: newTargetHp,
      maxHp: maxTargetHp,
      element: "physical",
    });

    if (newTargetHp <= 0) {
      console.log(`[PVP] 💀 ${targetState.payload?.name || data.targetId} derrotado!`);
      io.to(targetState.socketId).emit("player_killed", {
        killerName: attackerState.payload?.name || "Adversário",
        damage,
      });

      io.to(attackerState.socketId).emit("pvp_reward", {
        xp: 150,
        gamefi: 0.5,
        targetName: targetState.payload?.name || "Adversário",
      });

      io.to(`map:${attackerState.mapId}`).emit("chat_message", {
        id: Date.now().toString(),
        player_id: "system",
        player_name: "⚔️ ARENA",
        map_id: attackerState.mapId,
        message: `💀 ${targetState.payload?.name || "Um guerreiro"} foi derrotado por ${attackerState.payload?.name || "um adversário"}!`,
        created_at: new Date().toISOString(),
      });
    }
  });

  socket.on("pvp_cast_spell", (data: {
    attackerId: string;
    attackerName?: string;
    targetId: string;
    mapId: string;
    spellId: string;
    damage: number;
    isCrit?: boolean;
    element?: string;
    timestamp?: number;
  }) => {
    let attackerState: PlayerState | null = null;
    let targetState: PlayerState | null = null;

    playersState.forEach((state) => {
      if (state.playerId === data.attackerId) attackerState = state;
      if (state.playerId === data.targetId) targetState = state;
    });

    if (!attackerState) return;

    if (data.element === "heal") {
      const curHp = attackerState.payload?.hp ?? 100;
      const maxHp = attackerState.payload?.maxHp ?? 100;
      const healedHp = Math.min(maxHp, curHp + Math.max(15, Math.floor(maxHp * 0.25)));
      attackerState.payload.hp = healedHp;
      io.to(`map:${attackerState.mapId}`).emit("pvp_player_hit", {
        attackerId: data.attackerId,
        targetId: data.attackerId,
        damage: -(healedHp - curHp),
        isCrit: false,
        currentHp: healedHp,
        maxHp,
        element: "heal",
      });
      return;
    }

    if (!targetState) return;
    if (attackerState.mapId !== targetState.mapId) return;
    if (attackerState.mapId !== "arena" && !attackerState.isGM) return;

    const dist = Math.hypot(
      (attackerState.payload?.x ?? 0) - (targetState.payload?.x ?? 0),
      (attackerState.payload?.y ?? 0) - (targetState.payload?.y ?? 0)
    );
    if (dist > 5.5 && !attackerState.isGM) return;

    let damage = Math.max(5, data.damage || 35);
    const isCrit = data.isCrit || false;

    const currentTargetHp = targetState.payload?.hp ?? 100;
    const maxTargetHp = targetState.payload?.maxHp ?? 100;
    const newTargetHp = Math.max(0, currentTargetHp - damage);
    targetState.payload.hp = newTargetHp;

    io.to(`map:${attackerState.mapId}`).emit("pvp_player_hit", {
      attackerId: data.attackerId,
      attackerName: attackerState.payload?.name || "Mago",
      targetId: data.targetId,
      damage,
      isCrit,
      currentHp: newTargetHp,
      maxHp: maxTargetHp,
      element: data.element || "magic",
    });

    if (newTargetHp <= 0) {
      io.to(targetState.socketId).emit("player_killed", {
        killerName: attackerState.payload?.name || "Mago",
        damage,
      });
      io.to(attackerState.socketId).emit("pvp_reward", {
        xp: 150,
        gamefi: 0.5,
        targetName: targetState.payload?.name || "Adversário",
      });
      io.to(`map:${attackerState.mapId}`).emit("chat_message", {
        id: Date.now().toString(),
        player_id: "system",
        player_name: "⚔️ ARENA",
        map_id: attackerState.mapId,
        message: `⚡ ${targetState.payload?.name || "Um guerreiro"} foi obliterado por ${attackerState.payload?.name || "um mago"}!`,
        created_at: new Date().toISOString(),
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ⚔️ EVENTOS DE COMBATE PVP ARENA & SINCRONIZAÇÃO EM TEMPO REAL (v1.5pvp)
  // ─────────────────────────────────────────────────────────────────────────────
  // Gerencia o ciclo de vida completo dos duelos na Arena:
  // 1. Entrada e Pareamento (arena_join_request): alocação em salas isoladas e prevenção de fantasmas.
  // 2. Movimentação (arena_move): validação e difusão de coordenadas euclidianas.
  // 3. Combate Físico & Mágico (arena_attack, arena_cast_spell): range check, rolls e aplicação de dano.
  // 4. Eliminações & Placar (arena_player_hit, arena_player_eliminated): notificação broadcast.
  // 5. Desconexão e Limpeza (arena_leave & disconnect): remoção segura de jogadores ausentes.
  // ─────────────────────────────────────────────────────────────────────────────

  socket.on("arena_join_request", (data: { playerId: string, mode: string, sessionId?: string, playerPayload: any }) => {
    let session: any;
    let sessionId = data.sessionId;

    // ── Previne fantasmas: remove da sessão antiga se estiver reentrando em outra ──
    const oldSessionId = playerSessionMap.get(data.playerId);
    if (oldSessionId && oldSessionId !== sessionId) {
      const oldSession = pvpSessions.get(oldSessionId);
      if (oldSession) {
        const oldP = oldSession.players.find((pl: any) => pl.playerId === data.playerId);
        if (oldP && !oldP.isEliminated) {
          oldP.isEliminated = true;
          io.to(`arena:${oldSessionId}`).emit("arena_player_eliminated", { playerId: data.playerId });
          
          const alives = oldSession.players.filter((pl: any) => !pl.isEliminated);
          if (alives.length <= 1 && oldSession.status !== "waiting") {
            oldSession.status = "waiting";
            oldSession.preBattleUntil = undefined;
          }
          io.to(`arena:${oldSessionId}`).emit("arena_sync", oldSession);
        }
      }
      socket.leave(`arena:${oldSessionId}`);
      playerSessionMap.delete(data.playerId);
    }

    if (sessionId && pvpSessions.has(sessionId)) {
      session = pvpSessions.get(sessionId);
    } else {
      // Procura sessão waiting do mesmo modo (apenas FFA inicialmente)
      for (const [id, s] of pvpSessions.entries()) {
        if (s.status === "waiting" && s.mode === data.mode && s.players.length < 8) {
          session = s;
          sessionId = id;
          break;
        }
      }
      
      if (!session) {
        sessionId = `pvp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        session = {
          sessionId,
          mode: data.mode,
          status: "waiting",
          players: [],
        };
        pvpSessions.set(sessionId, session);
      }
    }

    socket.join(`arena:${sessionId}`);
    playerSessionMap.set(data.playerId, sessionId!);

    // Define spawn point
    const USED_SPAWNS = [
      { x: 2, y: 5 }, { x: 2, y: 6 },
      { x: 9, y: 5 }, { x: 9, y: 6 },
      { x: 5, y: 2 }, { x: 6, y: 2 },
      { x: 5, y: 9 }, { x: 6, y: 9 },
    ];
    let spawn = USED_SPAWNS[session.players.length % USED_SPAWNS.length];

    const p = data.playerPayload;
    p.arenaX = spawn.x;
    p.arenaY = spawn.y;
    p.isEliminated = false;
    
    // Atualiza ou insere jogador na sessão
    const existingIdx = session.players.findIndex((pl: any) => pl.playerId === data.playerId);
    if (existingIdx >= 0) {
      session.players[existingIdx] = p;
    } else {
      p.kills = 0;
      p.deaths = 0;
      session.players.push(p);
    }

    // Inicia a pré-batalha se tiver 2+ jogadores no FFA
    if (session.status === "waiting" && session.players.length >= 2) {
      session.status = "pre_battle";
      session.preBattleUntil = Date.now() + 10000; // 10s de contagem regressiva (reduzido de 30s)
      console.log(`[Arena] Sessão ${sessionId} PRÉ-BATALHA iniciada.`);
    }

    // Emite apenas para a room — o socket local está na room, então recebe tb
    io.to(`arena:${sessionId}`).emit("arena_sync", session);
  });

  socket.on("arena_move", (data: { sessionId: string, playerId: string, arenaX: number, arenaY: number, dir: string }) => {
    const session = pvpSessions.get(data.sessionId);
    if (!session || (session.status !== "in_progress" && session.status !== "pre_battle" && session.status !== "waiting")) return;

    const p = session.players.find((pl: any) => pl.playerId === data.playerId);
    if (p && !p.isEliminated) {
      p.arenaX = data.arenaX;
      p.arenaY = data.arenaY;
      p.dir = data.dir;
      // Emite apenas a movimentação para não travar o frontend com payload massivo
      io.to(`arena:${data.sessionId}`).emit("arena_player_move", {
        playerId: p.playerId,
        arenaX: p.arenaX,
        arenaY: p.arenaY,
        dir: p.dir,
      });
    }
  });

  socket.on("arena_attack", (data: { sessionId: string, attackerId: string, targetId: string, playerClass?: string, timestamp: number }) => {
    const session = pvpSessions.get(data.sessionId);
    if (!session || (session.status !== "in_progress" && session.status !== "pre_battle")) return;

    const attacker = session.players.find((p: any) => p.playerId === data.attackerId);
    const target = session.players.find((p: any) => p.playerId === data.targetId);
    
    if (!attacker || !target || attacker.isEliminated || target.isEliminated) return;

    // Validação de intervalo de ataque (Anti-spam)
    const now = Date.now();
    const lastAtk = lastAttackTime.get(data.attackerId) || 0;
    // Reduzimos o teto para evitar que o ataque seja bloqueado silenciosamente
    const interval = 800; // 800ms de limite server-side (menor que o GCD do client)
    
    if (now - lastAtk < interval) return;
    lastAttackTime.set(data.attackerId, now);

    // Validação de Range - Ampliada para evitar falhas visuais por desync do grid
    const maxRange = getPhysicalRangeByClass(data.playerClass) + 1.5;
    if (arenaDistance(attacker, target) > maxRange) {
      socket.emit("arena_out_of_range");
      return;
    }

    // Dano e HP
    let { damage, isCrit } = serverCalcPhysicalDmg(attacker, target);
    
    // Bloqueia dano na pré-batalha, mas envia animação visual
    if (session.status === "pre_battle") {
      damage = 0;
    }
    
    target.hp = Math.max(0, target.hp - damage);

    io.to(`arena:${data.sessionId}`).emit("arena_player_hit", {
      targetId: data.targetId,
      damage,
      isCrit,
      element: "physical",
    });

    if (target.hp <= 0 && !target.isEliminated) {
      target.isEliminated = true;
      target.deaths = (target.deaths || 0) + 1;
      attacker.kills = (attacker.kills || 0) + 1;
      target.respawnAt = Date.now() + 5000;
      io.to(`arena:${data.sessionId}`).emit("arena_player_eliminated", { playerId: data.targetId });
    }
    // Sempre envia o sync de HP 
    io.to(`arena:${data.sessionId}`).emit("arena_sync", session);
  });

  socket.on("arena_cast_spell", (data: { sessionId: string, attackerId: string, targetId: string | null, spellId: string, spellPower: number, element: string }) => {
    const session = pvpSessions.get(data.sessionId);
    if (!session || (session.status !== "in_progress" && session.status !== "pre_battle")) return;

    const attacker = session.players.find((p: any) => p.playerId === data.attackerId);
    if (!attacker || attacker.isEliminated) return;

    // Validação GCD
    const now = Date.now();
    const lastSpell = lastSpellTime.get(data.attackerId) || 0;
    const gcd = SERVER_SPELL_GCD[data.element] || SERVER_SPELL_GCD.default;
    
    if (now - lastSpell < gcd - 100) return;
    lastSpellTime.set(data.attackerId, now);

    if (data.element === "heal") {
      // Heal não tem range nem alvo específico (cura a si mesmo)
      const { damage } = serverCalcMagicDmg(attacker, data.spellPower, attacker);
      attacker.hp = Math.min(attacker.maxHp || 100, attacker.hp + damage);
      
      io.to(`arena:${data.sessionId}`).emit("arena_player_hit", {
        targetId: data.attackerId,
        damage: -damage, // Negativo pra indicar cura visualmente se necessário
        isCrit: false,
        element: "heal",
      });
      io.to(`arena:${data.sessionId}`).emit("arena_sync", session);
    } else {
      // Magia ofensiva
      if (!data.targetId) return;
      const target = session.players.find((p: any) => p.playerId === data.targetId);
      if (!target || target.isEliminated) return;

      // Validação de Range (Magia = range 5)
      if (arenaDistance(attacker, target) > SERVER_ATTACK_RANGE.magic_damage) {
        socket.emit("arena_out_of_range");
        return;
      }

      let { damage, isCrit } = serverCalcMagicDmg(attacker, data.spellPower, target);

      if (session.status === "pre_battle") {
        damage = 0;
      }

      target.hp = Math.max(0, target.hp - damage);

      io.to(`arena:${data.sessionId}`).emit("arena_player_hit", {
        targetId: data.targetId,
        damage,
        isCrit,
        element: data.element,
      });

      if (target.hp <= 0 && !target.isEliminated) {
        target.isEliminated = true;
        target.deaths = (target.deaths || 0) + 1;
        attacker.kills = (attacker.kills || 0) + 1;
        target.respawnAt = Date.now() + 5000;
        io.to(`arena:${data.sessionId}`).emit("arena_player_eliminated", { playerId: data.targetId });
      }
      
      io.to(`arena:${data.sessionId}`).emit("arena_sync", session);
    }
  });

  socket.on("arena_leave", (data: { sessionId: string, playerId: string }) => {
    const session = pvpSessions.get(data.sessionId);
    if (session) {
      const p = session.players.find((pl: any) => pl.playerId === data.playerId);
      if (p && !p.isEliminated) {
        p.isEliminated = true;
        io.to(`arena:${data.sessionId}`).emit("arena_player_eliminated", { playerId: data.playerId });
        
        // Verifica se a sala deve ser resetada
        const alives = session.players.filter((pl: any) => !pl.isEliminated);
        if (alives.length <= 1 && session.status !== "waiting") {
          session.status = "waiting";
          session.preBattleUntil = undefined;
          io.to(`arena:${data.sessionId}`).emit("arena_sync", session);
        }
      }
    }
    socket.leave(`arena:${data.sessionId}`);
    playerSessionMap.delete(data.playerId);
    console.log(`[Arena] Player ${data.playerId} saiu da sessão ${data.sessionId}`);
  });

  socket.on("disconnect", () => {
    const state = playersState.get(socket.id);
    if (state) {
      socket.to(`map:${state.mapId}`).emit("player_leave", { playerId: state.playerId });
      playersState.delete(socket.id);
      broadcastGlobalPresence();

      // ── Limpa a arena IMEDIATAMENTE (corrige bug de oponentes fantasmas presos na busca) ──
      const sessionId = playerSessionMap.get(state.playerId);
      if (sessionId) {
        const pvpSession = pvpSessions.get(sessionId);
        if (pvpSession) {
          const p = pvpSession.players.find((pl: any) => pl.playerId === state.playerId);
          if (p && !p.isEliminated) {
            p.isEliminated = true;
            io.to(`arena:${sessionId}`).emit("arena_player_eliminated", { playerId: state.playerId });
            io.to(`arena:${sessionId}`).emit("arena_sync", pvpSession);
            
            // Retorna a sala para waiting se ficar vazia
            const alives = pvpSession.players.filter((pl: any) => !pl.isEliminated);
            if (alives.length <= 1 && pvpSession.status !== "waiting") {
              pvpSession.status = "waiting";
              pvpSession.preBattleUntil = undefined;
              io.to(`arena:${sessionId}`).emit("arena_sync", pvpSession);
            }
          }
        }
        playerSessionMap.delete(state.playerId);
      }
    }
    console.log(`[Socket] Desconectado: ${socket.id}`);
  });

  // ── TICK ENGINE GLOBAL DA ARENA (Timers e Respawn) ──
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of pvpSessions.entries()) {
      let stateChanged = false;

      // 1. Controle de Timers do Modo FFA
      if (session.status === "pre_battle") {
        if (session.preBattleUntil && now >= session.preBattleUntil) {
          session.status = "in_progress";
          session.startedAt = now;
          session.endsAt = now + 120000; // 2 minutos de matança
          stateChanged = true;
          io.to(`arena:${sessionId}`).emit("arena_sync", session);
        }
      } else if (session.status === "in_progress") {
        if (session.endsAt && now >= session.endsAt) {
          session.status = "finished";
          // Determina vencedor por saldo de Kills
          let winner = session.players[0];
          for (const p of session.players) {
            if (p.kills > winner.kills || (p.kills === winner.kills && p.deaths < winner.deaths)) {
              winner = p;
            }
          }
          io.to(`arena:${sessionId}`).emit("arena_match_end", {
            winnerId: winner?.playerId ?? null,
            winnerName: winner?.name ?? null,
          });
          pvpSessions.delete(sessionId);
          continue; // Partida acabou
        }
      }

      // 2. Lógica de Respawn
      const USED_SPAWNS = [
        { x: 2, y: 5 }, { x: 2, y: 6 },
        { x: 9, y: 5 }, { x: 9, y: 6 },
        { x: 5, y: 2 }, { x: 6, y: 2 },
        { x: 5, y: 9 }, { x: 6, y: 9 },
      ];
      for (const p of session.players) {
        if (p.isEliminated && p.respawnAt && now >= p.respawnAt) {
          p.isEliminated = false;
          p.hp = p.maxHp;
          p.respawnAt = undefined;
          const spawn = USED_SPAWNS[Math.floor(Math.random() * USED_SPAWNS.length)];
          p.arenaX = spawn.x;
          p.arenaY = spawn.y;
          stateChanged = true;
          // Emite respawn visual isolado além do sync
          io.to(`arena:${sessionId}`).emit("arena_player_respawn", { playerId: p.playerId });
        }
      }

      // Emite sync constante para todos garantirem estado atual
      if (stateChanged || session.status === "waiting" || session.status === "pre_battle" || session.status === "in_progress") {
        io.to(`arena:${sessionId}`).emit("arena_sync", session);
      }
    }
  }, 1000);
});

server.listen(PORT, () => {
  console.log(`🚀 GameFiNow Backend Relayer & WebSocket rodando na porta ${PORT}`);
  console.log(`🔒 Vault Public Key: ${VAULT_KEYPAIR.publicKey()}`);
  
  // ─── Sistema Anti-Pause (Keep-Alive) ──────────────────────────────────
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log(`⏱️  Supabase Keep-Alive ativado para pingar a cada 10 minutos.`);
    setInterval(async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/players?limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        console.log(`[Keep-Alive] Ping no Supabase: Status ${response.status}`);
      } catch (err) {
        console.warn(`[Keep-Alive] Erro no ping do Supabase:`, err);
      }
    }, 10 * 60 * 1000); // 10 minutos
  } else {
    console.warn("⚠️ VITE_SUPABASE_URL não encontrada no .env. O Anti-Pause não será iniciado.");
  }
});
