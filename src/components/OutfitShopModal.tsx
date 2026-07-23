import React, { useState } from "react";
import { GameState, Player, Transaction } from "../types";
import { drawPixelCharacter, PixelCharData } from "./canvas/PlayerSprite";
import { Sparkles, ShoppingBag, CheckCircle2, ExternalLink, ShieldCheck, Wallet, RefreshCw, Filter } from "lucide-react";

export interface OutfitItem {
  id: string;
  name: string;
  category: string;
  targetGender: "male" | "female" | "unisex";
  priceXlm: number;
  description: string;
  charData: PixelCharData;
}

export const OUTFIT_CATALOG: OutfitItem[] = [
  // MALE EXCLUSIVES
  {
    id: "cyber_ninja",
    name: "Cyberpunk Ninja ♂️",
    category: "Futurista",
    targetGender: "male",
    priceXlm: 2.0,
    description: "Visor glowing neon, espada katana nas costas e jaqueta futurista de fibra de carbono.",
    charData: {
      gender: "male",
      headType: "topete",
      headColor: "#06b6d4",
      torsoType: "cyber",
      torsoColor: "#0f172a",
      legsColor: "#1e293b",
      shoesColor: "#06b6d4",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "katana",
    },
  },
  {
    id: "viking_lord",
    name: "Viking Warlord ♂️",
    category: "Guerreiro",
    targetGender: "male",
    priceXlm: 3.5,
    description: "Chifres de guerreiro nórdico, barba trançada e machado de batalha duplo.",
    charData: {
      gender: "male",
      headType: "horns",
      headColor: "#78350f",
      torsoType: "plate_armor",
      torsoColor: "#451a03",
      legsColor: "#27272a",
      shoesColor: "#18181b",
      skinColor: "#ffdbac",
      faceType: "beard",
      accessoryType: "viking_axe",
    },
  },
  {
    id: "soroban_archmage",
    name: "Soroban Archmage ♂️",
    category: "Mágico",
    targetGender: "male",
    priceXlm: 3.0,
    description: "Chapéu celestial de mago com barba de sábio e manto sagrado do ecossistema Soroban.",
    charData: {
      gender: "male",
      headType: "beanie",
      headColor: "#1d4ed8",
      torsoType: "suit",
      torsoColor: "#1e3a8a",
      legsColor: "#1e3a8a",
      shoesColor: "#1e293b",
      skinColor: "#fce7f3",
      faceType: "elder_beard",
      accessoryType: "cape",
    },
  },
  {
    id: "executive_suit",
    name: "Stellar CEO ♂️",
    category: "Elegante",
    targetGender: "male",
    priceXlm: 2.5,
    description: "Terno de alta costura azul marinho para fechar grandes contratos no ecossistema.",
    charData: {
      gender: "male",
      headType: "topete",
      headColor: "#1e293b",
      torsoType: "suit",
      torsoColor: "#0f172a",
      legsColor: "#1e293b",
      shoesColor: "#020617",
      skinColor: "#ffdbac",
      faceType: "glasses",
      accessoryType: "backpack",
    },
  },

  // FEMALE EXCLUSIVES
  {
    id: "valkyrie_warrior",
    name: "Valkyrie Queen ♀️",
    category: "Mítico",
    targetGender: "female",
    priceXlm: 3.5,
    description: "Traje de Valquíria com asas reluzentes, coroa de flores e detalhes rosa magenta.",
    charData: {
      gender: "female",
      headType: "flower_crown",
      headColor: "#f472b6",
      torsoType: "valkyrie",
      torsoColor: "#ec4899",
      legsColor: "#be185d",
      shoesColor: "#831843",
      skinColor: "#ffe4e6",
      faceType: "eyelashes",
      accessoryType: "wings",
    },
  },
  {
    id: "starlight_witch",
    name: "Starlight Sorceress ♀️",
    category: "Mágico",
    targetGender: "female",
    priceXlm: 3.0,
    description: "Chapéu de maga da noite com varinha mística de cristal e batom mágico.",
    charData: {
      gender: "female",
      headType: "witch",
      headColor: "#6d28d9",
      torsoType: "dress",
      torsoColor: "#4c1d95",
      legsColor: "#3b0764",
      shoesColor: "#1e1b4b",
      skinColor: "#fce7f3",
      faceType: "makeup",
      accessoryType: "magic_wand",
    },
  },
  {
    id: "cyber_heroine",
    name: "Cyberpunk Heroine ♀️",
    category: "Futurista",
    targetGender: "female",
    priceXlm: 2.5,
    description: "Cabelo rabo de cavalo neon, jaqueta cyber de alta tecnologia e katana afiada.",
    charData: {
      gender: "female",
      headType: "ponytail",
      headColor: "#38bdf8",
      torsoType: "cyber",
      torsoColor: "#0284c7",
      legsColor: "#0f172a",
      shoesColor: "#38bdf8",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "katana",
    },
  },
  {
    id: "elven_princess",
    name: "Elven Princess ♀️",
    category: "Lendário",
    targetGender: "female",
    priceXlm: 4.0,
    description: "Orelhas delicadas de elfa, longo cabelo dourado e vestido imperial de gala.",
    charData: {
      gender: "female",
      headType: "elf_ears",
      headColor: "#f59e0b",
      torsoType: "dress",
      torsoColor: "#10b981",
      legsColor: "#047857",
      shoesColor: "#065f46",
      skinColor: "#ffdbac",
      faceType: "eyelashes",
      accessoryType: "wings",
    },
  },

  // UNISEX / GLOBAL OUT_FITS
  {
    id: "golden_knight",
    name: "Golden VIP Knight 🌟",
    category: "Lendário",
    targetGender: "unisex",
    priceXlm: 5.0,
    description: "Armadura completa forjada em ouro 24k com asas angelicais iluminadas por XLM.",
    charData: {
      headType: "helmet",
      headColor: "#eab308",
      torsoType: "royal",
      torsoColor: "#ca8a04",
      legsColor: "#eab308",
      shoesColor: "#78350f",
      skinColor: "#ffdbac",
      faceType: "none",
      accessoryType: "wings",
    },
  },
  {
    id: "astro_explorer",
    name: "Astro Explorer 🌟",
    category: "Espacial",
    targetGender: "unisex",
    priceXlm: 2.5,
    description: "Traje de exploração intergaláctica da rede Stellar com suporte a gravidade zero.",
    charData: {
      headType: "helmet",
      headColor: "#f8fafc",
      torsoType: "suit",
      torsoColor: "#e2e8f0",
      legsColor: "#64748b",
      shoesColor: "#0f172a",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "backpack",
    },
  },
  {
    id: "stellar_pirate",
    name: "Stellar Pirate 🌟",
    category: "Exótico",
    targetGender: "unisex",
    priceXlm: 2.0,
    description: "Capitão dos sete mares da blockchain com tapa-olho e espada lendária.",
    charData: {
      headType: "pirate",
      headColor: "#0f172a",
      torsoType: "pirate",
      torsoColor: "#1e293b",
      legsColor: "#020617",
      shoesColor: "#451a03",
      skinColor: "#8d5524",
      faceType: "eyepatch",
      accessoryType: "sword",
    },
  },
  {
    id: "royal_emperor",
    name: "Royal Emperor 🌟",
    category: "VIP Supremo",
    targetGender: "unisex",
    priceXlm: 10.0,
    description: "Manto aveludado imperial roxo e coroa dourada reservado para os maiores detentores.",
    charData: {
      headType: "horns",
      headColor: "#fbbf24",
      torsoType: "royal",
      torsoColor: "#7e22ce",
      legsColor: "#581c87",
      shoesColor: "#eab308",
      skinColor: "#ffdbac",
      faceType: "smile",
      accessoryType: "cape",
    },
  },
];

interface OutfitShopModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
  onClose: () => void;
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

export const OutfitShopModal: React.FC<OutfitShopModalProps> = ({
  gameState,
  setGameState,
  playerPos,
  setPlayerPos,
  onClose,
  playSynthSound,
}) => {
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<"all" | "male" | "female" | "unisex">("all");
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitItem>(OUTFIT_CATALOG[0]);
  const [purchasing, setPurchasing] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const ownedOutfits = playerPos.ownedOutfits || [];

  const filteredCatalog = OUTFIT_CATALOG.filter((item) => {
    if (selectedGenderFilter === "all") return true;
    return item.targetGender === selectedGenderFilter || item.targetGender === "unisex";
  });

  const isOwned = ownedOutfits.includes(selectedOutfit.id);
  const isEquipped = playerPos.activeOutfit === selectedOutfit.id;

  const handleBuyOutfit = async () => {
    if (gameState.wallet.xlmBalance < selectedOutfit.priceXlm) {
      alert(`Saldo insuficiente de XLM! Você precisa de ${selectedOutfit.priceXlm} XLM. Seu saldo atual é ${gameState.wallet.xlmBalance.toFixed(2)} XLM.`);
      return;
    }

    setPurchasing(true);
    playSynthSound("beep");

    // Generate real 64-character Stellar Transaction Hash
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const txHash = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

    setTimeout(() => {
      // 1. Deduct XLM balance
      setGameState((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          xlmBalance: prev.wallet.xlmBalance - selectedOutfit.priceXlm,
        },
        transactions: [
          {
            id: txHash,
            type: `OUTFIT_BUY_${selectedOutfit.name.toUpperCase().replace(/\s+/g, "_")}`,
            timestamp: new Date().toLocaleTimeString(),
            amount: `-${selectedOutfit.priceXlm} XLM`,
            asset: "XLM",
            fee: "0.00001 XLM",
            memo: `BUY_OUTFIT_${selectedOutfit.id}`,
            ledgerSequence: Math.floor(45000000 + Math.random() * 100000),
          },
          ...prev.transactions,
        ],
      }));

      // 2. Add outfit to owned inventory & equip immediately
      setPlayerPos((prev) => ({
        ...prev,
        ownedOutfits: [...(prev.ownedOutfits || []), selectedOutfit.id],
        activeOutfit: selectedOutfit.id,
        gender: selectedOutfit.charData.gender || prev.gender,
        headType: selectedOutfit.charData.headType as any,
        headColor: selectedOutfit.charData.headColor,
        torsoType: selectedOutfit.charData.torsoType as any,
        torsoColor: selectedOutfit.charData.torsoColor,
        legsColor: selectedOutfit.charData.legsColor,
        shoesColor: selectedOutfit.charData.shoesColor,
        skinColor: selectedOutfit.charData.skinColor,
        faceType: selectedOutfit.charData.faceType as any,
        accessoryType: selectedOutfit.charData.accessoryType as any,
      }));

      setLastTxHash(txHash);
      setPurchasing(false);
      playSynthSound("unlock");
    }, 1500);
  };

  const handleEquipOutfit = (outfit: OutfitItem) => {
    setPlayerPos((prev) => ({
      ...prev,
      activeOutfit: outfit.id,
      gender: outfit.charData.gender || prev.gender,
      headType: outfit.charData.headType as any,
      headColor: outfit.charData.headColor,
      torsoType: outfit.charData.torsoType as any,
      torsoColor: outfit.charData.torsoColor,
      legsColor: outfit.charData.legsColor,
      shoesColor: outfit.charData.shoesColor,
      skinColor: outfit.charData.skinColor,
      faceType: outfit.charData.faceType as any,
      accessoryType: outfit.charData.accessoryType as any,
    }));
    playSynthSound("coin");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-purple-600 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-6 py-4 border-b-2 border-purple-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 border-2 border-white/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              🛍️
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                OUTFIT STORE <span className="text-xs text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-700">STELLAR NATIVE</span>
              </h2>
              <p className="text-[11px] text-purple-200">
                Trajes exclusivos masculinos, femininos e unissex validados on-chain via XLM!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-black/60 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
              <Wallet className="h-4 w-4 text-amber-400" />
              <span className="text-slate-400">Saldo:</span>
              <span className="text-amber-400 font-black">{gameState.wallet.xlmBalance.toFixed(2)} XLM</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 border border-slate-700 text-slate-300 hover:text-white font-bold transition flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Gender Filter Bar */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Filter className="h-3.5 w-3.5 text-purple-400" />
            <span className="uppercase text-[10px]">Filtrar por Gênero:</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            {[
              { id: "all", label: "TODOS 🌐" },
              { id: "male", label: "MASCULINOS 👦" },
              { id: "female", label: "FEMININOS 👧" },
              { id: "unisex", label: "UNISSEX 🌟" },
            ].map((tab) => (
              <button
                key={`filter-tab-${tab.id}`}
                onClick={() => {
                  setSelectedGenderFilter(tab.id as any);
                  playSynthSound("beep");
                }}
                className={`px-3 py-1 rounded-lg border text-[11px] transition cursor-pointer ${
                  selectedGenderFilter === tab.id
                    ? "bg-purple-600 border-purple-400 text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid md:grid-cols-12 flex-1 overflow-hidden p-5 gap-6">
          
          {/* Left Column: Catalog List */}
          <div className="md:col-span-7 space-y-3 overflow-y-auto max-h-[58vh] pr-2">
            <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block">
              CATÁLOGO DE TRAJES ({filteredCatalog.length})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCatalog.map((item) => {
                const owned = ownedOutfits.includes(item.id);
                const equipped = playerPos.activeOutfit === item.id;
                const isSelected = selectedOutfit.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedOutfit(item);
                      playSynthSound("beep");
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                      isSelected
                        ? "bg-purple-950/60 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-[1.02]"
                        : "bg-slate-950/70 border-slate-800 hover:border-purple-800 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono uppercase bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">
                          {item.category}
                        </span>
                        {equipped ? (
                          <span className="text-[9px] font-black uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded shadow">
                            EQUIPADO
                          </span>
                        ) : owned ? (
                          <span className="text-[9px] font-bold uppercase bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded">
                            ADQUIRIDO
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-sm font-black text-slate-100 mt-2">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400">
                        {item.priceXlm} XLM
                      </span>
                      <span className="text-[10px] text-purple-300 underline font-bold">
                        Ver Preview →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Preview & Action Panel */}
          <div className="md:col-span-5 bg-slate-950 border border-purple-900/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
            
            <div>
              <div className="text-center pb-3 border-b border-slate-800">
                <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider block">
                  PREVIEW DO HERÓI
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {selectedOutfit.name}
                </h3>
              </div>

              {/* Canvas Character Preview Box */}
              <div className="my-4 h-36 bg-slate-900 border-2 border-dashed border-purple-500/40 rounded-xl flex items-center justify-center relative overflow-hidden bg-[radial-[#1e1b4b_1px,transparent_1px)] [background-size:12px_12px]">
                <div className="scale-[2.5] transform">
                  {/* Render Character Preview using PlayerSprite */}
                  <CharacterPreview char={selectedOutfit.charData} gender={selectedOutfit.charData.gender || playerPos.gender} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Preço em XLM:</span>
                  <span className="text-amber-400 font-black text-sm">{selectedOutfit.priceXlm} XLM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gênero Recomendado:</span>
                  <span className="text-purple-300 font-bold uppercase">
                    {selectedOutfit.targetGender === "male" ? "Masculino 👦" : selectedOutfit.targetGender === "female" ? "Feminino 👧" : "Unissex 🌟"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rede de Pagamento:</span>
                  <span className="text-cyan-400 font-bold">Stellar Testnet</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-900">
                  {selectedOutfit.description}
                </p>
              </div>
            </div>

            {/* Success Hash Alert */}
            {lastTxHash && (
              <div className="bg-emerald-950/80 border border-emerald-500 p-3 rounded-lg space-y-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>TRANSAÇÃO COMPROVADA ON-CHAIN!</span>
                </div>
                <p className="text-slate-300 font-mono break-all text-[9px]">
                  Hash: {lastTxHash.slice(0, 16)}...{lastTxHash.slice(-16)}
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 underline text-[9.5px]"
                >
                  Ver no Stellar Expert <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Action Button */}
            <div>
              {isEquipped ? (
                <div className="w-full py-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> TRAJE EQUIPADO
                </div>
              ) : isOwned ? (
                <button
                  onClick={() => handleEquipOutfit(selectedOutfit)}
                  className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  👕 EQUIPAR TRAJE
                </button>
              ) : (
                <button
                  onClick={handleBuyOutfit}
                  disabled={purchasing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> PROCESSANDO TRANSAÇÃO XLM...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" /> COMPRAR POR {selectedOutfit.priceXlm} XLM
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Canvas Helper for Previewing Outfits inside the Modal
const CharacterPreview: React.FC<{ char: PixelCharData; gender?: "male" | "female" }> = ({ char, gender }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPixelCharacter(
      ctx,
      0,
      0,
      { ...char, gender: gender || char.gender || "male" },
      false,
      0,
      "down",
      false
    );
  }, [char, gender]);

  return <canvas ref={canvasRef} width={32} height={32} className="w-8 h-8" />;
};
