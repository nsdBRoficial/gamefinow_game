import React, { useState, useEffect, useRef } from "react";
import {
  X, ExternalLink, Copy, CheckCheck, ChevronDown, Zap, Shield, Globe,
  Coins, BarChart3, Map, BookOpen, Star, TrendingUp, Activity,
  Server, Clock, Hash, ArrowRight, Layers
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const HORIZON = "https://horizon-testnet.stellar.org";
const EXPERT  = "https://stellar.expert/explorer/testnet";

const ADDRS = {
  treasury:    "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
  gamefi:      "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
  usdw:        "GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ",
  brw:         "GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6",
  usdc:        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

const TOKENS = [
  { code: "GAMEFI", issuer: ADDRS.gamefi, color: "#f59e0b", bg: "#f59e0b22", desc: "Native in-game governance & reward token" },
  { code: "USDW",   issuer: ADDRS.usdw,  color: "#22c55e", bg: "#22c55e22", desc: "USD-pegged stablecoin by WalletNow" },
  { code: "BRW",    issuer: ADDRS.brw,   color: "#3b82f6", bg: "#3b82f622", desc: "BRL-pegged stablecoin by WalletNow" },
  { code: "USDC",   issuer: ADDRS.usdc,  color: "#06b6d4", bg: "#06b6d422", desc: "Circle USDC — global stablecoin" },
  { code: "XLM",    issuer: "native",    color: "#8b5cf6", bg: "#8b5cf622", desc: "Stellar Lumen — gas & base asset" },
];

const PARTNERS = [
  { name: "SOROSWAP",  color: "#ec4899", desc: "Leading DEX on Soroban. Automated liquidity pools and token swaps on Stellar.", url: "https://soroswap.finance" },
  { name: "DEFINDEX",  color: "#3b82f6", desc: "Decentralized indices and yield optimization vaults built on Soroban smart contracts.", url: "" },
  { name: "WALLETNOW", color: "#10b981", desc: "DeFi wallet infrastructure. Provides USDW/BRW stablecoins and SEP-24 on-ramp/off-ramp.", url: "" },
  { name: "PIGFI",     color: "#ec4899", desc: "Small amounts, infinite possibilities. Family savings from R$50 via Pix — on Stellar.", url: "" },
  { name: "DUPPLY",    color: "#14b8a6", desc: "Digitizes invoice financing end-to-end. Automated workflows with full traceability.", url: "" },
  { name: "NIDO",      color: "#eab308", desc: "Creator infrastructure. Pay for results, not promises. Influencer marketing on-chain.", url: "" },
  { name: "AUTOFIN",   color: "#6366f1", desc: "Auto finance dApp. Automate financial workflows with DeFi primitives on Stellar.", url: "" },
  { name: "NEARX",     color: "#9333ea", desc: "Cross-chain protocol bridging NEAR and Stellar ecosystems.", url: "" },
  { name: "WAVE",      color: "#06b6d4", desc: "Wave DeFi protocol — next-generation liquidity on Stellar network.", url: "" },
];

const QUESTS = [
  { n: 1, title: "Forge Your Wallet",  icon: "🔑", color: "#06b6d4", desc: "Create a real Stellar testnet wallet on-chain. GameFiNow provisions your Ed25519 keypair, funds it via Friendbot, and automatically creates 4 trustlines for GAMEFI, USDW, BRW and USDC. Zero technical knowledge required — just play." },
  { n: 2, title: "On-Ramp",            icon: "💸", color: "#22c55e", desc: "Simulate a real-world asset bridge. Experience a SEP-24 deposit flow through WalletNow's anchor, receiving USDW stablecoins in exchange — the same flow used in production to move USD/BRL into the Stellar ecosystem." },
  { n: 3, title: "Soroban Swap",       icon: "🔄", color: "#f59e0b", desc: "Execute your first on-chain token swap through SoroSwap's Soroban smart contract. Trade USDW for GAMEFI tokens and witness sub-5-second settlement on the Stellar blockchain with near-zero fees." },
  { n: 4, title: "VIP Hold",           icon: "💎", color: "#a855f7", desc: "Lock 100 GAMEFI tokens in the on-chain yield vault for 24 hours. Earn VIP status, unlock exclusive cosmetic outfits, and gain early access to governance proposals. Your first taste of DeFi yield — inside a game." },
];

const ZONES = [
  { id: "center", name: "Central Plaza",  icon: "🏛️", color: "#f59e0b", desc: "The heart of the world. Houses the ATM DeFi terminal, P2P Store, Outfit Shop, Faucet fountain, and all partner stands. Open to all players — the starting point of every journey." },
  { id: "east",   name: "East District",  icon: "🌅", color: "#06b6d4", desc: "Advanced DeFi zone for experienced players. Access to liquidity pools, yield vaults, and high-level quests requiring GAMEFI holdings. Bridge to future cross-chain features." },
  { id: "west",   name: "West District",  icon: "🌊", color: "#3b82f6", desc: "Community and social zone. Guild halls, PvP arenas, public events, and weekly tournaments with GAMEFI rewards distributed on-chain to winners." },
  { id: "north",  name: "North District", icon: "🏔️", color: "#8b5cf6", desc: "Governance zone. Token holders vote on protocol parameters: fee rates, new partner onboarding, token emission schedule, and world expansion proposals." },
  { id: "south",  name: "South District", icon: "🌴", color: "#22c55e", desc: "Relaxed zone for collectors. Seasonal events, rare cosmetic drops, collectible NFT quests, and the gateway to the upcoming mobile companion app." },
];

const ROADMAP = [
  { phase: "0", title: "Genesis",     status: "done",    items: ["Stellar testnet wallet creation", "GAMEFI token on-chain", "4-quest onboarding flow", "Pixel art MMO world (60×60 grid)", "WalletNow SDK integration"] },
  { phase: "1", title: "Expansion",   status: "current", items: ["9+ partner stands live", "P2P marketplace with 0.5% fee", "Outfit NFT system", "Real-time multiplayer (Supabase)", "About page & documentation", "Mobile responsive UI"] },
  { phase: "2", title: "Economy",     status: "soon",    items: ["On-chain vault yield (Soroban)", "In-game liquidity pools", "DAO governance launch", "Soroban smart contract audit", "GAMEFI token staking", "Cross-zone portals"] },
  { phase: "3", title: "Multiverse",  status: "future",  items: ["Mainnet token launch", "Cross-chain bridges", "Native mobile app", "Tournament system with prize pools", "SDK for partner integrations", "Global expansion"] },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface HorizonBalance { asset_type: string; asset_code?: string; balance: string; }
interface HorizonAccount { id: string; sequence: string; balances: HorizonBalance[]; num_subentries: number; }
interface HorizonTx { id: string; hash: string; created_at: string; fee_charged: string; operation_count: number; memo?: string; }
interface LiveData {
  account: HorizonAccount | null;
  transactions: HorizonTx[];
  xlmPrice: { usd: number; brl: number } | null;
  ledger: { sequence: number; base_fee: string } | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useScrollY(containerId: string) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const h = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, [containerId]);
  return scrollY;
}

function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCounter(target: number, visible: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return count;
}

function useLiveData(): LiveData {
  const [data, setData] = useState<LiveData>({
    account: null, transactions: [], xlmPrice: null, ledger: null,
    loading: true, error: null, lastRefresh: null
  });

  const fetchAll = async () => {
    try {
      const [accountRes, txRes, priceRes, ledgerRes] = await Promise.allSettled([
        fetch(`${HORIZON}/accounts/${ADDRS.treasury}`).then(r => r.json()),
        fetch(`${HORIZON}/accounts/${ADDRS.treasury}/transactions?limit=8&order=desc`).then(r => r.json()),
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,brl").then(r => r.json()),
        fetch(`${HORIZON}/ledgers?limit=1&order=desc`).then(r => r.json()),
      ]);
      setData({
        account: accountRes.status === "fulfilled" && !accountRes.value.status ? accountRes.value : null,
        transactions: txRes.status === "fulfilled" ? (txRes.value._embedded?.records ?? []) : [],
        xlmPrice: priceRes.status === "fulfilled" ? { usd: priceRes.value.stellar?.usd ?? 0, brl: priceRes.value.stellar?.brl ?? 0 } : null,
        ledger: ledgerRes.status === "fulfilled" ? (ledgerRes.value._embedded?.records?.[0] ?? null) : null,
        loading: false, error: null, lastRefresh: new Date(),
      });
    } catch {
      setData(d => ({ ...d, loading: false, error: "Failed to reach Stellar Horizon", lastRefresh: new Date() }));
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const truncAddr = (a: string) => `${a.slice(0, 8)}...${a.slice(-8)}`;
const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────
function AddressCard({ label, addr, token, note }: { label: string; addr: string; token?: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  return (
    <div className="bg-black/50 border border-cyan-500/15 rounded-2xl p-5 hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-cyan-400/60 uppercase tracking-widest font-mono">{label}</span>
        {note && <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{note}</span>}
      </div>
      <div className="font-mono text-xs text-cyan-300 break-all leading-relaxed mb-4">{addr}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/15 text-slate-400 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/30 transition-all">
          {copied ? <><CheckCheck className="w-3 h-3 text-green-400" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
        <a href={`${EXPERT}/account/${addr}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/15 text-slate-400 hover:text-purple-400 border border-white/5 hover:border-purple-500/30 transition-all">
          <ExternalLink className="w-3 h-3" />Explorer
        </a>
        {token && (
          <a href={`${EXPERT}/asset/${token}-${addr}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/15 text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition-all">
            <Coins className="w-3 h-3" />Asset page
          </a>
        )}
      </div>
    </div>
  );
}

function FadeInCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useIntersection();
  return (
    <div ref={ref} className={`bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/25 hover:bg-cyan-950/10 transition-all duration-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "600ms" }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  const { ref, visible } = useIntersection();
  return (
    <div ref={ref} className={`mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">{icon}</div>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
      </div>
      <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, loading, icon, colorClass }: {
  label: string; value: string; sub: string; loading: boolean; icon: React.ReactNode; colorClass: string;
}) {
  return (
    <div className={`bg-black/40 border rounded-2xl p-5 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest opacity-50">{icon} {label}</div>
      {loading ? <div className="h-8 bg-white/5 rounded animate-pulse" /> : <div className="text-2xl font-black text-white font-mono">{value}</div>}
      <div className="text-xs text-slate-600 mt-1.5 font-mono">{sub}</div>
    </div>
  );
}

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 200 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 300,
  size: Math.random() * 2.5 + 0.5, speed: Math.random() * 0.4 + 0.05,
  opacity: Math.random() * 0.5 + 0.1, delay: Math.random() * 4,
}));

function StarField({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y * 0.33}%`, width: s.size, height: s.size, opacity: s.opacity, transform: `translateY(${scrollY * s.speed * 0.15}px)`, animation: `twinkle ${2 + s.delay}s ease-in-out infinite alternate`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props { onClose: () => void; }

const NAV_SECTIONS = [
  { id: "hero",       label: "Home",        Icon: Star },
  { id: "what",       label: "What is",     Icon: BookOpen },
  { id: "howtoplay",  label: "How to Play", Icon: Zap },
  { id: "tokenomics", label: "Tokenomics",  Icon: Coins },
  { id: "onchain",    label: "On-Chain",    Icon: Hash },
  { id: "economy",    label: "Economy",     Icon: TrendingUp },
  { id: "world",      label: "World",       Icon: Map },
  { id: "partners",   label: "Ecosystem",   Icon: Globe },
  { id: "livestats",  label: "Live Stats",  Icon: Activity },
  { id: "roadmap",    label: "Roadmap",     Icon: Layers },
];

export const AboutPage: React.FC<Props> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("hero");
  const liveData = useLiveData();
  const scrollY = useScrollY("about-container");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    const container = document.getElementById("about-container");
    if (!container) return;
    const handler = () => {
      const st = container.scrollTop + 150;
      for (const s of [...NAV_SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= st) { setActiveSection(s.id); break; }
      }
    };
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const container = document.getElementById("about-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-[200] flex" style={{ fontFamily: "'Inter', sans-serif", background: "#050a14" }}>
      {/* CSS Keyframes */}
      <style>{`
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
        @keyframes glitch1 { 0%,90%,100%{opacity:0;transform:translate(0)}91%{opacity:.6;transform:translate(-4px,1px)}95%{opacity:.6;transform:translate(4px,-1px)} }
        @keyframes glitch2 { 0%,85%,100%{opacity:0;transform:translate(0)}86%{opacity:.5;transform:translate(3px,2px)}92%{opacity:.5;transform:translate(-3px,-1px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes pulse-border { 0%,100%{border-color:rgba(6,182,212,.2)} 50%{border-color:rgba(6,182,212,.5)} }
        .glitch-1 { animation: glitch1 4s infinite; clip-path: polygon(0 30%, 100% 30%, 100% 55%, 0 55%); }
        .glitch-2 { animation: glitch2 4s infinite .5s; clip-path: polygon(0 65%, 100% 65%, 100% 85%, 0 85%); }
        .float-anim { animation: float 6s ease-in-out infinite; }
        #about-container::-webkit-scrollbar { width: 4px; }
        #about-container::-webkit-scrollbar-track { background: #050a14; }
        #about-container::-webkit-scrollbar-thumb { background: #06b6d430; border-radius: 2px; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-black/70 backdrop-blur-2xl border-r border-white/5 py-8 px-4">
        <div className="px-2 mb-8">
          <div className="text-sm font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">GAMEFINOW</div>
          <div className="text-[10px] font-mono text-slate-600 mt-1">v0.7.0 • STELLAR TESTNET</div>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV_SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeSection === s.id ? "bg-cyan-500/12 border border-cyan-500/25 text-cyan-300" : "text-slate-500 hover:text-slate-300 hover:bg-white/4"}`}>
              <s.Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{s.label}</span>
              {activeSection === s.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-white/5 space-y-2 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${liveData.loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
            <span className="text-[10px] font-mono text-slate-600">{liveData.loading ? "Connecting..." : "LIVE • Testnet"}</span>
          </div>
          {liveData.lastRefresh && (
            <div className="text-[10px] font-mono text-slate-700">Updated {timeAgo(liveData.lastRefresh.toISOString())}</div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div id="about-container" className="flex-1 overflow-y-auto">
        {/* Close */}
        <button onClick={onClose} className="fixed top-4 right-4 z-[300] w-10 h-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-red-500/40 hover:bg-red-950/30 transition-all">
          <X className="w-4 h-4" />
        </button>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(6,182,212,0.06)_0%,transparent_70%)]" style={{ transform: `translateY(${scrollY * 0.25}px)` }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_20%,rgba(168,85,247,0.05)_0%,transparent_60%)]" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
          <StarField scrollY={scrollY} />
          {/* Scanline */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.08)_50%)] bg-[size:100%_3px] pointer-events-none opacity-40" />

          <div className="relative z-10 text-center px-6 max-w-4xl" style={{ transform: `translateY(${scrollY * -0.08}px)` }}>
            {/* GLITCH TITLE */}
            <div className="relative inline-block float-anim">
              <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 leading-none select-none" style={{ WebkitTextStroke: "1px rgba(6,182,212,0.2)" }}>
                GAMEFINOW
              </h1>
              <h1 className="glitch-1 absolute inset-0 text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-cyan-400 leading-none select-none pointer-events-none" aria-hidden>GAMEFINOW</h1>
              <h1 className="glitch-2 absolute inset-0 text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-purple-400 leading-none select-none pointer-events-none" aria-hidden>GAMEFINOW</h1>
            </div>

            <p className="mt-6 text-xl md:text-2xl text-cyan-400 font-mono tracking-[0.3em] uppercase">
              Learn. Play. Grow.
            </p>
            <p className="mt-5 max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed">
              The first MMO where every action is an on-chain transaction. Real wallets. Real tokens. Real DeFi — disguised as gameplay.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { label: "Stellar Testnet", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" },
                { label: "Soroban Smart Contracts", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
                { label: "WalletNow SDK", color: "border-green-500/30 text-green-400 bg-green-500/10" },
                { label: "GameFi v0.7.0", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
              ].map(b => (
                <span key={b.label} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${b.color}`}>{b.label}</span>
              ))}
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { val: "5", label: "Districts", suffix: "" },
                { val: "9", label: "Partners", suffix: "+" },
                { val: "0.5", label: "Protocol Fee", suffix: "%" },
                { val: "5", label: "Sec Finality", suffix: "s" },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-white/8 rounded-xl p-3">
                  <div className="text-2xl font-black text-white">{s.val}<span className="text-cyan-400">{s.suffix}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => scrollTo("what")} className="mt-16 flex flex-col items-center gap-2 text-slate-600 hover:text-cyan-400 transition-colors mx-auto">
              <span className="text-[10px] uppercase tracking-[0.25em] font-mono">Explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </section>

        {/* ══ WHAT IS ══════════════════════════════════════════════════════════ */}
        <section id="what" className="py-28 px-6 md:px-16 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent">
          <SectionTitle icon={<BookOpen className="w-5 h-5" />} title="What is GameFiNow?" subtitle="A revolution at the intersection of gaming and decentralized finance." />
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
            {[
              { icon: "🎮", color: "text-cyan-400", title: "The Vision", text: "GameFiNow is a massively multiplayer online game where the entire economy lives on the Stellar blockchain. Every player action — creating a wallet, swapping tokens, trading items — is a real on-chain transaction. We believe the best way to educate people about Web3 is to make it fun." },
              { icon: "⛓️", color: "text-purple-400", title: "Built on Stellar", text: "Stellar provides 5-second finality, fees of just 0.00001 XLM per transaction, and native multi-asset support. With Soroban smart contracts, GameFiNow offers programmable DeFi primitives — vaults, pools, and governance — directly inside the game world." },
              { icon: "🎓", color: "text-amber-400", title: "DeFi Through Gameplay", text: "Complex DeFi concepts become intuitive game mechanics. Quest 1 teaches wallet creation. Quest 2 teaches on-ramp. Quest 3 teaches token swaps. Quest 4 teaches yield vaults. By the time players finish onboarding, they're real DeFi users." },
              { icon: "🤝", color: "text-green-400", title: "The Ecosystem", text: "GameFiNow is a platform for the entire Stellar DeFi ecosystem. Partner protocols — Soroswap, WalletNow, DefIndex, PigFi, Dupply, NIDO, AutoFin, NEARX, and WAVE — have dedicated interactive stands where players learn about and engage with their products." },
            ].map((c, i) => (
              <FadeInCard key={c.title} delay={i * 80}>
                <div className={`text-4xl mb-4 ${c.color}`}>{c.icon}</div>
                <h3 className="text-lg font-bold text-white mb-3">{c.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{c.text}</p>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ══ HOW TO PLAY ══════════════════════════════════════════════════════ */}
        <section id="howtoplay" className="py-28 px-6 md:px-16">
          <SectionTitle icon={<Zap className="w-5 h-5" />} title="How to Play" subtitle="4 quests that transform you from a newcomer into a DeFi native — in under 10 minutes." />
          <div className="relative max-w-4xl space-y-6">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-purple-500 via-amber-500 to-purple-600 hidden md:block opacity-30" />
            {QUESTS.map((q, i) => {
              const { ref, visible } = useIntersection();
              return (
                <div key={q.n} ref={ref} className={`relative md:pl-20 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`} style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="absolute left-2 top-5 w-8 h-8 rounded-full border-2 border-opacity-60 flex items-center justify-center text-white font-black text-sm hidden md:flex" style={{ borderColor: q.color, backgroundColor: `${q.color}20`, color: q.color }}>
                    {q.n}
                  </div>
                  <div className="bg-black/40 border border-white/8 rounded-2xl p-6 hover:border-opacity-30 transition-all" style={{ borderColor: `${q.color}20` } as React.CSSProperties}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{q.icon}</span>
                      <div>
                        <div className="text-xs font-mono uppercase tracking-wider mb-0.5" style={{ color: q.color }}>Quest {q.n}</div>
                        <h3 className="text-lg font-bold text-white">{q.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-sm">{q.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══ TOKENOMICS ═══════════════════════════════════════════════════════ */}
        <section id="tokenomics" className="py-28 px-6 md:px-16 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
          <SectionTitle icon={<Coins className="w-5 h-5" />} title="Tokenomics" subtitle="A multi-asset economy powered by real Stellar on-chain assets." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mb-14">
            {TOKENS.map((t, i) => (
              <FadeInCard key={t.code} delay={i * 70}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-black" style={{ backgroundColor: t.color }}>
                    {t.code.slice(0, 2)}
                  </div>
                  {t.code !== "XLM" && (
                    <a href={`${EXPERT}/asset/${t.code}-${t.issuer}`} target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-1 text-slate-600 hover:text-cyan-400 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-1">{t.code}</div>
                <div className="text-sm text-slate-500 mb-3">{t.desc}</div>
                {t.issuer !== "native" && (
                  <div className="font-mono text-xs text-slate-600 truncate bg-black/30 rounded-lg px-3 py-2">{truncAddr(t.issuer)}</div>
                )}
              </FadeInCard>
            ))}
          </div>

          {/* Fee table */}
          <div className="max-w-3xl bg-black/40 border border-amber-500/15 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-amber-400 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Fee Structure
            </h3>
            <div className="grid md:grid-cols-3 gap-5 text-center">
              {[
                { val: "0.5%", label: "GameFi Protocol Fee", sub: "On P2P trades & swaps" },
                { val: "0.00001 XLM", label: "Stellar Network Fee", sub: "Per operation" },
                { val: "100 GAMEFI", label: "VIP Vault Minimum", sub: "24h lock for yield" },
              ].map(f => (
                <div key={f.label} className="bg-black/30 rounded-xl p-5 border border-amber-500/10">
                  <div className="text-xl md:text-2xl font-black text-amber-400 break-words">{f.val}</div>
                  <div className="text-sm font-bold text-white mt-2">{f.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ON-CHAIN ═════════════════════════════════════════════════════════ */}
        <section id="onchain" className="py-28 px-6 md:px-16">
          <SectionTitle icon={<Hash className="w-5 h-5" />} title="On-Chain Data" subtitle="All contracts and addresses are public. Verify everything directly on Stellar." />
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
            <AddressCard label="GAMEFI Token Issuer" addr={ADDRS.gamefi} token="GAMEFI" note="Testnet" />
            <AddressCard label="GameFiNow Treasury" addr={ADDRS.treasury} note="Protocol fees" />
            <AddressCard label="USDW Issuer — WalletNow" addr={ADDRS.usdw} token="USDW" note="USD Stablecoin" />
            <AddressCard label="BRW Issuer — WalletNow" addr={ADDRS.brw} token="BRW" note="BRL Stablecoin" />
            <AddressCard label="USDC Issuer — Circle" addr={ADDRS.usdc} token="USDC" note="Testnet USDC" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`${EXPERT}/asset/GAMEFI-${ADDRS.gamefi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 rounded-xl text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
              <ExternalLink className="w-4 h-4" /> GAMEFI on Stellar Expert
            </a>
            <a href={`https://laboratory.stellar.org`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 rounded-xl text-purple-400 text-sm hover:bg-purple-500/20 transition-all">
              <ExternalLink className="w-4 h-4" /> Stellar Laboratory
            </a>
            <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:bg-slate-500/20 transition-all">
              <Server className="w-4 h-4" /> Horizon Testnet API
            </a>
          </div>
        </section>

        {/* ══ ECONOMY ══════════════════════════════════════════════════════════ */}
        <section id="economy" className="py-28 px-6 md:px-16 bg-gradient-to-b from-transparent via-green-900/8 to-transparent">
          <SectionTitle icon={<TrendingUp className="w-5 h-5" />} title="Economy" subtitle="A fully functional DeFi economy running inside the game world." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
            {[
              { icon: "🏪", color: "#ef4444", title: "P2P Store", text: "List and trade in-game items for GAMEFI tokens. Every trade settles on-chain with a 0.5% protocol fee sent to the treasury. Full on-chain provenance for all items." },
              { icon: "💧", color: "#3b82f6", title: "Faucet", text: "New players receive free XLM from the Stellar Friendbot to fund gas fees. Integrated Faucet fountain in the game world — 24h cooldown, gamified as a real water source." },
              { icon: "🔒", color: "#8b5cf6", title: "Vault / Yield", text: "Lock 100+ GAMEFI for 24h to activate VIP status. Soroban smart contract enforced. Earn yield, unlock exclusive cosmetics, and gain governance voting power." },
              { icon: "🔄", color: "#06b6d4", title: "DEX Swap", text: "Integrated with SoroSwap's Soroban DEX. Trade USDW ↔ GAMEFI ↔ XLM directly in the game. Same smart contract used in production on Stellar mainnet." },
            ].map((e, i) => (
              <FadeInCard key={e.title} delay={i * 80}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4" style={{ backgroundColor: `${e.color}20` }}>{e.icon}</div>
                <h3 className="text-base font-bold mb-2 text-white">{e.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{e.text}</p>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ══ WORLD ════════════════════════════════════════════════════════════ */}
        <section id="world" className="py-28 px-6 md:px-16">
          <SectionTitle icon={<Map className="w-5 h-5" />} title="World Map" subtitle="5 interconnected districts — each with unique mechanics and DeFi primitives." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
            {ZONES.map((z, i) => (
              <FadeInCard key={z.id} delay={i * 70}>
                <div className="text-4xl mb-4">{z.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">{z.name}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{z.desc}</p>
                <code className="text-xs font-mono px-2 py-1 rounded bg-black/40 border border-white/8 text-slate-500">mapId: "{z.id}"</code>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ══ PARTNERS ═════════════════════════════════════════════════════════ */}
        <section id="partners" className="py-28 px-6 md:px-16 bg-gradient-to-b from-transparent via-blue-900/8 to-transparent">
          <SectionTitle icon={<Globe className="w-5 h-5" />} title="Ecosystem Partners" subtitle="DeFi protocols and fintechs with dedicated stands inside the GameFiNow world." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {PARTNERS.map((p, i) => (
              <FadeInCard key={p.name} delay={i * 55}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-black shrink-0" style={{ backgroundColor: p.color }}>
                    {p.name.slice(0, 2)}
                  </div>
                  <h3 className="font-bold text-white">{p.name}</h3>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto text-slate-600 hover:text-cyan-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              </FadeInCard>
            ))}
          </div>
        </section>

        {/* ══ LIVE STATS ═══════════════════════════════════════════════════════ */}
        <section id="livestats" className="py-28 px-6 md:px-16">
          <SectionTitle icon={<Activity className="w-5 h-5" />} title="Live Stats" subtitle="Real-time data fetched directly from Stellar Horizon Testnet and CoinGecko." />
          <LiveStatsPanel data={liveData} />
        </section>

        {/* ══ ROADMAP ══════════════════════════════════════════════════════════ */}
        <section id="roadmap" className="py-28 px-6 md:px-16 bg-gradient-to-b from-transparent to-black/60">
          <SectionTitle icon={<Layers className="w-5 h-5" />} title="Roadmap" subtitle="Our journey from genesis to a fully decentralized gaming economy." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
            {ROADMAP.map((r, i) => {
              const statusCfg: Record<string, string> = {
                done: "bg-green-500/15 text-green-400 border-green-500/25",
                current: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
                soon: "bg-amber-500/15 text-amber-400 border-amber-500/25",
                future: "bg-slate-500/10 text-slate-500 border-slate-500/20",
              };
              const statusLabel: Record<string, string> = {
                done: "✓ Complete", current: "● In Progress", soon: "◎ Coming Soon", future: "○ Planned"
              };
              return (
                <FadeInCard key={r.phase} delay={i * 90}>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border mb-4 ${statusCfg[r.status]}`}>
                    {statusLabel[r.status]}
                  </span>
                  <div className="text-xs text-slate-600 font-mono mb-1">Phase {r.phase}</div>
                  <h3 className="text-lg font-bold text-white mb-4">{r.title}</h3>
                  <ul className="space-y-2">
                    {r.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                        <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-slate-600" />{item}
                      </li>
                    ))}
                  </ul>
                </FadeInCard>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-24 text-center border-t border-white/5 pt-12">
            <div className="text-slate-600 font-mono text-xs space-y-1">
              <p>GameFiNow v0.7.0 // Stellar Testnet // Built with ❤️ on Stellar</p>
              <p>Verify all transactions: <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-cyan-700 hover:text-cyan-400 transition-colors">{EXPERT}</a></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── LIVE STATS PANEL ─────────────────────────────────────────────────────────
function LiveStatsPanel({ data }: { data: LiveData }) {
  const { ref, visible } = useIntersection();
  const xlmUsd = useCounter(data.xlmPrice ? Math.round(data.xlmPrice.usd * 10000) : 0, visible);
  const xlmBrl = useCounter(data.xlmPrice ? Math.round(data.xlmPrice.brl * 1000) : 0, visible);

  return (
    <div ref={ref} className="max-w-5xl space-y-6">
      {/* Top stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="XLM / USD" value={data.xlmPrice ? `$${(xlmUsd / 10000).toFixed(4)}` : "—"} sub="via CoinGecko • Live" loading={data.loading} icon={<TrendingUp className="w-3.5 h-3.5" />} colorClass="border-cyan-500/20 text-cyan-400" />
        <StatCard label="XLM / BRL" value={data.xlmPrice ? `R$ ${(xlmBrl / 1000).toFixed(4)}` : "—"} sub="via CoinGecko • Live" loading={data.loading} icon={<Coins className="w-3.5 h-3.5" />} colorClass="border-amber-500/20 text-amber-400" />
        <StatCard label="Latest Ledger" value={data.ledger ? `#${data.ledger.sequence.toLocaleString()}` : "—"} sub={data.ledger ? `Base fee: ${data.ledger.base_fee} stroops` : "Connecting..."} loading={data.loading} icon={<Server className="w-3.5 h-3.5" />} colorClass="border-purple-500/20 text-purple-400" />
      </div>

      {/* Treasury account */}
      {data.account && (
        <div className="bg-black/50 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Treasury Account
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
              View on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <div className="text-xs text-slate-600 font-mono mb-1.5 uppercase tracking-widest">Public Address</div>
              <div className="font-mono text-xs text-cyan-300 break-all leading-relaxed">{data.account.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 font-mono mb-1.5 uppercase tracking-widest">Sequence Number</div>
              <div className="font-mono text-sm text-white">{data.account.sequence}</div>
              <div className="text-xs text-slate-600 mt-1">Sub-entries: {data.account.num_subentries}</div>
            </div>
          </div>
          {data.account.balances.length > 0 && (
            <div>
              <div className="text-xs text-slate-600 font-mono uppercase tracking-widest mb-3">On-Chain Balances</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.account.balances.map((b, i) => (
                  <div key={i} className="bg-white/4 border border-white/6 rounded-xl px-3 py-2.5">
                    <div className="text-xs text-slate-500 font-mono">{b.asset_code || "XLM"}</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{parseFloat(b.balance).toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {data.transactions.length > 0 && (
        <div className="bg-black/50 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" /> Recent Transactions
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
              All txns <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-white/4">
            {data.transactions.map(tx => (
              <a key={tx.id} href={`${EXPERT}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors group">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <div className="font-mono text-xs text-cyan-300 group-hover:text-cyan-200 transition-colors flex-1 truncate">
                  {tx.hash.slice(0, 24)}...{tx.hash.slice(-8)}
                </div>
                <BarChart3 className="w-3 h-3 text-slate-600 shrink-0" />
                <div className="text-xs text-slate-600 shrink-0">{tx.operation_count} op{tx.operation_count !== 1 ? "s" : ""}</div>
                <div className="text-xs text-slate-700 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />{timeAgo(tx.created_at)}
                </div>
                <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-cyan-400 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {data.loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-mono text-slate-500">Fetching live data from Stellar Horizon...</p>
        </div>
      )}
      {!data.loading && data.error && (
        <div className="text-center py-8 bg-red-950/20 border border-red-500/15 rounded-2xl">
          <p className="text-sm text-red-400">⚠️ {data.error}</p>
          <p className="text-xs text-slate-600 mt-1">Check your network connection</p>
        </div>
      )}
    </div>
  );
}
