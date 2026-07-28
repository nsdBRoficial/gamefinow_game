import React, { useState, useEffect } from "react";
import { Lock, LogOut, Users, ShieldAlert, Activity, Server, Ban, CheckCircle, List, DollarSign, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Dados fictícios/históricos para o gráfico (pode vir da API depois)
const mockChartData = [
  { time: '00:00', players: 12 },
  { time: '04:00', players: 8 },
  { time: '08:00', players: 25 },
  { time: '12:00', players: 45 },
  { time: '16:00', players: 38 },
  { time: '20:00', players: 60 },
  { time: 'Agora', players: 65 },
];

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "logs" | "economy">("overview");

  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [economy, setEconomy] = useState<any>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const [mRes, uRes, lRes, eRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/admin/logs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/admin/economy`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (mRes.ok) setMetrics(await mRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (lRes.ok) setLogs(await lRes.json());
      if (eRes.ok) setEconomy(await eRes.json());
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const iv = setInterval(fetchDashboard, 10000);
    return () => clearInterval(iv);
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${backendUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
      } else {
        setError(data.error || "Login falhou");
      }
    } catch (err) {
      setError("Erro de rede");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  const toggleBan = async (user: any) => {
    const isBanning = !user.is_banned;
    const action = isBanning ? "ban" : "unban";
    
    const reason = isBanning ? prompt("Motivo do banimento:") : "";
    if (isBanning && reason === null) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${user.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        fetchDashboard(); // recarrega logs e usuarios
      }
    } catch (err) {
      console.error("Erro ao alterar ban status", err);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif", backgroundImage: "radial-gradient(circle at center, rgba(239,68,68,0.1) 0%, transparent 50%)" }}>
        <div className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl" style={{ background: "rgba(3,6,14,0.8)", border: "2px solid rgba(239,68,68,0.2)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 border border-red-500/50">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Acesso Restrito</h2>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Usuário</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl py-3.5 transition-colors disabled:opacity-50 mt-2">
            {loading ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080f] p-6 lg:p-12 overflow-auto text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl gap-4" style={{ background: "rgba(0,0,0,0.6)", border: "2px solid rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <div>
              <h2 className="text-xl font-black text-white">Centro de Comando GM</h2>
              <p className="text-sm text-slate-400">Visão global e moderação de jogadores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open("/", "_blank")} 
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 border border-red-600 rounded-xl text-sm font-bold text-white transition-colors">
              <Play className="w-4 h-4" /> Entrar como GM
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>

        {/* Navbar de Tabs */}
        <div className="flex space-x-2 p-2 rounded-2xl" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setActiveTab("overview")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-colors ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Activity className="w-4 h-4 inline-block mr-2" /> Visão Geral
          </button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-colors ${activeTab === 'players' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Users className="w-4 h-4 inline-block mr-2" /> Jogadores
          </button>
          <button onClick={() => setActiveTab("logs")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <List className="w-4 h-4 inline-block mr-2" /> Logs de Auditoria
          </button>
          <button onClick={() => setActiveTab("economy")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-colors ${activeTab === 'economy' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <DollarSign className="w-4 h-4 inline-block mr-2" /> Economia (Stellar)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/30">
                <div className="text-cyan-500 mb-2 font-bold text-xs uppercase flex items-center gap-2"><Users className="w-4 h-4"/> Online (Socket)</div>
                <div className="text-3xl font-black text-white">{metrics.onlinePlayers}</div>
              </div>
              <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/30">
                <div className="text-purple-500 mb-2 font-bold text-xs uppercase flex items-center gap-2"><Server className="w-4 h-4"/> Uso de Memória</div>
                <div className="text-3xl font-black text-white">{metrics.memoryUsage}</div>
              </div>
              <div className="p-5 rounded-2xl bg-black/40 border border-emerald-500/30">
                <div className="text-emerald-500 mb-2 font-bold text-xs uppercase flex items-center gap-2">Uptime Servidor</div>
                <div className="text-xl font-black text-white mt-1">{(metrics.uptimeSeconds / 3600).toFixed(1)}h</div>
              </div>
              <div className={`p-5 rounded-2xl bg-black/40 border ${metrics.horizonPing > 0 && metrics.horizonPing < 500 ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="text-slate-400 mb-2 font-bold text-xs uppercase flex items-center gap-2">Horizon API Ping</div>
                <div className={`text-3xl font-black ${metrics.horizonPing > 0 && metrics.horizonPing < 500 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.horizonPing > 0 ? `${metrics.horizonPing}ms` : 'TIMEOUT'}
                </div>
              </div>
            </div>

            {/* Gráfico Livestatus */}
            <div className="rounded-2xl overflow-hidden p-6" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="font-black text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Fluxo de Jogadores (Simulação 24h)</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="players" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorPlayers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-between">
              <div>
                <h3 className="font-black text-red-500 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Protocolo de Emergência (Panic Button)</h3>
                <p className="text-sm text-slate-400 mt-1">Ativa o Modo de Manutenção no cliente de todos os jogadores logados, bloqueando novas requisições.</p>
              </div>
              <button 
                onClick={async () => {
                  if (confirm("TEM CERTEZA que deseja ativar/desativar o protocolo de manutenção global? O jogo será paralisado.")) {
                    await fetch(`${backendUrl}/api/admin/panic`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                    alert("Estado de Pânico Alternado!");
                  }
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 font-black text-white rounded-xl shadow-lg shadow-red-500/20 uppercase tracking-wider transition-colors"
              >
                Acionar Pânico
              </button>
            </div>
          </div>
        )}

        {activeTab === "players" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="p-5 border-b border-white/10">
                <h3 className="font-black text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400"/> Lista de Jogadores</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <th className="p-4">Stellar / ID</th>
                      <th className="p-4">Nome</th>
                      <th className="p-4">Status da Conta</th>
                      <th className="p-4">Conexão</th>
                      <th className="p-4 text-right">Ações (Punições)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => {
                      const runtimeState = metrics?.playersPos?.find((p:any) => p.playerId === u.id);
                      const isOnline = !!runtimeState;
                      const isSuspicious = runtimeState?.isSuspicious;
                      const isSuspended = u.is_banned || (u.suspended_until && new Date(u.suspended_until) > new Date());

                      const handleSuspend = async (days: number) => {
                         if (!confirm(`Confirmar suspensão por ${days === -1 ? 'TEMPO INDETERMINADO' : days + ' dias'}?`)) return;
                         await fetch(`${backendUrl}/api/admin/suspend`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                           body: JSON.stringify({ userId: u.id, days })
                         });
                         fetchDashboard();
                      };

                      return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-xs text-blue-300">{u.stellar_address.slice(0,8)}...{u.stellar_address.slice(-8)}</td>
                        <td className="p-4 font-bold text-white">
                          {u.name}
                          {isSuspicious && <span className="ml-2 inline-block px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-500 border border-red-500/50">BOT DETECTADO</span>}
                        </td>
                        <td className="p-4">
                          {isSuspended ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 w-fit">
                                <Ban className="w-3 h-3" /> SUSPENSO
                              </span>
                              {u.suspended_until && <span className="text-[10px] text-red-400/80">Até {new Date(u.suspended_until).toLocaleDateString()}</span>}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-green-500/20 text-green-400 border border-green-500/30 w-fit">
                              <CheckCircle className="w-3 h-3" /> ATIVO
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                           {isOnline ? (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
                               <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> ONLINE
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black text-slate-500">
                               OFFLINE
                             </span>
                           )}
                        </td>
                        <td className="p-4 text-right">
                          {isSuspended ? (
                            <button onClick={() => handleSuspend(0)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20">
                              Revogar Punição
                            </button>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleSuspend(3)} className="px-2 py-1.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20">
                                3 Dias
                              </button>
                              <button onClick={() => handleSuspend(7)} className="px-2 py-1.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20">
                                7 Dias
                              </button>
                              <button onClick={() => handleSuspend(-1)} className="px-2 py-1.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">
                                PERMABAN
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="rounded-2xl overflow-hidden animate-in fade-in" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 border-b border-white/10">
              <h3 className="font-black text-white flex items-center gap-2"><List className="w-5 h-5 text-orange-400"/> Logs de Auditoria (Admin)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Ação</th>
                    <th className="p-4">Alvo</th>
                    <th className="p-4">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold text-white">{log.admin_username}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.action === 'ban' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300">{log.target_id.slice(0, 8)}...</td>
                      <td className="p-4 text-xs text-slate-400">{log.details ? JSON.stringify(log.details) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "economy" && economy && (
          <div className="space-y-4 animate-in fade-in">
            {/* Cards de Cotação de Mercado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-black/40 border border-green-500/30">
                <div className="text-green-500 mb-2 font-bold text-xs uppercase flex items-center gap-2">XLM Price (USD)</div>
                <div className="text-2xl font-black text-white">${economy.xlmPrice?.usd || "0.00"}</div>
              </div>
              <div className="p-5 rounded-2xl bg-black/40 border border-green-500/30">
                <div className="text-green-500 mb-2 font-bold text-xs uppercase flex items-center gap-2">XLM Price (BRL)</div>
                <div className="text-2xl font-black text-white">R$ {economy.xlmPrice?.brl || "0.00"}</div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="p-5 border-b border-white/10">
                <h3 className="font-black text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-400"/> GameFi Treasury (Stellar Testnet)</h3>
                <p className="text-xs text-slate-400 mt-1">Conta: <span className="font-mono text-amber-200">{economy.treasury}</span></p>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {economy.balances.map((b: any, i: number) => (
                  <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.asset_code || "XLM (Nativo)"}</p>
                    <p className="text-xl font-black text-white mt-1">{parseFloat(b.balance).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="p-5 border-b border-white/10">
                <h3 className="font-black text-white flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400"/> Últimas Transações e Volume</h3>
              </div>
              <div className="p-5 flex items-end gap-2 h-32 border-b border-white/5">
                {/* Gráfico leve de barras para volume de operações (Simples UI com HTML) */}
                {economy.recentTransactions.map((tx: any, idx: number) => {
                  const height = Math.min(100, Math.max(10, tx.operation_count * 10));
                  return (
                    <div key={`bar-${idx}`} className="flex-1 flex flex-col justify-end group relative">
                      <div className="w-full bg-amber-500/50 hover:bg-amber-400 transition-all rounded-t-sm" style={{ height: `${height}%` }}></div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono bg-black px-2 py-1 rounded text-white pointer-events-none transition-opacity">
                        {tx.operation_count} ops
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <th className="p-4">ID Transação</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Taxa Cobrada</th>
                      <th className="p-4">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {economy.recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-xs text-amber-300">
                          <a href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {tx.id.slice(0, 16)}...
                          </a>
                        </td>
                        <td className="p-4 text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="p-4 text-xs font-mono text-white">{parseFloat(tx.fee_charged) / 1e7} XLM</td>
                        <td className="p-4 text-xs text-slate-300">{tx.operation_count} ops</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
