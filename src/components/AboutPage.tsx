import React, { useState, useEffect, useRef } from "react";
import {
  X, ExternalLink, Copy, CheckCheck, ChevronDown, Zap, Shield, Globe,
  Coins, BarChart3, Map, BookOpen, Star, TrendingUp, Activity,
  Server, Clock, Hash, ArrowRight, Layers, Languages, Target
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface HorizonBalance { asset_type: string; asset_code?: string; balance: string; }
interface HorizonAccount { id: string; sequence: string; balances: HorizonBalance[]; num_subentries: number; }
interface HorizonTx { id: string; hash: string; created_at: string; fee_charged: string; operation_count: number; }
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
function useScrollY(id: string) {
  const [y, setY] = useState(0);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const h = () => setY(el.scrollTop);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, [id]);
  return y;
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
      const [acRes, txRes, prRes, ldRes] = await Promise.allSettled([
        fetch(`${HORIZON}/accounts/${ADDRS.treasury}`).then(r => r.json()),
        fetch(`${HORIZON}/accounts/${ADDRS.treasury}/transactions?limit=8&order=desc`).then(r => r.json()),
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,brl").then(r => r.json()),
        fetch(`${HORIZON}/ledgers?limit=1&order=desc`).then(r => r.json()),
      ]);
      setData({
        account: acRes.status === "fulfilled" && !acRes.value.status ? acRes.value : null,
        transactions: txRes.status === "fulfilled" ? (txRes.value._embedded?.records ?? []) : [],
        xlmPrice: prRes.status === "fulfilled" ? { usd: prRes.value.stellar?.usd ?? 0, brl: prRes.value.stellar?.brl ?? 0 } : null,
        ledger: ldRes.status === "fulfilled" ? (ldRes.value._embedded?.records?.[0] ?? null) : null,
        loading: false, error: null, lastRefresh: new Date(),
      });
    } catch { setData(d => ({ ...d, loading: false, error: "Cannot reach Stellar Horizon", lastRefresh: new Date() })); }
  };
  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 30000); return () => clearInterval(iv); }, []);
  return data;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const truncAddr = (a: string) => `${a.slice(0, 8)}...${a.slice(-8)}`;
const timeAgo = (d: string, updatedLabel: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
};

// ─── ADDRESS CARD ─────────────────────────────────────────────────────────────
function AddressCard({ label, addr, token, note, copyLabel, copiedLabel, explorerLabel, assetLabel }: {
  label: string; addr: string; token?: string; note?: string;
  copyLabel: string; copiedLabel: string; explorerLabel: string; assetLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-2xl p-5 transition-all" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(6,182,212,0.2)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#06b6d4" }}>{label}</span>
        {note && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>{note}</span>}
      </div>
      <div className="font-mono text-xs break-all leading-relaxed mb-4" style={{ color: "#7dd3fc" }}>{addr}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
          style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: copied ? "#4ade80" : "#67e8f9" }}>
          {copied ? <><CheckCheck className="w-3 h-3" />{copiedLabel}</> : <><Copy className="w-3 h-3" />{copyLabel}</>}
        </button>
        <a href={`${EXPERT}/account/${addr}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c4b5fd" }}>
          <ExternalLink className="w-3 h-3" />{explorerLabel}
        </a>
        {token && (
          <a href={`${EXPERT}/asset/${token}-${addr}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }}>
            <Coins className="w-3 h-3" />{assetLabel}
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
function FadeCard({ children, delay = 0, color = "#06b6d4", className = "" }: { children: React.ReactNode; delay?: number; color?: string; className?: string; key?: string | number }) {
  const { ref, visible } = useIntersection();
  return (
    <div ref={ref} className={`rounded-2xl p-6 transition-all hover:scale-[1.02] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "600ms", background: "rgba(0,0,0,0.50)", border: `2px solid ${color}22`, boxShadow: `0 0 20px ${color}08` }}>
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
const STARS_DATA = Array.from({ length: 70 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 0.5, delay: Math.random() * 5, dur: 2 + Math.random() * 3 }));
function FloatingStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS_DATA.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out infinite alternate`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props { onClose: () => void; }

export const AboutPage: React.FC<Props> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("hero");
  const [currentBg, setCurrentBg] = useState(0);
  const liveData = useLiveData();
  const scrollY = useScrollY("about-container");

  const NAV_SECTIONS = [
    { id: "hero",       label: t("about.nav.home"),       Icon: Star,       color: "#f59e0b" },
    { id: "startup",    label: t("about.nav.startup"),    Icon: Target,     color: "#eab308" },
    { id: "what",       label: t("about.nav.what"),       Icon: BookOpen,   color: "#06b6d4" },
    { id: "howtoplay",  label: t("about.nav.howtoplay"),  Icon: Zap,        color: "#a855f7" },
    { id: "tokenomics", label: t("about.nav.tokenomics"), Icon: Coins,      color: "#22c55e" },
    { id: "onchain",    label: t("about.nav.onchain"),    Icon: Hash,       color: "#3b82f6" },
    { id: "economy",    label: t("about.nav.economy"),    Icon: TrendingUp, color: "#f97316" },
    { id: "world",      label: t("about.nav.world"),      Icon: Map,        color: "#14b8a6" },
    { id: "partners",   label: t("about.nav.partners"),   Icon: Globe,      color: "#ec4899" },
    { id: "livestats",  label: t("about.nav.livestats"),  Icon: Activity,   color: "#4ade80" },
    { id: "admin",      label: "Admin",                   Icon: Shield,     color: "#ef4444" },
    { id: "roadmap",    label: t("about.nav.roadmap"),    Icon: Layers,     color: "#818cf8" },
  ];

  // Quest data (uses existing i18n keys)
  const QUESTS = [
    { n: 1, icon: "🔑", color: "#06b6d4", bg: "#06b6d415", border: "#06b6d440", title: t("quests.wallet.title"), desc: t("quests.wallet.description") },
    { n: 2, icon: "💸", color: "#22c55e", bg: "#22c55e15", border: "#22c55e40", title: t("quests.onramp.title"), desc: t("quests.onramp.description") },
    { n: 3, icon: "🔄", color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b40", title: t("quests.soroban.title"), desc: t("quests.soroban.description") },
    { n: 4, icon: "💎", color: "#a855f7", bg: "#a855f715", border: "#a855f740", title: t("quests.hold.title"), desc: t("quests.hold.description") },
  ];

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

  const ZONES = [
    { id: "center", icon: "🏛️", color: "#f59e0b", name: t("about.world.center_name"), desc: t("about.world.center_desc") },
    { id: "east",   icon: "🌅", color: "#06b6d4", name: t("about.world.east_name"),   desc: t("about.world.east_desc") },
    { id: "west",   icon: "🌊", color: "#3b82f6", name: t("about.world.west_name"),   desc: t("about.world.west_desc") },
    { id: "north",  icon: "🏔️", color: "#8b5cf6", name: t("about.world.north_name"),  desc: t("about.world.north_desc") },
    { id: "south",  icon: "🌴", color: "#22c55e", name: t("about.world.south_name"),  desc: t("about.world.south_desc") },
  ];

  const ROADMAP = [
    { phase: "0", emoji: "✅", status: "done",    title: "Genesis",    items: ["Stellar testnet wallet", "GAMEFI token on-chain", "4-quest onboarding", "Pixel art MMO world (60×60)", "WalletNow SDK integration"] },
    { phase: "1", emoji: "🔥", status: "current", title: "Expansion",  items: ["9+ partner stands live", "P2P marketplace 0.5%", "Outfit NFT system", "Real-time multiplayer", "About page & docs", "Mobile UI"] },
    { phase: "2", emoji: "⏳", status: "soon",    title: "Economy",    items: ["On-chain vault yield", "In-game liquidity pools", "DAO governance", "Soroban contract audit", "GAMEFI staking"] },
    { phase: "3", emoji: "🌌", status: "future",  title: "Multiverse", items: ["Mainnet token launch", "Cross-chain bridges", "Native mobile app", "Tournament prize pools", "Partner SDK"] },
  ];

  const ROADMAP_STATUS: Record<string, string> = {
    done: t("about.roadmap.done"),
    current: t("about.roadmap.current"),
    soon: t("about.roadmap.soon"),
    future: t("about.roadmap.future"),
  };

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
    if (id === "admin") {
      window.open("/admin", "_blank");
      return;
    }
    const el = document.getElementById(id);
    const container = document.getElementById("about-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  const changeLang = (lng: string) => i18n.changeLanguage(lng);
  const curLang = i18n.language;
  const isLang = (lng: string) => curLang === lng || (lng === "pt" && (curLang === "pt-BR" || curLang === "pt-PT"));

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    done:    { bg: "#22c55e18", border: "#22c55e35", text: "#4ade80" },
    current: { bg: "#06b6d418", border: "#06b6d435", text: "#67e8f9" },
    soon:    { bg: "#f59e0b18", border: "#f59e0b35", text: "#fcd34d" },
    future:  { bg: "#ffffff08", border: "#ffffff12", text: "#64748b" },
  };

  return (
    <div className="fixed inset-0 z-[200] flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes twinkle { from{opacity:0.1} to{opacity:0.9} }
        @keyframes glitch1 { 0%,88%,100%{opacity:0;transform:translate(0)} 89%{opacity:.7;transform:translate(-4px,2px)} 94%{opacity:.7;transform:translate(4px,-2px)} }
        @keyframes glitch2 { 0%,83%,100%{opacity:0;transform:translate(0)} 84%{opacity:.5;transform:translate(3px,2px)} 91%{opacity:.5;transform:translate(-3px,-2px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes rainbow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .glitch-1 { animation: glitch1 4s infinite; clip-path: polygon(0 25%, 100% 25%, 100% 50%, 0 50%); }
        .glitch-2 { animation: glitch2 4s infinite .6s; clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
        .float-anim { animation: float 5s ease-in-out infinite; }
        .rainbow-text { background: linear-gradient(270deg,#f59e0b,#ec4899,#06b6d4,#22c55e,#a855f7,#f59e0b); background-size:400% 400%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:rainbow 4s ease infinite; }
        .section-bg { background: linear-gradient(180deg,rgba(5,8,15,0)_0%,rgba(5,8,15,0.92)_20%,rgba(5,8,15,0.96)_80%,rgba(5,8,15,0)_100%); }
        #about-container::-webkit-scrollbar{width:4px}
        #about-container::-webkit-scrollbar-track{background:#05080f}
        #about-container::-webkit-scrollbar-thumb{background:#f59e0b50;border-radius:2px}
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 py-6 px-3" style={{ background: "rgba(3,6,14,0.96)", borderRight: "2px solid rgba(245,158,11,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="px-3 mb-6">
          <div className="text-base font-black tracking-widest uppercase rainbow-text mb-0.5">GAMEFINOW</div>
          <div className="font-mono text-[10px]" style={{ color: "#374151" }}>v0.7.0 • STELLAR TESTNET</div>
        </div>
        {/* Language selector */}
        <div className="px-3 mb-5">
          <div className="flex items-center gap-1 mb-1.5" style={{ color: "#4b5563" }}>
            <Languages className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-bold">{t("about.nav.language")}</span>
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {["en","pt","es"].map((lng, i) => (
              <button key={lng} onClick={() => changeLang(lng)}
                className="flex-1 py-1.5 text-[10px] font-black uppercase transition-all"
                style={{ background: isLang(lng) ? "rgba(245,158,11,0.9)" : "rgba(0,0,0,0.4)", color: isLang(lng) ? "#000" : "#6b7280", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                {lng.toUpperCase()}
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
            <div className="w-2 h-2 rounded-full" style={{ background: liveData.loading ? "#fbbf24" : "#4ade80", animation: "pulse 2s infinite" }} />
            <span className="text-[10px] font-mono" style={{ color: "#374151" }}>{liveData.loading ? t("about.nav.connecting") : t("about.nav.live")}</span>
          </div>
          {liveData.lastRefresh && (
            <div className="text-[10px] font-mono" style={{ color: "#1f2937" }}>
              {t("about.nav.updated")} {timeAgo(liveData.lastRefresh.toISOString(), t("about.nav.updated"))}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div id="about-container" className="flex-1 overflow-y-auto" style={{ background: "#05080f" }}>
        {/* Close */}
        <button onClick={onClose} className="fixed top-4 right-4 z-[300] w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all"
          style={{ background: "rgba(0,0,0,0.85)", border: "2px solid rgba(255,255,255,0.12)", color: "#9ca3af", backdropFilter: "blur(12px)" }}>
          <X className="w-5 h-5" />
        </button>
        {/* Mobile lang */}
        <div className="lg:hidden fixed top-4 left-4 z-[300] flex gap-1">
          {["en","pt","es"].map(lng => (
            <button key={lng} onClick={() => changeLang(lng)} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
              style={{ background: isLang(lng) ? "#f59e0b" : "rgba(0,0,0,0.75)", color: isLang(lng) ? "#000" : "#6b7280", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
              {lng.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* BG Carousel */}
          {BG_IMAGES.map((bg, i) => (
            <div key={bg} className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${bg})`, opacity: i === currentBg ? 1 : 0, transform: i === currentBg ? "scale(1.05)" : "scale(1)" }} />
          ))}
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(5,8,15,0.98) 0%,rgba(5,8,15,0.60) 50%,rgba(5,8,15,0.70) 100%)" }} />
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.22) 50%)", backgroundSize: "100% 3px", opacity: 0.5 }} />
          <FloatingStars />

          <div className="relative z-10 text-center px-6 max-w-5xl" style={{ transform: `translateY(${scrollY * -0.06}px)` }}>
            {/* Glitch title */}
            <div className="relative inline-block float-anim mb-4">
              <h1 className="text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none text-white select-none"
                style={{ WebkitTextStroke: "2px rgba(245,158,11,0.25)", textShadow: "0 0 60px rgba(245,158,11,0.3),0 0 120px rgba(6,182,212,0.2),0 4px 32px rgba(0,0,0,0.9)" }}>
                GAMEFINOW
              </h1>
              <h1 className="glitch-1 absolute inset-0 text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none select-none pointer-events-none" style={{ color: "#06b6d4" }} aria-hidden>GAMEFINOW</h1>
              <h1 className="glitch-2 absolute inset-0 text-7xl md:text-[9rem] font-black uppercase tracking-tighter leading-none select-none pointer-events-none" style={{ color: "#f59e0b" }} aria-hidden>GAMEFINOW</h1>
            </div>

            {/* ── SUBTITLE with strong pill background ── */}
            <div className="inline-block mb-5 px-6 py-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.75)", border: "2px solid rgba(245,158,11,0.5)", backdropFilter: "blur(12px)", boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}>
              <p className="text-2xl md:text-3xl font-black tracking-[0.2em] uppercase"
                style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(245,158,11,0.8), 0 2px 8px rgba(0,0,0,1)" }}>
                {t("about.hero.subtitle")}
              </p>
            </div>

            {/* Description with pill */}
            <div className="inline-block mb-8 px-5 py-3 rounded-xl max-w-xl mx-auto" style={{ background: "rgba(0,0,0,0.70)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <p className="text-base md:text-lg font-semibold leading-relaxed" style={{ color: "#e2e8f0", textShadow: "0 1px 6px rgba(0,0,0,1)" }}>
                {t("about.hero.description")}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { label: "🌐 Stellar Testnet",          color: "#06b6d4" },
                { label: "⚡ Soroban Smart Contracts",  color: "#a855f7" },
                { label: "👛 WalletNow SDK",            color: "#22c55e" },
                { label: "🎮 GameFi v0.7.0",            color: "#f59e0b" },
              ].map(b => (
                <span key={b.label} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black"
                  style={{ background: `${b.color}25`, border: `2px solid ${b.color}60`, color: b.color, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {b.label}
                </span>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
              {[
                { val: "5",   sfx: "",  label: t("about.hero.districts") },
                { val: "9",   sfx: "+", label: t("about.hero.partners") },
                { val: "0.5", sfx: "%", label: t("about.hero.fee") },
                { val: "5",   sfx: "s", label: t("about.hero.finality") },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(0,0,0,0.65)", border: "2px solid rgba(245,158,11,0.3)", backdropFilter: "blur(8px)" }}>
                  <div className="text-2xl font-black text-white">{s.val}<span style={{ color: "#f59e0b" }}>{s.sfx}</span></div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => scrollTo("what")} className="flex flex-col items-center gap-1.5 mx-auto transition-all hover:opacity-70" style={{ color: "#94a3b8" }}>
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">{t("about.hero.explore")}</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </section>

        {/* Rainbow separator */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#f59e0b,#ec4899,#06b6d4,#22c55e,transparent)" }} />

        {/* ══ ABOUT THE STARTUP / PITCH DECK ══════════════════════════════════ */}
        <section id="startup" className="py-32 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Shield className="w-6 h-6" />} title={t("about.startup.title")} subtitle={t("about.startup.subtitle")} color="#eab308" />
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            {[
              { icon: "🎯", color: "#ef4444", title: t("about.startup.problem_title"),  text: t("about.startup.problem_desc") },
              { icon: "📦", color: "#06b6d4", title: t("about.startup.product_title"),  text: t("about.startup.product_desc") },
              { icon: "🌐", color: "#a855f7", title: t("about.startup.market_title"),   text: t("about.startup.market_desc") },
              { icon: "💰", color: "#22c55e", title: t("about.startup.business_title"), text: t("about.startup.business_desc") },
              { icon: "🚀", color: "#f59e0b", title: t("about.startup.future_title"),   text: t("about.startup.future_desc") },
            ].map((c, i) => (
              <FadeCard key={c.title} delay={i * 100} color={c.color} className="flex flex-col md:flex-row items-start md:items-center gap-6 p-8">
                <div className="w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center text-4xl" style={{ background: `${c.color}15`, border: `2px solid ${c.color}40` }}>
                  {c.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                    {c.title}
                    <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c.color}50, transparent)` }} />
                  </h3>
                  <div className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                    {c.text.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('•') ? 'ml-4 mt-1.5' : (idx > 0 ? 'mt-3' : '')}>{line}</p>
                    ))}
                  </div>
                </div>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ WHAT IS ══════════════════════════════════════════════════════════ */}
        <section id="what" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<BookOpen className="w-5 h-5" />} title={t("about.what.title")} subtitle={t("about.what.subtitle")} color="#06b6d4" />
          <div className="grid md:grid-cols-2 gap-5 max-w-5xl">
            {[
              { icon: "🎮", color: "#06b6d4", title: t("about.what.vision_title"),    text: t("about.what.vision_text") },
              { icon: "⛓️", color: "#a855f7", title: t("about.what.stellar_title"),   text: t("about.what.stellar_text") },
              { icon: "🎓", color: "#f59e0b", title: t("about.what.defi_title"),      text: t("about.what.defi_text") },
              { icon: "🤝", color: "#22c55e", title: t("about.what.ecosystem_title"), text: t("about.what.ecosystem_text") },
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
        <section id="howtoplay" className="py-32 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Zap className="w-6 h-6" />} title={t("about.howtoplay.title")} subtitle={t("about.howtoplay.subtitle")} color="#a855f7" />
          
          <div className="relative max-w-4xl space-y-6 mb-24 mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 hidden md:block" style={{ background: "linear-gradient(180deg,#06b6d4,#22c55e,#f59e0b,#a855f7)" }} />
            {QUESTS.map((q, i) => {
              const { ref, visible } = useIntersection();
              return (
                <div key={q.n} ref={ref} className={`relative md:pl-20 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`} style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="absolute left-2 top-6 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black hidden md:flex" style={{ background: `${q.color}20`, border: `2px solid ${q.color}60`, color: q.color }}>{q.n}</div>
                  <div className="rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.02]" style={{ background: q.bg, border: `2px solid ${q.border}` }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${q.color}20` }}>{q.icon}</div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: q.color }}>{t("about.howtoplay.quest")} {q.n}</div>
                        <h3 className="text-xl font-black text-white">{q.title}</h3>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed" style={{ color: "#94a3b8" }}>{q.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Expandido do Jogador */}
          <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12" style={{ background: "rgba(0,0,0,0.65)", border: "2px solid rgba(168,85,247,0.3)", backdropFilter: "blur(12px)" }}>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-10 flex items-center gap-4">
              <span className="text-3xl md:text-4xl">📖</span> {t("about.howtoplay.guide_title")}
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { step: "01", icon: "🆔", color: "#06b6d4", title: t("about.howtoplay.step1_title"), desc: t("about.howtoplay.step1_desc") },
                { step: "02", icon: "💳", color: "#22c55e", title: t("about.howtoplay.step2_title"), desc: t("about.howtoplay.step2_desc") },
                { step: "03", icon: "⚔️", color: "#ef4444", title: t("about.howtoplay.step3_title"), desc: t("about.howtoplay.step3_desc") },
                { step: "04", icon: "💎", color: "#f59e0b", title: t("about.howtoplay.step4_title"), desc: t("about.howtoplay.step4_desc") },
                { step: "05", icon: "🔒", color: "#a855f7", title: t("about.howtoplay.step5_title"), desc: t("about.howtoplay.step5_desc") },
              ].map((s, i) => (
                <div key={s.step} className={`rounded-3xl p-8 transition-all hover:scale-[1.02] ${i === 4 ? "md:col-span-2" : ""}`}
                  style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid ${s.color}30` }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${s.color}20` }}>{s.icon}</div>
                    <span className="font-mono text-sm font-black px-3 py-1 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>{s.step}</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">{s.title}</h4>
                  <div className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
                    {s.desc.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('•') ? 'ml-3 mt-1.5' : (idx > 0 ? 'mt-2' : '')}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TOKENOMICS ═══════════════════════════════════════════════════════ */}
        <section id="tokenomics" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Coins className="w-5 h-5" />} title={t("about.tokenomics.title")} subtitle={t("about.tokenomics.subtitle")} color="#22c55e" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mb-10">
            {TOKENS.map((tok, i) => (
              <FadeCard key={tok.code} delay={i * 70} color={tok.color}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${tok.color}25`, border: `2px solid ${tok.color}50` }}>{tok.emoji}</div>
                  {tok.issuer !== "native" && (
                    <a href={`${EXPERT}/asset/${tok.code}-${tok.issuer}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold"
                      style={{ background: `${tok.color}15`, border: `1px solid ${tok.color}30`, color: tok.color }}>
                      <ExternalLink className="w-3 h-3" /> {t("about.tokenomics.view")}
                    </a>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-1">{tok.code}</div>
                <div className="text-sm mb-3" style={{ color: "#94a3b8" }}>{tok.desc}</div>
                {tok.issuer !== "native" && <div className="font-mono text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.4)", color: "#475569" }}>{truncAddr(tok.issuer)}</div>}
              </FadeCard>
            ))}
          </div>
          <div className="max-w-3xl rounded-2xl p-7" style={{ background: "rgba(0,0,0,0.5)", border: "2px solid rgba(245,158,11,0.2)" }}>
            <h3 className="text-lg font-black mb-5 flex items-center gap-2" style={{ color: "#fbbf24" }}><Shield className="w-5 h-5" /> {t("about.tokenomics.fee_title")}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              {[
                { val: "0.5%",        label: t("about.tokenomics.protocol_fee"), sub: t("about.tokenomics.protocol_fee_sub") },
                { val: "0.00001 XLM", label: t("about.tokenomics.stellar_fee"),  sub: t("about.tokenomics.stellar_fee_sub") },
                { val: "100 GAMEFI",  label: t("about.tokenomics.vault_min"),    sub: t("about.tokenomics.vault_min_sub") },
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
          <SectionTitle icon={<Hash className="w-5 h-5" />} title={t("about.onchain.title")} subtitle={t("about.onchain.subtitle")} color="#3b82f6" />
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
            <AddressCard label={t("about.onchain.gamefi_issuer")} addr={ADDRS.gamefi} token="GAMEFI" note={t("about.onchain.testnet")} copyLabel={t("about.onchain.copy")} copiedLabel={t("about.onchain.copied")} explorerLabel={t("about.onchain.explorer")} assetLabel={t("about.onchain.asset")} />
            <AddressCard label={t("about.onchain.treasury")} addr={ADDRS.treasury} note={t("about.onchain.protocol_fees")} copyLabel={t("about.onchain.copy")} copiedLabel={t("about.onchain.copied")} explorerLabel={t("about.onchain.explorer")} assetLabel={t("about.onchain.asset")} />
            <AddressCard label={t("about.onchain.usdw_issuer")} addr={ADDRS.usdw} token="USDW" note={t("about.onchain.usd_stable")} copyLabel={t("about.onchain.copy")} copiedLabel={t("about.onchain.copied")} explorerLabel={t("about.onchain.explorer")} assetLabel={t("about.onchain.asset")} />
            <AddressCard label={t("about.onchain.brw_issuer")} addr={ADDRS.brw} token="BRW" note={t("about.onchain.brl_stable")} copyLabel={t("about.onchain.copy")} copiedLabel={t("about.onchain.copied")} explorerLabel={t("about.onchain.explorer")} assetLabel={t("about.onchain.asset")} />
            <AddressCard label={t("about.onchain.usdc_issuer")} addr={ADDRS.usdc} token="USDC" note={t("about.onchain.testnet_usdc")} copyLabel={t("about.onchain.copy")} copiedLabel={t("about.onchain.copied")} explorerLabel={t("about.onchain.explorer")} assetLabel={t("about.onchain.asset")} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { href: `${EXPERT}/asset/GAMEFI-${ADDRS.gamefi}`, label: "⭐ GAMEFI on Stellar Expert", color: "#06b6d4" },
              { href: "https://laboratory.stellar.org",          label: "🔬 Stellar Laboratory",      color: "#a855f7" },
              { href: "https://horizon-testnet.stellar.org",     label: "🖥️ Horizon Testnet API",     color: "#64748b" },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: `${l.color}15`, border: `2px solid ${l.color}30`, color: l.color }}>
                <ExternalLink className="w-4 h-4" />{l.label}
              </a>
            ))}
          </div>
        </section>

        {/* ══ ECONOMY ══════════════════════════════════════════════════════════ */}
        <section id="economy" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<TrendingUp className="w-5 h-5" />} title={t("about.economy.title")} subtitle={t("about.economy.subtitle")} color="#f97316" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
            {[
              { emoji: "🏪", color: "#ef4444", title: t("about.economy.p2p_title"),   text: t("about.economy.p2p_text") },
              { emoji: "💧", color: "#3b82f6", title: t("about.economy.faucet_title"),text: t("about.economy.faucet_text") },
              { emoji: "🔒", color: "#8b5cf6", title: t("about.economy.vault_title"), text: t("about.economy.vault_text") },
              { emoji: "🔄", color: "#06b6d4", title: t("about.economy.dex_title"),   text: t("about.economy.dex_text") },
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
          <SectionTitle icon={<Map className="w-5 h-5" />} title={t("about.world.title")} subtitle={t("about.world.subtitle")} color="#14b8a6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
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
          <SectionTitle icon={<Globe className="w-5 h-5" />} title={t("about.partners.title")} subtitle={t("about.partners.subtitle")} color="#ec4899" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {PARTNERS.map((p, i) => (
              <FadeCard key={p.name} delay={i * 55} color={p.color}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${p.color}25`, border: `2px solid ${p.color}50` }}>{p.emoji}</div>
                  <h3 className="font-black text-white">{p.name}</h3>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto" style={{ color: "#374151" }}><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{p.desc}</p>
              </FadeCard>
            ))}
          </div>
        </section>

        {/* ══ LIVE STATS ═══════════════════════════════════════════════════════ */}
        <section id="livestats" className="py-24 px-6 md:px-16">
          <SectionTitle icon={<Activity className="w-5 h-5" />} title={t("about.livestats.title")} subtitle={t("about.livestats.subtitle")} color="#4ade80" />
          <LiveStatsPanel data={liveData} t={t} />
        </section>

        {/* ══ ROADMAP ══════════════════════════════════════════════════════════ */}
        <section id="roadmap" className="py-24 px-6 md:px-16 section-bg">
          <SectionTitle icon={<Layers className="w-5 h-5" />} title={t("about.roadmap.title")} subtitle={t("about.roadmap.subtitle")} color="#818cf8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
            {ROADMAP.map((r, i) => {
              const cfg = statusColors[r.status];
              return (
                <FadeCard key={r.phase} delay={i * 90} color={cfg.text}>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black mb-3"
                    style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.text }}>
                    {ROADMAP_STATUS[r.status]}
                  </span>
                  <div className="text-xs font-mono mb-1" style={{ color: "#374151" }}>{t("about.roadmap.phase")} {r.phase}</div>
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
          <div className="mt-20 mb-8 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ec4899,#06b6d4,#22c55e,#a855f7)" }} />
          <div className="text-center">
            <p className="font-mono text-xs mb-1" style={{ color: "#1f2937" }}>GameFiNow v0.7.0 // Stellar Testnet // {t("about.hero.subtitle")}</p>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="font-mono text-xs hover:underline" style={{ color: "#374151" }}>{EXPERT}</a>
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── LIVE STATS PANEL ─────────────────────────────────────────────────────────
function LiveStatsPanel({ data, t }: { data: LiveData; t: (key: string) => string }) {
  const { ref, visible } = useIntersection();
  const xlmUsd = useCounter(data.xlmPrice ? Math.round(data.xlmPrice.usd * 10000) : 0, visible);
  const xlmBrl = useCounter(data.xlmPrice ? Math.round(data.xlmPrice.brl * 1000) : 0, visible);

  return (
    <div ref={ref} className="max-w-5xl space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label={t("about.livestats.xlm_usd")} value={data.xlmPrice ? `$${(xlmUsd / 10000).toFixed(4)}` : "—"} sub={t("about.livestats.coingecko")} loading={data.loading} icon={<TrendingUp className="w-3.5 h-3.5" />} color="#4ade80" />
        <StatCard label={t("about.livestats.xlm_brl")} value={data.xlmPrice ? `R$ ${(xlmBrl / 1000).toFixed(4)}` : "—"} sub={t("about.livestats.coingecko")} loading={data.loading} icon={<Coins className="w-3.5 h-3.5" />} color="#fbbf24" />
        <StatCard label={t("about.livestats.ledger")} value={data.ledger ? `#${data.ledger.sequence.toLocaleString()}` : "—"} sub={data.ledger ? `${t("about.livestats.fee")}: ${data.ledger.base_fee} ${t("about.livestats.stroops")}` : t("about.livestats.connecting")} loading={data.loading} icon={<Server className="w-3.5 h-3.5" />} color="#c4b5fd" />
      </div>

      {data.account && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(74,222,128,0.15)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
              <Shield className="w-4 h-4" /> {t("about.livestats.treasury")}
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 font-bold" style={{ color: "#374151" }}>
              {t("about.livestats.explorer")} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#374151" }}>{t("about.livestats.address")}</div>
              <div className="font-mono text-xs break-all leading-relaxed" style={{ color: "#7dd3fc" }}>{data.account.id}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#374151" }}>{t("about.livestats.sequence")}</div>
              <div className="font-mono text-sm text-white">{data.account.sequence}</div>
              <div className="text-xs mt-0.5" style={{ color: "#374151" }}>{t("about.livestats.subentries")}: {data.account.num_subentries}</div>
            </div>
          </div>
          {data.account.balances.length > 0 && (
            <>
              <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#374151" }}>{t("about.livestats.balances")}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.account.balances.map((b, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-xs font-mono" style={{ color: "#64748b" }}>{b.asset_code || "XLM"}</div>
                    <div className="text-sm font-black text-white font-mono">{parseFloat(b.balance).toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {data.transactions.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(74,222,128,0.12)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
              <Activity className="w-4 h-4" /> {t("about.livestats.live_txns")}
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </h3>
            <a href={`${EXPERT}/account/${ADDRS.treasury}`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 font-bold" style={{ color: "#374151" }}>
              {t("about.livestats.all_txns")} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.transactions.map(tx => (
              <a key={tx.id} href={`${EXPERT}/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div className="font-mono text-xs flex-1 truncate" style={{ color: "#7dd3fc" }}>{tx.hash.slice(0, 20)}...{tx.hash.slice(-8)}</div>
                <BarChart3 className="w-3 h-3 shrink-0" style={{ color: "#374151" }} />
                <div className="text-xs shrink-0" style={{ color: "#4b5563" }}>{tx.operation_count} {tx.operation_count !== 1 ? t("about.livestats.ops") : t("about.livestats.op")}</div>
                <div className="text-xs flex items-center gap-1 shrink-0" style={{ color: "#374151" }}><Clock className="w-3 h-3" />{(() => { const s = Math.floor((Date.now() - new Date(tx.created_at).getTime()) / 1000); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`; })()}</div>
                <ExternalLink className="w-3 h-3 shrink-0" style={{ color: "#374151" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {data.loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "#4ade80", borderTopColor: "transparent" }} />
          <p className="text-sm font-mono" style={{ color: "#374151" }}>{t("about.livestats.fetching")}</p>
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
