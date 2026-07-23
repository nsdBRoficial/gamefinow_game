/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState, Player, Quest } from "../types";
import { 
  Sparkles, 
  Palette, 
  Shield, 
  Shirt, 
  Footprints, 
  Smile, 
  Wand, 
  Eye, 
  Coins, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Edit3
} from "lucide-react";
import { executeOutfitPurchaseOnChain } from "../services/stellarServices";

interface CharacterCustomizerProps {
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
  gameState?: GameState;
}

const PRESET_COLORS = [
  { name: "Amarelo", value: "#fcd34d" },
  { name: "Ciano", value: "#38bdf8" },
  { name: "Verde", value: "#10b981" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Laranja", value: "#f97316" },
  { name: "Grafite", value: "#1e293b" },
  { name: "Branco", value: "#f8fafc" },
];

const SKIN_COLORS = [
  { name: "Pele Clara", value: "#ffdbac" },
  { name: "Pele Média", value: "#f1c27d" },
  { name: "Pele Bronzeada", value: "#e0ac69" },
  { name: "Pele Escura", value: "#8d5524" },
  { name: "Dourado", value: "#eab308" },
  { name: "Orc Verde", value: "#22c55e" },
  { name: "Alien Azul", value: "#06b6d4" },
];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  playerPos,
  setPlayerPos,
  gameState,
}) => {
  const completedCount = gameState?.quests
    ? (Object.values(gameState.quests) as Quest[]).filter((q) => q.status === "completed").length
    : 0;

  const [tempName, setTempName] = useState(playerPos.name || "Hero");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameStatus, setRenameStatus] = useState<{
    type: "success" | "error";
    text: string;
    txHash?: string;
  } | null>(null);

  const updateCustomization = (key: keyof Player, value: any) => {
    setPlayerPos((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRenameOnChain = async () => {
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === playerPos.name) return;

    const pubKey = gameState?.wallet?.publicKey || playerPos.walletAddress || "";
    const secKey = gameState?.wallet?.secretKey || "";

    if (!pubKey) {
      setRenameStatus({
        type: "error",
        text: "Conecte sua carteira Stellar para realizar a renomeação on-chain.",
      });
      return;
    }

    setIsRenaming(true);
    setRenameStatus(null);

    try {
      const res = await executeOutfitPurchaseOnChain(pubKey, secKey, 5, `rename_${trimmed.slice(0, 10)}`);
      if (res.success) {
        updateCustomization("name", trimmed);
        setRenameStatus({
          type: "success",
          text: `✨ Nome alterado para "${trimmed}" com sucesso no ledger da Stellar!`,
          txHash: res.txHash,
        });
      } else {
        setRenameStatus({
          type: "error",
          text: res.error || "Falha ao processar o pagamento de 5 XLM.",
        });
      }
    } catch (err: any) {
      setRenameStatus({
        type: "error",
        text: err?.message || "Erro na conexão Stellar.",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <Palette className="h-4.5 w-4.5 text-cyan-400" />
        <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase">
          Customização do Personagem (Estilo Retrô)
        </h3>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Monte o estilo do seu herói quadrado! Escolha a cabeça, olhos, tronco, pernas e sapatos. As alterações aparecem no mapa na hora.
      </p>

      {/* Sexo / Gênero do Personagem */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-black text-pink-400 block uppercase font-mono tracking-wider">
          👥 Gênero / Sexo do Personagem
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold font-mono">
          <button
            onClick={() => updateCustomization("gender", "male")}
            className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition ${
              (playerPos.gender || "male") === "male"
                ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-black"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
            }`}
          >
            <span className="text-base">👦</span> Masculino (Quadrado)
          </button>
          <button
            onClick={() => updateCustomization("gender", "female")}
            className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition ${
              playerPos.gender === "female"
                ? "bg-pink-950/60 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)] font-black"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
            }`}
          >
            <span className="text-base">👧</span> Feminino (Ampulheta Suave)
          </button>
        </div>
      </div>

      {/* Nome do Personagem + Renomear por 5 XLM */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-cyan-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Edit3 className="h-3.5 w-3.5" /> Nome do Seu Personagem
          </label>
          <span className="text-[9px] text-amber-400 font-mono font-extrabold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
            💎 5 XLM p/ Renomear
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value.slice(0, 15))}
            placeholder="Digite o novo nome..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
          />
          {tempName.trim() !== playerPos.name && tempName.trim().length > 0 && (
            <button
              disabled={isRenaming}
              onClick={handleRenameOnChain}
              className="bg-amber-600 hover:bg-amber-500 active:translate-y-0.5 disabled:opacity-50 text-white border border-amber-400 rounded px-3 py-1.5 text-xs font-mono font-black transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando 5 XLM...</span>
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" />
                  <span>Pagar 5 XLM</span>
                </>
              )}
            </button>
          )}
        </div>

        {renameStatus && (
          <div
            className={`p-2 rounded border text-[10px] font-mono flex flex-col gap-1 ${
              renameStatus.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-300"
                : "bg-red-950/80 border-red-500/80 text-red-300"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {renameStatus.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              )}
              <span>{renameStatus.text}</span>
            </div>
            {renameStatus.txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${renameStatus.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>Ver Transação no Stellar Expert</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}

        <p className="text-[9px] text-slate-500 font-mono">
          Nome atual registrado: <b className="text-slate-300">{playerPos.name || "Nenhum"}</b>. Alterar o nome custa 5 XLM enviados diretamente para a tesouraria da GAMEFI.
        </p>
      </div>

      {/* Cor da Pele */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
          <Smile className="h-3.5 w-3.5" /> Tom de Pele
        </label>
        <div className="flex flex-wrap gap-2">
          {SKIN_COLORS.map((skin) => (
            <button
              key={skin.value}
              onClick={() => updateCustomization("skinColor", skin.value)}
              className={`w-6 h-6 rounded-full cursor-pointer transition border-2 ${
                playerPos.skinColor === skin.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: skin.value }}
              title={skin.name}
            />
          ))}
        </div>
      </div>

      {/* Customização de Cabelo / Cabeça */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase font-mono">
          <Wand className="h-3.5 w-3.5" /> Cabelo / Cabeça
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
          {[
            { id: "default", name: "Curto Padrão" },
            { id: "mohawk", name: "Mohawk Cyber" },
            { id: "cap", name: "Boné Gamer" },
            { id: "long", name: "Longo Retrô" },
            { id: "afro", name: "Afro Power" },
            { id: "helmet", name: "Capacete Space" },
            { id: "crown", name: "Coroa VIP" },
            { id: "bald", name: "Careca" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => updateCustomization("headStyle", style.id)}
              className={`p-1.5 rounded border text-[10px] text-center transition cursor-pointer ${
                (playerPos.headStyle || "default") === style.id
                  ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <span className="text-[9px] text-slate-400 block mb-1 font-mono">Cor do Cabelo:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={`head-${color.value}`}
                onClick={() => updateCustomization("headColor", color.value)}
                className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                  playerPos.headColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Customização de Olhos */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
          <Eye className="h-3.5 w-3.5" /> Estilo dos Olhos
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
          {[
            { id: "dots", name: "Pontos Padrão" },
            { id: "sunglasses", name: "Óculos Escuros" },
            { id: "vr_headset", name: "Headset VR" },
            { id: "visor", name: "Visor Neon" },
            { id: "cyborg", name: "Olho Cyborg" },
            { id: "anime", name: "Olhos Grandes" },
            { id: "wink", name: "Piscadela" },
            { id: "classic", name: "Retrô 8-bit" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => updateCustomization("eyeStyle", style.id)}
              className={`p-1.5 rounded border text-[10px] text-center transition cursor-pointer ${
                (playerPos.eyeStyle || "dots") === style.id
                  ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <span className="text-[9px] text-slate-400 block mb-1 font-mono">Cor dos Olhos:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={`eye-${color.value}`}
                onClick={() => updateCustomization("eyeColor", color.value)}
                className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                  playerPos.eyeColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tronco / Roupas */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase font-mono">
          <Shirt className="h-3.5 w-3.5" /> Roupa / Tronco
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
          {[
            { id: "tshirt", name: "Camiseta Basic" },
            { id: "suit", name: "Terno Cryptogamer" },
            { id: "hoodie", name: "Moletom Dev" },
            { id: "jacket", name: "Jaqueta de Couro" },
            { id: "cyber", name: "Armadura Cyber" },
            { id: "robe", name: "Manto Soroban" },
            { id: "royal", name: "Capa Imperial" },
            { id: "dress", name: "Vestido Nobre" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => updateCustomization("torsoStyle", style.id)}
              className={`p-1.5 rounded border text-[10px] text-center transition cursor-pointer ${
                (playerPos.torsoStyle || "tshirt") === style.id
                  ? "bg-indigo-950 border-indigo-500 text-indigo-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <span className="text-[9px] text-slate-400 block mb-1 font-mono">Cor da Roupa:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={`torso-${color.value}`}
                onClick={() => updateCustomization("torsoColor", color.value)}
                className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                  playerPos.torsoColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pernas & Sapatos */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
          <Footprints className="h-3.5 w-3.5" /> Pernas & Sapatos
        </label>
        <div>
          <span className="text-[9px] text-slate-400 block mb-1 font-mono">Cor das Calças / Pernas:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={`legs-${color.value}`}
                onClick={() => updateCustomization("legsColor", color.value)}
                className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                  playerPos.legsColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[9px] text-slate-400 block mb-1 font-mono">Cor dos Sapatos / Calçados:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={`shoes-${color.value}`}
                onClick={() => updateCustomization("shoesColor", color.value)}
                className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                  playerPos.shoesColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: Titles & Name Color Style */}
      <div className="bg-slate-900/60 p-3 rounded-lg border border-amber-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>COR E ESTILO DO NOME 🎨</span>
          </div>
          {completedCount < 4 && (
            <span className="text-[9px] bg-amber-950/80 border border-amber-800/60 text-amber-300 px-2 py-0.5 rounded font-mono">
              🔒 Liberado ao concluir 4 missões ({completedCount}/4)
            </span>
          )}
        </div>

        {completedCount < 4 ? (
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 space-y-1 font-mono">
            <p className="text-amber-400 font-bold">ℹ️ Progresso Automático de Cor:</p>
            <p className="text-slate-400">
              A cor do seu nome no mapa muda automaticamente a cada missão concluída (Branco ➔ Amarelo ➔ Dourado ➔ Roxo ➔ Verde Matrix). Após concluir as 4 missões, você poderá escolher livremente qualquer cor!
            </p>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-2 rounded-lg text-[10px] text-emerald-300 font-mono">
            ✨ <b>Parabéns!</b> Você concluiu todas as 4 missões. Escolha a cor que desejar para exibir no seu nome no mapa:
          </div>
        )}

        {/* Active Title Color Picker (Only the 3 unlocked special colors) */}
        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 uppercase font-mono">Cores & Estilos Desbloqueados</span>
          <div className="grid grid-cols-1 gap-1.5 font-mono">
            {[
              { id: "operador_onramp", title: "Operador On-Ramp", icon: "💳", badge: "Dourado Nobre", colorClass: "text-amber-400 border-amber-500 bg-amber-950/80" },
              { id: "alquimista_soroban", title: "Alquimista do Soroban", icon: "🧪", badge: "Roxo Místico", colorClass: "text-purple-400 border-purple-500 bg-purple-950/80" },
              { id: "heroi_stellar", title: "Herói Lendário de Stellar", icon: "👑", badge: "Verde Matrix Elétrico", colorClass: "text-[#00ff66] border-[#00ff66] bg-emerald-950/80" },
            ].map((t) => {
              const isSelected = (playerPos.activeTitle || "Herói Lendário de Stellar") === t.title;
              const canSelect = completedCount >= 4;

              return (
                <button
                  key={`title-btn-${t.id}`}
                  disabled={!canSelect}
                  onClick={() => canSelect && updateCustomization("activeTitle", t.title)}
                  className={`p-2 rounded-lg border text-left text-xs transition flex items-center justify-between ${
                    canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                  } ${
                    isSelected
                      ? `${t.colorClass} font-black shadow-[0_0_12px_rgba(255,255,255,0.2)] ring-1 ring-white/50 scale-[1.01]`
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.icon}</span>
                    <span className="font-bold">{t.title}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-extrabold ${t.colorClass}`}>
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-2 flex items-center justify-center gap-1">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span>Seu visual de herói e título estão salvos e ativos no mapa e passaporte!</span>
      </div>
    </div>
  );
};
