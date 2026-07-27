import React, { useState, useEffect, useRef } from "react";
import {
  X, ExternalLink, Copy, CheckCheck, ChevronDown, Zap, Shield, Globe,
  Coins, BarChart3, Map, BookOpen, Star, TrendingUp, Activity,
  Server, Clock, Hash, ArrowRight, Layers, Languages
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const HORIZON = "https://horizon-testnet.stellar.org";
const EXPERT  = "https://stellar.expert/explorer/testnet";
const BG_IMAGES = ["/imagens/capa-0.png","/imagens/capa-1.png","/imagens/capa-2.png","/imagens/capa-3.png","/imagens/capa-4.png"];

const ADDRS = {
  treasury: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
  gamefi:   "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
  usdw:     "GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ",
  brw:      "GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6",
  usdc:     "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

const TOKENS = [
  { code: "GAMEFI", issuer: ADDRS.gamefi, color: "#f59e0b", emoji: "⭐", desc: "Native in-game governance & reward token" },
  { code: "USDW",   issuer: ADDRS.usdw,  color: "#22c55e", emoji: "💵", desc: "USD-pegged stablecoin by WalletNow" },
  { code: "BRW",    issuer: ADDRS.brw,   color: "#3b82f6", emoji: "🇧🇷", desc: "BRL-pegged stablecoin by WalletNow" },
  { code: "USDC",   issuer: ADDRS.usdc,  color: "#06b6d4", emoji: "💎", desc: "Circle USDC — global stablecoin" },
  { code: "XLM",    issuer: "native",    color: "#8b5cf6", emoji: "🚀", desc: "Stellar Lumen — gas & base asset" },
];

const PARTNERS = [
  { name: "SOROSWAP",  color: "#ec4899", emoji: "🔄", desc: "Leading DEX on Soroban. Automated liquidity pools and token swaps on Stellar.", url: "https://soroswap.finance" },
  { name: "DEFINDEX",  color: "#3b82f6", emoji: "📊", desc: "Decentralized indices and yield optimization vaults built on Soroban smart contracts.", url: "" },
  { name: "WALLETNOW", color: "#10b981", emoji: "👛", desc: "DeFi wallet infrastructure. Provides USDW/BRW stablecoins and SEP-24 on-ramp/off-ramp.", url: "" },
  { name: "PIGFI",     color: "#f472b6", emoji: "🐷", desc: "Small amounts, infinite possibilities. Family savings from R$50 via Pix — on Stellar.", url: "" },
  { name: "DUPPLY",    color: "#14b8a6", emoji: "📄", desc: "Digitizes invoice financing end-to-end. Automated workflows with full traceability.", url: "" },
  { name: "NIDO",      color: "#eab308", emoji: "🪺", desc: "Creator infrastructure. Pay for results, not promises. Influencer marketing on-chain.", url: "" },
  { name: "AUTOFIN",   color: "#6366f1", emoji: "🚗", desc: "Auto finance dApp. Automate financial workflows with DeFi primitives on Stellar.", url: "" },
  { name: "NEARX",     color: "#9333ea", emoji: "🌐", desc: "Cross-chain protocol bridging NEAR and Stellar ecosystems.", url: "" },
  { name: "WAVE",      color: "#06b6d4", emoji: "🌊", desc: "Wave DeFi protocol — next-generation liquidity on Stellar network.", url: "" },
];

const QUESTS = [
  { n: 1, title: "Forge Your Wallet",  icon: "🔑", color: "#06b6d4", bg: "#06b6d415", border: "#06b6d440", desc: "Create a real Stellar testnet wallet on-chain. GameFiNow provisions your Ed25519 keypair, funds it via Friendbot, and automatically creates 4 trustlines for GAMEFI, USDW, BRW and USDC." },
  { n: 2, title: "On-Ramp",            icon: "💸", color: "#22c55e", bg: "#22c55e15", border: "#22c55e40", desc: "Simulate a real-world asset bridge via SEP-24 through WalletNow's anchor, receiving USDW stablecoins — the same flow used in production to move USD/BRL into the Stellar ecosystem." },
  { n: 3, title: "Soroban Swap",       icon: "🔄", color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b40", desc: "Execute your first on-chain token swap through SoroSwap's Soroban smart contract. Trade USDW for GAMEFI and witness sub-5-second settlement with near-zero fees." },
  { n: 4, title: "VIP Hold",           icon: "💎", color: "#a855f7", bg: "#a855f715", border: "#a855f740", desc: "Lock 100 GAMEFI tokens in the on-chain yield vault for 24 hours. Earn VIP status, unlock exclusive cosmetic outfits, and gain early access to governance proposals." },
];

const ZONES = [
  { id: "center", name: "Central Plaza",  icon: "🏛️", color: "#f59e0b", desc: "The heart of the world. Houses the ATM DeFi, P2P Store, Outfit Shop, Faucet and all partner stands." },
  { id: "east",   name: "East District",  icon: "🌅", color: "#06b6d4", desc: "Advanced DeFi zone with liquidity pools, yield vaults, and high-level quests for experienced players." },
  { id: "west",   name: "West District",  icon: "🌊", color: "#3b82f6", desc: "Community zone with guilds, PvP arenas, public events and weekly GAMEFI tournaments." },
  { id: "north",  name: "North District", icon: "🏔️", color: "#8b5cf6", desc: "Governance zone where token holders vote on protocol parameters and DAO proposals." },
  { id: "south",  name: "South District", icon: "🌴", color: "#22c55e", desc: "Collector zone with seasonal events, rare cosmetics, collectible NFT quests and mobile features." },
];

const ROADMAP = [
  { phase: "0", title: "Genesis",    status: "done",    emoji: "✅", items: ["Stellar testnet wallet", "GAMEFI token on-chain", "4-quest onboarding", "Pixel art MMO world", "WalletNow SDK"] },
  { phase: "1", title: "Expansion",  status: "current", emoji: "🔥", items: ["9+ partner stands", "P2P marketplace 0.5%", "Outfit NFT system", "Real-time multiplayer", "About page & docs", "Mobile UI"] },
  { phase: "2", title: "Economy",    status: "soon",    emoji: "⏳", items: ["On-chain vault yield", "In-game liquidity pools", "DAO governance", "Soroban contract audit", "GAMEFI staking"] },
  { phase: "3", title: "Multiverse", status: "future",  emoji: "🌌", items: ["Mainnet token launch", "Cross-chain bridges", "Native mobile app", "Tournament prize pools", "Partner SDK"] },
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

function useIntersection(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCounter(target: number, visible: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return count;
}

function useLiveData(): LiveData {
  const [data, setData] = useState<LiveData>({ account: null, transactions: [], xlmPrice: null, ledger: null, loading: true, error: null, lastRefresh: null });
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
    } catch { setData(d => ({ ...d, loading: false, error: "Cannot reach Stellar Horizon", lastRefresh: new Date() })); }
  };
  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 30000); return () => clearInterval(iv); }, []);
  return data;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const truncAddr = (a: string) => `${a.slice(0, 8)}...${a.slice(-8)}`;
const timeAgo = (d: string) => { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; return `${Math.floor(s / 3600)}h ago`; };

// ─── ADDRESS CARD ─────────────────────────────────────────────────────────────
function AddressCard({ label, addr, token, note }: { label: string; addr: string; token?: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative rounded-2xl p-5 transition-all group" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(6,182,212,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#06b6d4" }}>{label}</span>
        {note && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>{note}</span>}
      </div>
      <div className="font-mono text-xs break-all leading-relaxed mb-4" style={{ color: "#7dd3fc" }}>{addr}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all" style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: copied ? "#4ade80" : "#67e8f9" }}>
          {copied ? <><CheckCheck className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
        <a href={`${EXPERT}/account/${addr}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c4b5fd" }}>
          <ExternalLink className="w-3 h-3" />Explorer
        </a>
        {token && (
          <a href={`${EXPERT}/asset/${token}-${addr}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }}>
            <Coins className="w-3 h-3" />Asset
          </a>
        )}
      </div>
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle, color = "#06b6d4" }: { icon: React.ReactNode; title: string; subtitle?: string; color?: string }) {
  const { ref, visible } = useIntersection();
  return (
    <div ref={ref} className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black" style={{ background: `${color}25`, border: `2px solid ${color}50`, color }}>{icon}</div>
        <div className="h-1 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${color}80 0%, transparent 100%)` }} />
      </div>
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white" style={{ textShadow: `0 0 40px ${color}40` }}>{title}</h2>
      {subtitle && <p className="mt-4 text-base text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// ─── FADE CARD ────────────────────────────────────────────────────────────────
function FadeCard({ children, delay = 0, color = "#06b6d4", className = "" }: { children: React.ReactNode; delay?: number; color?: string; className?: string }) {
  const { ref, visible } = useIntersection();
  return (
    <div ref={ref} className={`rounded-2xl p-6 transition-all duration-600 hover:scale-[1.02] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "600ms", background: "rgba(0,0,0,0.50)", border: `2px solid ${color}22`, boxShadow: `0 0 20px ${color}08, inset 0 1px 0 rgba(255,255,255,0.04)` }}>
      {children}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, loading, icon, color }: { label: string; value: string; sub: string; loading: boolean; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.55)", border: `2px solid ${color}30` }}>
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest font-bold opacity-60" style={{ color }}>{icon} {label}</div>
      {loading ? <div className="h-8 rounded-xl animate-pulse" style={{ background: `${color}15` }} /> : <div className="text-2xl font-black text-white font-mono">{value}</div>}
      <div className="text-xs mt-1.5 font-mono" style={{ color: "#475569" }}>{sub}</div>
    </div>
  );
}

// ─── STARS ────────────────────────────────────────────────────────────────────
const STARS_DATA = Array.from({ length: 80 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 0.5, delay: Math.random() * 5, dur: 2 + Math.random() * 3 }));

function FloatingStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS_DATA.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out infinite alternate`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

// ─── NAV SECTIONS ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "hero",       label: "Home",        Icon: Star,       color: "#f59e0b" },
  { id: "what",       label: "What is",     Icon: BookOpen,   color: "#06b6d4" },
  { id: "howtoplay",  label: "How to Play", Icon: Zap,        color: "#a855f7" },
  { id: "tokenomics", label: "Tokenomics",  Icon: Coins,      color: "#22c55e" },
  { id: "onchain",    label: "On-Chain",    Icon: Hash,       color: "#3b82f6" },
  { id: "economy",    label: "Economy",     Icon: TrendingUp, color: "#f97316" },
  { id: "world",      label: "World",       Icon: Map,        color: "#14b8a6" },
  { id: "partners",   label: "Ecosystem",   Icon: Globe,      color: "#ec4899" },
  { id: "livestats",  label: "Live Stats",  Icon: Activity,   color: "#4ade80" },
  { id: "roadmap",    label: "Roadmap",     Icon: Layers,     color: "#818cf8" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props { onClose: () => void; }

export const AboutPage: React.FC<Props> = ({ onClose }) => {
  const { i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("hero");
  const [currentBg, setCurrentBg] = useState(0);
  const liveData = useLiveData();
  const scrollY = useScrollY("about-container");

  // Background carousel
  useEffect(() => { const iv = setInterval(() => setCurrentBg(p => (p + 1) % BG_IMAGES.length), 5000); return () => clearInterval(iv); }, []);

  // Close on ESC
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  // Track active section
  useEffect(() => {
    const container = document.getElementById("about-container");
    if (!container) return;
    const handler = () => {
      const st = container.scrollTop + 200;
      for (const s of [...NAV_SECTIONS].reverse()) { const el = document.getElementById(s.id); if (el && el.offsetTop <= st) { setActiveSection(s.id); break; } }
    };
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const container = document.getElementById("about-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  const changeLang = (lng: string) => i18n.changeLanguage(lng);

  return (
    <div className="fixed inset-0 z-[200] flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes twinkle { from{opacity:0.1} to{opacity:0.9} }
        @keyframes glitch1 { 0%,88%,100%{opacity:0;transform:translate(0)} 89%{opacity:.7;transform:translate(-4px,2px)} 94%{opacity:.7;transform:translate(4px,-2px)} }
        @keyframes glitch2 { 0%,83%,100%{opacity:0;transform:translate(0)} 84%{opacity:.5;transform:translate(3px,2px)} 91%{opacity:.5;transform:translate(-3px,-2px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes rainbow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes slideLeft { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pixel-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.4)} 50%{box-shadow:0 0 0 8px rgba(245,158,11,0)} }
        .glitch-1 { animation: glitch1 4s infinite; clip-path: polygon(0 25%, 100% 25%, 100% 50%, 0 50%); }
        .glitch-2 { animation: glitch2 4s infinite .6s; clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
        .float-anim { animation: float 5s ease-in-out infinite; }
        .rainbow-text { background: linear-gradient(270deg,#f59e0b,#ec4899,#06b6d4,#22c55e,#a855f7,#f59e0b); background-size:400% 400%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:rainbow 4s ease infinite; }
        #about-container::-webkit-scrollbar{width:4px}
        #about-container::-webkit-scrollbar-track{background:#05080f}
        #about-container::-webkit-scrollbar-thumb{background:#f59e0b50;border-radius:2px}
        .pixel-border { image-rendering: pixelated; }
        .section-bg { background: linear-gradient(180deg,rgba(5,8,15,0)_0%,rgba(5,8,15,0.92)_20%,rgba(5,8,15,0.96)_80%,rgba(5,8,15,0)_100%); }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 py-6 px-3" style={{ background: "rgba(3,6,14,0.95)", borderRight: "2px solid rgba(245,158,11,0.15)", backdropFilter: "blur(20px)" }}>
        {/* Logo */}
        <div className="px-3 mb-6">
          <div className="text-base font-black tracking-widest uppercase rainbow-text mb-0.5">GAMEFINOW</div>
          <div className="font-mono text-[10px]" style={{ color: "#374151" }}>v0.7.0 • STELLAR TESTNET</div>
        </div>
        {/* Language selector */}
        <div className="px-3 mb-5">
          <div className="flex items-center gap-1 mb-1.5" style={{ color: "#4b5563" }}>
            <Languages className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Language</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {["en","pt","es"].map((lng, i) => (
              <button key={lng} onClick={() => changeLang(lng)}
                className="flex-1 py-1.5 text-[10px] font-black uppercase transition-all"
                style={{ background: i18n.language === lng || (lng === "pt" && i18n.language === "pt-BR") ? "rgba(245,158,11,0.9)" : "rgba(0,0,0,0.4)", color: i18n.language === lng || (lng === "pt" && i18n.language === "pt-BR") ? "#000" : "#6b7280", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                {lng === "pt" ? "PT" : lng.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV_SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left"
                style={{ background: isActive ? `${s.color}18` : "transparent", border: `1px solid ${isActive ? s.color + "35" : "transparent"}`, color: isActive ? s.color : "#4b5563" }}>
                <s.Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{s.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />}
              </button>
            );
          })}
        </nav>

        {/* Live indicator */}
        <div className="mt-auto pt-5 border-t px-3 space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: liveData.loading ? "#fbbf24" : "#4ade80", animation: "pixel-pulse 2s infinite" }} />
            <span className="text-[10px] font-mono" style={{ color: "#374151" }}>{liveData.loading ? "Connecting..." : "LIVE • Testnet"}</span>
          </div>
          {liveData.lastRefresh && <div className="text-[10px] font-mono" style={{ color: "#1f2937" }}>Updated {timeAgo(liveData.lastRefresh.toISOString())}</div>}
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div id="about-container" className="flex-1 overflow-y-auto relative" style={{ background: "#05080f" }}>

        {/* Close button */}
        <button onClick={onClose} className="fixed top-4 right-4 z-[300] w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all" style={{ background: "rgba(0,0,0,0.8)", border: "2px solid rgba(255,255,255,0.12)", color: "#9ca3af", backdropFilter: "blur(12px)" }}>
          <X className="w-5 h-5" />
        </button>

        {/* Mobile lang selector */}
        <div className="lg:hidden fixed top-4 left-4 z-[300] flex gap-1">
          {["en","pt","es"].map(lng => (
            <button key={lng} onClick={() => changeLang(lng)} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all" style={{ background: i18n.language === lng || (lng === "pt" && i18n.language === "pt-BR") ? "#f59e0b" : "rgba(0,0,0,0.7)", color: i18n.language === lng || (lng === "pt" && i18n.language === "pt-BR") ? "#000" : "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }}>
              {lng === "pt" ? "PT" : lng.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Background carousel — same as LandingPage */}
          {BG_IMAGES.map((bg, i) => (
            <div key={bg} className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out" style={{ backgroundImage: `url(${bg})`, opacity: i === currentBg ? 1 : 0, transform: i === currentBg ? "scale(1.05)" : "scale(1)" }} />
          ))}
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(5,8,15,0.95) 0%,rgba(5,8,15,0.55) 50%,rgba(5,8,15,0.65) 100%)" }} />
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.22) 50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.008),rgba(0,0,255,0.01))", backgroundSize: "100% 3px,6px 100%", opacity: 0.6 }} />
          <FloatingStars />

          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-5xl" style={{ transform: `translateY(${scrollY * -0.06}px)` }}>
            <div className="relative inline-block float-anim mb-2">
              <h1 className="text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none text-white select-none" style={{ WebkitTextStroke: "2px rgba(245,158,11,0.25)", textShadow: "0 0 60px rgba(245,158,11,0.3),0 0 120px rgba(6,182,212,0.2)" }}>
                GAMEFINOW
              </h1>
              <h1 className="glitch-1 absolute inset-0 text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none select-none pointer-events-none" style={{ color: "#06b6d4" }} aria-hidden>GAMEFINOW</h1>
              <h1 className="glitch-2 absolute inset-0 text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none select-none pointer-events-none" style={{ color: "#f59e0b" }} aria-hidden>GAMEFINOW</h1>
            </div>
            <p className="text-xl md:text-2xl font-black tracking-[0.3em] uppercase mb-5" style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(245,158,11,0.5)" }}>
              ✦ Learn. Play. Grow. ✦
            </p>
            <p className="max-w-2xl mx-auto text-lg leading-relaxed mb-8" style={{ color: "#94a3b8" }}>
              The first MMO where every action is a real on-chain transaction. Real wallets, real tokens, real DeFi — disguised as fun.
            </p>
            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { label: "🌐 Stellar Testnet",          color: "#06b6d4" },
                { label: "⚡ Soroban Smart Contracts",  color: "#a855f7" },
                { label: "👛 WalletNow SDK",            color: "#22c55e" },
                { label: "🎮 GameFi v0.7.0",            color: "#f59e0b" },
              ].map(b => (
                <span key={b.label} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black" style={{ background: `${b.color}20`, border: `1.5px solid ${b.color}50`, color: b.color }}>
                  {b.label}
                </span>
              ))}
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
              {[
                { val: "5",    sfx: "",  label: "Districts" },
                { val: "9",    sfx: "+", label: "Partners" },
                { val: "0.5",  sfx: "%", label: "Protocol Fee" },
                { val: "5",    sfx: "s", label: "Finality" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(245,158,11,0.2)" }}>
                  <div className="text-2xl font-black text-white">{s.val}<span style={{ color: "#f59e0b" }}>{s.sfx}</span></div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => scrollTo("what")} className="flex flex-col items-center gap-1.5 mx-auto transition-all hover:opacity-70" style={{ color: "#475569" }}>
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </section>

        {/* Section separator */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#f59e0b,#ec4899,#06b6d4,#22c55e,transparent)" }} />

        {/* ══ WHAT IS ══════════════════════════════════════════════════════════ */}
        <section id="what" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<BookOpen className="w-5 h-5" />} title="What is GameFiNow?" subtitle="A revolution at the intersection of gaming and decentralized finance — built on Stellar." color="#06b6d4" />
          <div className="grid md:grid-cols-2 gap-5 max-w-5xl">
            {[
              { icon: "🎮", color: "#06b6d4", title: "The Vision", text: "GameFiNow is a massively multiplayer online game where the entire economy lives on the Stellar blockchain. Every player action — creating a wallet, swapping tokens, trading items — is a real on-chain transaction." },
              { icon: "⛓️", color: "#a855f7", title: "Built on Stellar", text: "Stellar provides 5-second finality, fees of 0.00001 XLM per transaction, and native multi-asset support. With Soroban smart contracts, GameFiNow offers programmable DeFi primitives directly inside the game world." },
              { icon: "🎓", color: "#f59e0b", title: "DeFi Through Gameplay", text: "Quest 1 = wallet creation. Quest 2 = on-ramp. Quest 3 = token swaps. Quest 4 = yield vaults. By finishing onboarding, players are real DeFi users — without knowing it was that complex." },
              { icon: "🤝", color: "#22c55e", title: "The Ecosystem", text: "GameFiNow is a platform for the Stellar DeFi ecosystem. 9 partner protocols — Soroswap, WalletNow, DefIndex, PigFi, Dupply, NIDO, AutoFin, NEARX, and WAVE — have dedicated stands inside the world." },
            ].map((c, i) => (
              <FadeCard key={c.title} delay={i * 80} color={c.color}>
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{c.text}</p>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ HOW TO PLAY ══════════════════════════════════════════════════════ */}
        <section id="howtoplay" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<Zap className="w-5 h-5" />} title="How to Play" subtitle="4 quests that turn you into a DeFi native — in under 10 minutes." color="#a855f7" />
          <div className="relative max-w-4xl space-y-5">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 hidden md:block" style={{ background: "linear-gradient(180deg,#06b6d4,#22c55e,#f59e0b,#a855f7)" }} />
            {QUESTS.map((q, i) => {
              const { ref, visible } = useIntersection();
              return (
                <div key={q.n} ref={ref} className={`relative md:pl-20 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`} style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="absolute left-2 top-4 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black hidden md:flex" style={{ background: `${q.color}20`, border: `2px solid ${q.color}60`, color: q.color }}>
                    {q.n}
                  </div>
                  <div className="rounded-2xl p-6 transition-all hover:scale-[1.01]" style={{ background: q.bg, border: `2px solid ${q.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{q.icon}</span>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: q.color }}>Quest {q.n}</div>
                        <h3 className="text-lg font-black text-white">{q.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{q.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══ TOKENOMICS ═══════════════════════════════════════════════════════ */}
        <section id="tokenomics" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon="💎" title="Tokenomics" subtitle="Multi-asset economy powered by real Stellar on-chain assets." color="#22c55e" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mb-10">
            {TOKENS.map((t, i) => (
              <FadeCard key={t.code} delay={i * 70} color={t.color}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: `${t.color}25`, border: `2px solid ${t.color}50` }}>{t.emoji}</div>
                  {t.issuer !== "native" && (
                    <a href={`${EXPERT}/asset/${t.code}-${t.issuer}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-all" style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, color: t.color }}>
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-1">{t.code}</div>
                <div className="text-sm mb-3" style={{ color: "#94a3b8" }}>{t.desc}</div>
                {t.issuer !== "native" && <div className="font-mono text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.4)", color: "#475569" }}>{truncAddr(t.issuer)}</div>}
              </FadeCard>
            ))}
          </div>
          <div className="max-w-3xl rounded-2xl p-7" style={{ background: "rgba(0,0,0,0.5)", border: "2px solid rgba(245,158,11,0.2)" }}>
            <h3 className="text-lg font-black mb-5 flex items-center gap-2" style={{ color: "#fbbf24" }}><Shield className="w-5 h-5" /> Fee Structure</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              {[
                { val: "0.5%",          label: "Protocol Fee",       sub: "On P2P & swaps" },
                { val: "0.00001 XLM",   label: "Stellar Base Fee",   sub: "Per operation" },
                { val: "100 GAMEFI",    label: "VIP Vault Minimum",  sub: "24h lock for yield" },
              ].map(f => (
                <div key={f.label} className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="text-xl font-black break-words" style={{ color: "#fbbf24" }}>{f.val}</div>
                  <div className="text-sm font-bold text-white mt-1.5">{f.label}</div>
                  <div className="text-xs mt-1" style={{ color: "#64748b" }}>{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ON-CHAIN ═════════════════════════════════════════════════════════ */}
        <section id="onchain" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<Hash className="w-5 h-5" />} title="On-Chain Data" subtitle="All contracts and addresses are public. Verify everything directly on Stellar." color="#3b82f6" />
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
            <AddressCard label="GAMEFI Token Issuer" addr={ADDRS.gamefi} token="GAMEFI" note="Testnet" />
            <AddressCard label="GameFiNow Treasury"  addr={ADDRS.treasury} note="Protocol fees" />
            <AddressCard label="USDW Issuer — WalletNow" addr={ADDRS.usdw} token="USDW" note="USD Stablecoin" />
            <AddressCard label="BRW Issuer — WalletNow"  addr={ADDRS.brw}  token="BRW"  note="BRL Stablecoin" />
            <AddressCard label="USDC Issuer — Circle"    addr={ADDRS.usdc} token="USDC" note="Testnet USDC" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { href: `${EXPERT}/asset/GAMEFI-${ADDRS.gamefi}`, label: "⭐ GAMEFI on Stellar Expert", color: "#06b6d4" },
              { href: "https://laboratory.stellar.org",          label: "🔬 Stellar Laboratory",      color: "#a855f7" },
              { href: "https://horizon-testnet.stellar.org",     label: "🖥️ Horizon Testnet API",     color: "#64748b" },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: `${l.color}15`, border: `2px solid ${l.color}30`, color: l.color }}>
                <ExternalLink className="w-4 h-4" />{l.label}
              </a>
            ))}
          </div>
        </section>

        {/* ══ ECONOMY ══════════════════════════════════════════════════════════ */}
        <section id="economy" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<TrendingUp className="w-5 h-5" />} title="Economy" subtitle="A fully functional DeFi economy running inside the game world." color="#f97316" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
            {[
              { emoji: "🏪", color: "#ef4444", title: "P2P Store",   text: "List and trade in-game items for GAMEFI. Every trade settles on-chain with 0.5% fee to the treasury. Full provenance for all items." },
              { emoji: "💧", color: "#3b82f6", title: "Faucet",      text: "Free XLM from Stellar Friendbot for new players. 24h cooldown — gamified as a real fountain in the game world." },
              { emoji: "🔒", color: "#8b5cf6", title: "Vault/Yield", text: "Lock 100+ GAMEFI for 24h. Soroban-enforced. Earn yield, unlock cosmetics, gain governance power." },
              { emoji: "🔄", color: "#06b6d4", title: "DEX Swap",    text: "SoroSwap integration. Trade USDW ↔ GAMEFI ↔ XLM in-game. Same Soroban contract used on production." },
            ].map((e, i) => (
              <FadeCard key={e.title} delay={i * 80} color={e.color}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: `${e.color}20`, border: `2px solid ${e.color}40` }}>{e.emoji}</div>
                <h3 className="text-base font-black text-white mb-2">{e.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{e.text}</p>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ WORLD ════════════════════════════════════════════════════════════ */}
        <section id="world" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<Map className="w-5 h-5" />} title="World Map" subtitle="5 interconnected districts — each with unique DeFi mechanics." color="#14b8a6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {ZONES.map((z, i) => (
              <FadeCard key={z.id} delay={i * 70} color={z.color}>
                <div className="text-4xl mb-3">{z.icon}</div>
                <h3 className="text-lg font-black text-white mb-1.5">{z.name}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>{z.desc}</p>
                <code className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>mapId: "{z.id}"</code>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ PARTNERS ═════════════════════════════════════════════════════════ */}
        <section id="partners" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Globe className="w-5 h-5" />} title="Ecosystem Partners" subtitle="DeFi protocols with dedicated stands inside the GameFiNow world." color="#ec4899" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {PARTNERS.map((p, i) => (
              <FadeCard key={p.name} delay={i * 55} color={p.color}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${p.color}25`, border: `2px solid ${p.color}50` }}>{p.emoji}</div>
                  <div>
                    <h3 className="font-black text-white">{p.name}</h3>
                  </div>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto" style={{ color: "#374151" }}><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{p.desc}</p>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ LIVE STATS ═══════════════════════════════════════════════════════ */}
        <section id="livestats" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<Activity className="w-5 h-5" />} title="Live Stats" subtitle="Real-time data from Stellar Horizon Testnet and CoinGecko." color="#4ade80" />
          <LiveStatsPanel data={liveData} />
        </section>

        {/* ══ ROADMAP ══════════════════════════════════════════════════════════ */}
        <section id="roadmap" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Layers className="w-5 h-5" />} title="Roadmap" subtitle="From genesis to a fully decentralized gaming economy." color="#818cf8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
            {ROADMAP.map((r, i) => {
              const statusCfg = { done: { bg: "#22c55e18", border: "#22c55e35", text: "#4ade80" }, current: { bg: "#06b6d418", border: "#06b6d435", text: "#67e8f9" }, soon: { bg: "#f59e0b18", border: "#f59e0b35", text: "#fcd34d" }, future: { bg: "#ffffff08", border: "#ffffff12", text: "#64748b" } };
              const cfg = statusCfg[r.status as keyof typeof statusCfg];
              const labels = { done: "✓ Complete", current: "🔥 In Progress", soon: "⏳ Coming Soon", future: "🌌 Planned" };
              return (
                <FadeCard key={r.phase} delay={i * 90} color={cfg.text}>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black mb-3" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.text }}>
                    {labels[r.status as keyof typeof labels]}
                  </span>
                  <div className="text-xs font-mono mb-1" style={{ color: "#374151" }}>Phase {r.phase}</div>
                  <div className="text-3xl mb-1">{r.emoji}</div>
                  <h3 className="text-lg font-black text-white mb-3">{r.title}</h3>
                  <ul className="space-y-2">
                    {r.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#94a3b8" }}>
                        <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: cfg.text }} />{item}
                      </li>
                    ))}
                  </ul>
                </FadeCard>
              );
            })}
          </div>

          {/* Rainbow separator */}
          <div className="mt-20 mb-8 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ec4899,#06b6d4,#22c55e,#a855f7)" }} />
          <div className="text-center" style={{ color: "#1f2937" }}>
            <p className="font-mono text-xs">GameFiNow v0.7.0 // Stellar Testnet // Learn. Play. Grow.</p>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="font-mono text-xs hover:underline transition-colors" style={{ color: "#374151" }}>
              {EXPERT}
            </a>
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
    <div ref={ref} className="max-w-5xl space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="XLM / USD" value={data.xlmPrice ? `$${(xlmUsd / 10000).toFixed(4)}` : "—"} sub="CoinGecko • Live" loading={data.loading} icon={<TrendingUp className="w-3.5 h-3.5" />} color="#4ade80" />
        <StatCard label="XLM / BRL" value={data.xlmPrice ? `R$ ${(xlmBrl / 1000).toFixed(4)}` : "—"} sub="CoinGecko • Live" loading={data.loading} icon={<Coins className="w-3.5 h-3.5" />} color="#fbbf24" />
        <StatCard label="Latest Ledger" value={data.ledger ? `#${data.ledger.sequence.toLocaleString()}` : "—"} sub={data.ledger ? `Fee: ${data.ledger.base_fee} stroops` : "Connecting..."} loading={data.loading} icon={<Server className="w-3.5 h-3.5" />} color="#c4b5fd" />
      </div>

      {data.account && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(74,222,128,0.15)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
              <Shield className="w-4 h-4" /> Treasury Account
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 font-bold transition-colors" style={{ color: "#374151" }}>
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#374151" }}>Public Address</div>
              <div className="font-mono text-xs break-all leading-relaxed" style={{ color: "#7dd3fc" }}>{data.account.id}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#374151" }}>Sequence</div>
              <div className="font-mono text-sm text-white">{data.account.sequence}</div>
              <div className="text-xs mt-0.5" style={{ color: "#374151" }}>Sub-entries: {data.account.num_subentries}</div>
            </div>
          </div>
          {data.account.balances.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#374151" }}>On-Chain Balances</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.account.balances.map((b, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-xs font-mono" style={{ color: "#64748b" }}>{b.asset_code || "XLM"}</div>
                    <div className="text-sm font-black text-white font-mono">{parseFloat(b.balance).toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.transactions.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(74,222,128,0.12)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
              <Activity className="w-4 h-4" /> Live Transactions
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 font-bold" style={{ color: "#374151" }}>
              All txns <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.transactions.map(tx => (
              <a key={tx.id} href={`${EXPERT}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-4 px-6 py-3 transition-colors group" style={{}}>
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div className="font-mono text-xs flex-1 truncate" style={{ color: "#7dd3fc" }}>{tx.hash.slice(0, 20)}...{tx.hash.slice(-8)}</div>
                <BarChart3 className="w-3 h-3 shrink-0" style={{ color: "#374151" }} />
                <div className="text-xs shrink-0" style={{ color: "#4b5563" }}>{tx.operation_count} op{tx.operation_count !== 1 ? "s" : ""}</div>
                <div className="text-xs flex items-center gap-1 shrink-0" style={{ color: "#374151" }}><Clock className="w-3 h-3" />{timeAgo(tx.created_at)}</div>
                <ExternalLink className="w-3 h-3 shrink-0" style={{ color: "#374151" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {data.loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "#4ade80", borderTopColor: "transparent" }} />
          <p className="text-sm font-mono" style={{ color: "#374151" }}>Fetching from Stellar Horizon...</p>
        </div>
      )}
      {!data.loading && data.error && (
        <div className="text-center py-8 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.15)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>⚠️ {data.error}</p>
        </div>
      )}
    </div>
  );
}
