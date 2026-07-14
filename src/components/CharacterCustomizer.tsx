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
          Customização Pixel Art (Tibia Style)
        </h3>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Monte o estilo do seu herói pixelado quadrado! Escolha a cabeça, olhos, tronco, pernas e sapatos. As alterações aparecem no mapa na hora.
      </p>

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
              const names = ["Astro", "Stellar", "Giga", "TibiaLover", "FrankJr", "NodeRunner", "Lendario", "Sol", "Lua", "Gamer"];
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
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor do Chapéu / Detalhe</span>
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

          {/* Head Style Type */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Tipo de Cabeça</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { id: "square", name: "Quadrado 🔲" },
                { id: "beanie", name: "Gorro 🏮" },
                { id: "helmet", name: "Capacete 🪖" },
                { id: "horns", name: "Chifres 😈" },
              ].map((style) => (
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
            <span>Rosto & Acessórios</span>
          </div>

          {/* Face style (Glasses, Eyepatch, Beard, Smile) */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Estilo Facial</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { id: "smile", name: "Sorriso 🙂" },
                { id: "glasses", name: "Óculos 👓" },
                { id: "beard", name: "Barba 🧔" },
                { id: "eyepatch", name: "Tapa-Olho 🏴‍☠️" },
                { id: "none", name: "Neutro 😶" },
              ].map((face) => (
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

          {/* Back Accessories */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Acessório Costas / Mão</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { id: "backpack", name: "Mochila 🎒" },
                { id: "cape", name: "Capa RPG 🧥" },
                { id: "sword", name: "Espada ⚔️" },
                { id: "none", name: "Nenhum 📭" },
              ].map((acc) => (
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
            <span>Roupa / Tronco</span>
          </div>

          {/* Color Selection */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Cor da Camisa</span>
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
              {[
                { id: "plain", name: "Liso 👕" },
                { id: "striped", name: "Listrado 🦓" },
                { id: "suit", name: "Terno 👔" },
                { id: "hoodie", name: "Moletom 🧥" },
              ].map((style) => (
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
      </div>

      <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-2 flex items-center justify-center gap-1">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span>Seu visual Tibia Pixel Art está salvo e ativo! Use WASD ou Teclas de Direção para explorar o mapa 60x60.</span>
      </div>
    </div>
  );
};
