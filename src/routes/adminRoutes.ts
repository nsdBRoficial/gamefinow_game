import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "super-secret-jwt-token-with-at-least-32-characters";

// Cria um JWT fake de admin (usando role authenticated para o Supabase aceitar)
const adminJwt = jwt.sign(
  { aud: "authenticated", role: "authenticated", is_admin: true, sub: "00000000-0000-0000-0000-000000000000" },
  SUPABASE_JWT_SECRET,
  { expiresIn: "10y" }
);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${adminJwt}` } }
});

export const adminRouter = Router();

// Endpoint de Login
adminRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Preencha usuário e senha" });

  const hash = crypto.createHash('sha256').update(password).digest('hex');

  console.log(`[Admin Login] Tentativa de login. Usuário: ${username} | Hash: ${hash}`);
  
  const { data: user, error } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("username", username)
    .eq("password_hash", hash)
    .single();

  console.log(`[Admin Login] Resposta do Supabase:`, { user, error });

  if (error || !user) {
    return res.status(401).json({ error: "Credenciais inválidas", details: error });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SUPABASE_JWT_SECRET, { expiresIn: "12h" });
  return res.json({ token, role: user.role });
});

// Middleware de Proteção
const requireAdmin = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Sem token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as any;
    if (decoded.role !== "admin") throw new Error("Acesso negado");
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Proibido" });
  }
};

// Obter Usuários
adminRouter.get("/users", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("players").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// Banir Usuário
adminRouter.post("/users/:id/ban", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminUsername = (req as any).admin.username;

  // Atualiza Supabase
  const { error } = await supabaseAdmin.from("players").update({ is_banned: true, ban_reason: reason }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  // Registra log
  await supabaseAdmin.from("admin_audit_logs").insert({ admin_username: adminUsername, action: "ban", target_id: id, details: { reason } });

  // Emite evento para derrubar jogador se ele estiver online (tratado no server.ts)
  req.app.get("io").emit("kick_user", { playerId: id, reason });

  return res.json({ success: true });
});

// Desbanir Usuário
adminRouter.post("/users/:id/unban", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminUsername = (req as any).admin.username;

  const { error } = await supabaseAdmin.from("players").update({ is_banned: false, ban_reason: null }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin.from("admin_audit_logs").insert({ admin_username: adminUsername, action: "unban", target_id: id });

  return res.json({ success: true });
});

adminRouter.post("/ban", requireAdmin, async (req, res) => {
  try {
    const { userId, isBanned } = req.body;
    // Padrão antigo: ban permanente
    const { error } = await supabaseAdmin
      .from("users")
      .update({ is_banned: isBanned, suspended_until: isBanned ? null : null })
      .eq("id", userId);

    if (error) throw error;
    
    // Se baniu, kickar o cara imediatamente
    if (isBanned) {
      const io = req.app.get("io");
      io.emit("kick_user", { userId });
    }

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminRouter.post("/suspend", requireAdmin, async (req, res) => {
  try {
    const { userId, days } = req.body;
    
    let suspendedUntil = null;
    let isBanned = false;
    
    if (days === -1) {
      // PermaBan
      isBanned = true;
    } else if (days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      suspendedUntil = d.toISOString();
      isBanned = true; // tecnicamente banido, mas com limite
    }

    const { error } = await supabaseAdmin
      .from("players")
      .update({ is_banned: isBanned, suspended_until: suspendedUntil })
      .eq("id", userId);

    if (error) throw error;

    if (isBanned) {
      const io = req.app.get("io");
      const playersState = req.app.locals.playersState;
      let targetSocketId = null;
      
      console.log(`[Suspend] Buscando jogador ${userId} no playersState... Size:`, playersState ? playersState.size : 0);
      
      if (playersState) {
        playersState.forEach((state: any, socketId: string) => {
          console.log(`[Suspend] Verificando state.playerId (${state.playerId}) === userId (${userId})`);
          if (state.playerId === userId) {
            targetSocketId = socketId;
          }
        });
      }

      console.log(`[Suspend] targetSocketId encontrado: ${targetSocketId}`);

      if (targetSocketId) {
        console.log(`[Suspend] Emitindo kick_user para o socket ${targetSocketId}`);
        io.to(targetSocketId).emit("kick_user", { reason: "Sua conta foi suspensa por um Administrador." });
        setTimeout(() => {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          console.log(`[Suspend] Desconectando targetSocket:`, !!targetSocket);
          if (targetSocket) {
            targetSocket.disconnect();
          }
        }, 500);
      }
    }

    return res.json({ success: true, isBanned, suspendedUntil });
  } catch (error: any) {
    console.error("SUSPEND ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Obter logs de auditoria
adminRouter.get("/logs", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// Métricas de Servidor
adminRouter.get("/metrics", requireAdmin, async (req, res) => {
  const io = req.app.get("io");
  const socketsCount = io.engine.clientsCount;
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  const uptime = process.uptime();

  // Ping Horizon
  let horizonPing = 0;
  try {
    const start = Date.now();
    await fetch("https://horizon-testnet.stellar.org", { method: "HEAD" });
    horizonPing = Date.now() - start;
  } catch (err) {
    horizonPing = -1; // -1 significa erro/timeout
  }

  // Obter posições dos jogadores para Heatmap
  const playersState = (req.app.locals.playersState) || new Map();
  // Se o server.ts não exporta playersState direto no app.locals, precisamos injetar ou acessar via socket rooms.
  // Como é difícil acessar variáveis isoladas, o server.ts precisa expor. Vou assumir que server.ts vai colocar no req.app.locals
  const playersPos = Array.from(playersState.values()).map((p: any) => ({ x: p.x, y: p.y, mapId: p.mapId, playerId: p.playerId, isSuspicious: p.isSuspicious }));

  return res.json({
    onlinePlayers: socketsCount,
    memoryUsage: memoryUsage.toFixed(2) + "%",
    uptimeSeconds: uptime,
    horizonPing,
    playersPos
  });
});

// Economia On-chain
adminRouter.get("/economy", requireAdmin, async (req, res) => {
  try {
    const treasury = "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
    const horizonUrl = "https://horizon-testnet.stellar.org";
    let balances = [];
    let txData = { _embedded: { records: [] } };

    try {
      const response = await fetch(`${horizonUrl}/accounts/${treasury}`);
      if (response.ok) {
        const data = await response.json();
        balances = data.balances;
        
        const txRes = await fetch(`${horizonUrl}/accounts/${treasury}/transactions?limit=10&order=desc`);
        if (txRes.ok) {
           txData = await txRes.json();
        }
      }
    } catch (err) {
      console.warn("Falha ao ler rede Stellar:", err);
    }
    
    // Obter cotação atual do XLM
    let xlmPrice = { usd: 0, brl: 0 };
    try {
      const cgRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,brl");
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        xlmPrice = cgData.stellar || xlmPrice;
      }
    } catch (err) {
      console.warn("Erro ao buscar cotação:", err);
    }

    return res.json({
      treasury,
      balances,
      xlmPrice,
      recentTransactionsCount: txData._embedded?.records?.length || 0,
      recentTransactions: txData._embedded?.records?.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        fee_charged: tx.fee_charged,
        operation_count: tx.operation_count
      })) || []
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Botão de Pânico (Emergência)
let isPanicMode = false;

adminRouter.post("/panic", requireAdmin, async (req, res) => {
  isPanicMode = !isPanicMode;
  const adminUsername = (req as any).admin.username;

  // Registrar log
  await supabaseAdmin.from("admin_audit_logs").insert({ 
    admin_username: adminUsername, 
    action: isPanicMode ? "panic_on" : "panic_off", 
    target_id: "GLOBAL" 
  });

  // Emitir evento global
  const io = req.app.get("io");
  io.emit("maintenance_mode", { active: isPanicMode });

  return res.json({ success: true, isPanicMode });
});

adminRouter.get("/panic", requireAdmin, (req, res) => {
  return res.json({ isPanicMode });
});
