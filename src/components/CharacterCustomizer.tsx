/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Player } from "../types";
import { Sparkles, Palette, Shield, Shirt, Footprints, Smile, Wand, Eye } from "lucide-react";

interface CharacterCustomizerProps {
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
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
}) => {
  const updateCustomization = (key: keyof Player, value: any) => {
    setPlayerPos((prev) => ({
      ...prev,
      [key]: value,
    }));
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
            <span className="text-base">👦</span> Masculino
          </button>
          <button
            onClick={() => updateCustomization("gender", "female")}
            className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition ${
              playerPos.gender === "female"
                ? "bg-pink-950/60 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)] font-black"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
            }`}
          >
            <span className="text-base">👧</span> Feminino
          </button>
        </div>
      </div>

      {/* Nome do Personagem */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[10px] font-black text-cyan-400 block uppercase font-mono tracking-wider">
          ✍️ Nome do Seu Personagem
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={playerPos.name}
            onChange={(e) => updateCustomization("name", e.target.value.slice(0, 15))}
            placeholder="Digite o nome..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
          />
          <button
            onClick={() => {
              const names = ["Astro", "Stellar", "Giga", "StellarLover", "FrankJr", "NodeRunner", "Lendario", "Sol", "Lua", "Gamer"];
              const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99);
              updateCustomization("name", randomName);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            Sorteador 🎲
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. PELE E CABEÇA */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Smile className="h-3.5 w-3.5 text-yellow-400" />
            <span>Pele & Cabeça</span>
          </div>

          {/* Skin Color */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor da Pele (Rosto)</span>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_COLORS.map((color) => (
                <button
                  key={`skin-color-${color.value}`}
                  onClick={() => updateCustomization("skinColor", color.value)}
                  className={`w-5 h-5 rounded cursor-pointer transition border-2 ${
                    playerPos.skinColor === color.value ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Hair/Helmet Color */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor do Cabelo / Chapéu</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={`head-color-${color.value}`}
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

          {/* Head Style Type (Gender Specific) */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">
              Tipo de Cabelo / Chapéu ({playerPos.gender === "female" ? "Feminino 👧" : "Masculino 👦"})
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(playerPos.gender === "female"
                ? [
                    { id: "long_hair", name: "Longo Cascata 👱‍♀️" },
                    { id: "ponytail", name: "Rabo de Cavalo 👧" },
                    { id: "ribbon", name: "Laço & Tiara 🎀" },
                    { id: "bob", name: "Corte Bob/Chanel 💇‍♀️" },
                    { id: "witch", name: "Chapéu de Maga 🔮" },
                    { id: "flower_crown", name: "Coroa de Flores 🌸" },
                    { id: "elf_ears", name: "Orelhas de Elfa 🧝‍♀️" },
                    { id: "helmet", name: "Capacete 🪖" },
                  ]
                : [
                    { id: "topete", name: "Topete Pompadour 💇‍♂️" },
                    { id: "square", name: "Curto Padrão 🔲" },
                    { id: "militar", name: "Militar / Raspado 🪖" },
                    { id: "beanie", name: "Gorro Street 🏮" },
                    { id: "pirate", name: "Pirata Bandana 🏴‍☠️" },
                    { id: "helmet", name: "Capacete Cavaleiro 🛡️" },
                    { id: "horns", name: "Chifres Viking 😈" },
                  ]
              ).map((style) => (
                <button
                  key={`head-type-${style.id}`}
                  onClick={() => updateCustomization("headType", style.id)}
                  className={`py-1 px-1.5 rounded text-left border cursor-pointer transition-all ${
                    playerPos.headType === style.id
                      ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. ROSTO E ACESSÓRIOS */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Eye className="h-3.5 w-3.5 text-pink-400" />
            <span>Rosto & Traços ({playerPos.gender === "female" ? "Femininos" : "Masculinos"})</span>
          </div>

          {/* Face style (Gender Specific) */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Estilo Facial</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(playerPos.gender === "female"
                ? [
                    { id: "eyelashes", name: "Cílios & Blush ✨" },
                    { id: "makeup", name: "Batom / Make 💄" },
                    { id: "smile", name: "Sorriso 🌸" },
                    { id: "glasses", name: "Óculos Elegante 👓" },
                    { id: "visor", name: "Visor Cyber 🥽" },
                    { id: "none", name: "Neutro 😶" },
                  ]
                : [
                    { id: "beard", name: "Barba Curta 🧔" },
                    { id: "elder_beard", name: "Barba Longa Mago 🧙‍♂️" },
                    { id: "mustache", name: "Bigode Pirata 🥸" },
                    { id: "eyepatch", name: "Tapa-Olho 🏴‍☠️" },
                    { id: "glasses", name: "Óculos 👓" },
                    { id: "visor", name: "Visor Cyber 🥽" },
                    { id: "none", name: "Neutro 😶" },
                  ]
              ).map((face) => (
                <button
                  key={`face-type-${face.id}`}
                  onClick={() => updateCustomization("faceType", face.id)}
                  className={`py-1 px-1.5 rounded text-left border cursor-pointer transition-all ${
                    playerPos.faceType === face.id
                      ? "bg-pink-950/40 border-pink-500 text-pink-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  {face.name}
                </button>
              ))}
            </div>
          </div>

          {/* Back Accessories (Gender Specific) */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Acessório Costas / Mão</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(playerPos.gender === "female"
                ? [
                    { id: "wings", name: "Asas de Valquíria 🪽" },
                    { id: "magic_wand", name: "Varinha Mágica 🪄" },
                    { id: "backpack", name: "Mochila Fofa 🎒" },
                    { id: "cape", name: "Capa Mística 🧥" },
                    { id: "katana", name: "Katana Cyber ⚔️" },
                    { id: "none", name: "Nenhum 📭" },
                  ]
                : [
                    { id: "sword", name: "Espada de Aço ⚔️" },
                    { id: "viking_axe", name: "Katana / Machado 🪓" },
                    { id: "backpack", name: "Mochila Explorer 🎒" },
                    { id: "cape", name: "Capa RPG 🧥" },
                    { id: "wings", name: "Asas 🪽" },
                    { id: "none", name: "Nenhum 📭" },
                  ]
              ).map((acc) => (
                <button
                  key={`acc-type-${acc.id}`}
                  onClick={() => updateCustomization("accessoryType", acc.id)}
                  className={`py-1 px-1.5 rounded text-left border cursor-pointer transition-all ${
                    playerPos.accessoryType === acc.id
                      ? "bg-violet-950/40 border-violet-500 text-violet-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. TRONCO / ROUPA */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Shirt className="h-3.5 w-3.5 text-red-400" />
            <span>Roupa / Vestuário ({playerPos.gender === "female" ? "Feminino" : "Masculino"})</span>
          </div>

          {/* Color Selection */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor da Roupa</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={`torso-color-${color.value}`}
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

          {/* Type Selection */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Estilo da Roupa</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(playerPos.gender === "female"
                ? [
                    { id: "dress", name: "Vestido de Gala 👗" },
                    { id: "valkyrie", name: "Traje de Valquíria 🛡️" },
                    { id: "cyber", name: "Jaqueta Cyber 🧥" },
                    { id: "hoodie", name: "Moletom 👚" },
                    { id: "plain", name: "Blusa Simples 👕" },
                  ]
                : [
                    { id: "suit", name: "Terno Executive 👔" },
                    { id: "samurai", name: "Kimono Samurai 🥋" },
                    { id: "plate_armor", name: "Armadura Placa 🛡️" },
                    { id: "hoodie", name: "Moletom Hoodie 🧥" },
                    { id: "plain", name: "Camisa Simples 👕" },
                  ]
              ).map((style) => (
                <button
                  key={`torso-type-${style.id}`}
                  onClick={() => updateCustomization("torsoType", style.id)}
                  className={`py-1 px-1.5 rounded text-left border cursor-pointer transition-all ${
                    playerPos.torsoType === style.id
                      ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. PERNAS E SAPATOS */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span>Pernas & Sapatos</span>
          </div>

          {/* Legs color selection */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor da Calça</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={`legs-color-${color.value}`}
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

          {/* Shoes color selection */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor dos Sapatos</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={`shoes-color-${color.value}`}
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

        {/* SECTION 5: Titles & Name Style */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-amber-900/40 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>ESTILO DE NOME DA MISSÃO 🏷️</span>
          </div>

          {/* Active Title Picker */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-mono">Escolha o Estilo / Título Desbloqueado</span>
            <div className="grid grid-cols-1 gap-1.5 font-mono">
              {[
                { id: "naufrago", title: "Náufrago Recém-Chegado", icon: "🌊", badge: "Cinza Slate", colorClass: "text-slate-300 border-slate-700 bg-slate-900/80" },
                { id: "iniciado_stellar", title: "Iniciado de Stellar", icon: "📜", badge: "Ciano Reluzente", colorClass: "text-cyan-400 border-cyan-500 bg-cyan-950/80" },
                { id: "operador_onramp", title: "Operador On-Ramp", icon: "💳", badge: "Dourado Nobre", colorClass: "text-amber-400 border-amber-500 bg-amber-950/80" },
                { id: "alquimista_soroban", title: "Alquimista do Soroban", icon: "🧪", badge: "Roxo Místico", colorClass: "text-purple-400 border-purple-500 bg-purple-950/80" },
                { id: "heroi_stellar", title: "Herói Lendário de Stellar", icon: "👑", badge: "Verde Neon Supremo", colorClass: "text-emerald-400 border-emerald-500 bg-emerald-950/80" },
              ].map((t) => {
                const isSelected = (playerPos.activeTitle || "Náufrago Recém-Chegado") === t.title;
                return (
                  <button
                    key={`title-btn-${t.id}`}
                    onClick={() => updateCustomization("activeTitle", t.title)}
                    className={`p-2 rounded-lg border text-left text-xs transition flex items-center justify-between cursor-pointer ${
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

          {/* Name Formatting Style Picker */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-mono">Estilo de Nome no Mapa</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-mono">
              {[
                { id: "badge", label: "Emblema 👑", example: `👑 ${playerPos.name || "Hero"} | ${playerPos.activeTitle || "Iniciado"}` },
                { id: "prefix", label: "Prefixo []", example: `[${playerPos.activeTitle || "Iniciado"}] ${playerPos.name || "Hero"}` },
                { id: "suffix", label: "Sufixo , o", example: `${playerPos.name || "Hero"}, o ${playerPos.activeTitle || "Iniciado"}` },
                { id: "plain", label: "Apenas Nome", example: playerPos.name || "Hero" },
              ].map((style) => (
                <button
                  key={`style-btn-${style.id}`}
                  onClick={() => updateCustomization("nameStyle", style.id)}
                  className={`p-1.5 rounded border text-center transition cursor-pointer ${
                    (playerPos.nameStyle || "badge") === style.id
                      ? "bg-purple-950 border-purple-500 text-purple-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                  title={style.example}
                >
                  <div className="font-bold">{style.label}</div>
                  <div className="text-[8px] text-slate-500 truncate mt-0.5">{style.example}</div>
                </button>
              ))}
            </div>
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
