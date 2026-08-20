/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Shield, Users, Crown, Sparkles, PlusCircle, ArrowRight, X, Coins } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { Guild, GUILD_CREATION_COST_GAMEFI, loadAllGuilds, createGuild, joinGuild } from "../guildsData";

interface GuildModalProps {
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
  onTeleportToGuildhouse?: () => void;
}

export const GuildModal: React.FC<GuildModalProps> = ({
  playSynthSound,
  onTeleportToGuildhouse,
}) => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const playerPos = useGameStore((s) => s.playerPos);
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);
  const wallet = useGameStore((s) => s.wallet);
  const updateWallet = useGameStore((s) => s.updateWallet);

  const [tab, setTab] = useState<"my_guild" | "explore" | "create">("my_guild");
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State para Criação
  const [guildName, setGuildName] = useState("");
  const [guildTag, setGuildTag] = useState("");
  const [guildDesc, setGuildDesc] = useState("");
  const [guildIcon, setGuildIcon] = useState("🛡️");
  const [guildColor, setGuildColor] = useState("#3b82f6");

  useEffect(() => {
    if (activeModal === "guild") {
      const loaded = loadAllGuilds();
      setGuilds(loaded);
      const userHasGuild = !!playerPos.guildId || loaded.some((g) => g.members.some((m) => m.playerId === (playerPos.name || "player")));
      if (!userHasGuild) {
        setTab("explore");
      } else {
        setTab("my_guild");
      }
    }
  }, [activeModal, playerPos.guildId, playerPos.name]);

  if (activeModal !== "guild") return null;

  const currentGuild = guilds.find((g) => g.id === playerPos.guildId || g.members.some((m) => m.playerId === (playerPos.name || "player")));
  const gamefiBalance = wallet.gamefiBalance || 0;

  const handleCreateGuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName.trim() || !guildTag.trim()) {
      setFeedbackMsg({ text: "Preencha o nome e a tag da guilda!", type: "error" });
      playSynthSound("beep");
      return;
    }

    if (gamefiBalance < GUILD_CREATION_COST_GAMEFI) {
      setFeedbackMsg({ text: `Saldo insuficiente! Fundar uma guilda custa ${GUILD_CREATION_COST_GAMEFI} GAMEFI.`, type: "error" });
      playSynthSound("beep");
      return;
    }

    const cleanTag = guildTag.replace(/[\[\]]/g, "").toUpperCase();
    if (cleanTag.length < 2 || cleanTag.length > 5) {
      setFeedbackMsg({ text: "A tag deve ter entre 2 e 5 caracteres (ex: STAR, XLM).", type: "error" });
      playSynthSound("beep");
      return;
    }

    // Debita o custo
    updateWallet({ gamefiBalance: gamefiBalance - GUILD_CREATION_COST_GAMEFI });

    const newGuild = createGuild(
      guildName.trim(),
      cleanTag,
      guildDesc.trim() || "Guilda de heróis da Ilha Central.",
      guildIcon,
      guildColor,
      playerPos.name || "player",
      playerPos.name || "Herói Anônimo",
      playerPos.playerClass,
      playerPos.level || 1
    );

    setPlayerPos({
      guildId: newGuild.id,
      guildTag: newGuild.tag,
      guildRole: "leader",
    });

    playSynthSound("unlock");
    setFeedbackMsg({ text: `Guilda ${newGuild.name} fundada com sucesso!`, type: "success" });
    setGuilds(loadAllGuilds());
    setTab("my_guild");
  };

  const handleJoin = (g: Guild) => {
    const updated = joinGuild(g.id, {
      playerId: playerPos.name || "player",
      name: playerPos.name || "Herói",
      role: "member",
      playerClass: playerPos.playerClass,
      level: playerPos.level || 1,
      joinedAt: Date.now(),
    });

    if (updated) {
      setPlayerPos({
        guildId: updated.id,
        guildTag: updated.tag,
        guildRole: "member",
      });
      playSynthSound("success");
      setFeedbackMsg({ text: `Você entrou na guilda ${updated.name}!`, type: "success" });
      setGuilds(loadAllGuilds());
      setTab("my_guild");
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none animate-in fade-in">
      <div className="bg-[#181a20] border-4 border-amber-500/80 rounded-2xl max-w-2xl w-full p-5 shadow-[0_0_40px_rgba(245,158,11,0.4)] text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-amber-300 tracking-wider">
                Sistema de Guildas & Clãs
              </h2>
              <p className="text-[11px] text-slate-400">
                Junte-se a outros exploradores e conquiste a Sede da Guildhouse
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-black flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <button
            onClick={() => { setTab("my_guild"); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "my_guild" ? "bg-amber-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Shield className="w-4 h-4" /> Minha Guilda
          </button>
          <button
            onClick={() => { setTab("explore"); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "explore" ? "bg-cyan-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Users className="w-4 h-4" /> Explorar Guildas
          </button>
          <button
            onClick={() => { setTab("create"); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "create" ? "bg-emerald-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Fundar Guilda
          </button>
        </div>

        {feedbackMsg && (
          <div className={`mb-3 text-xs font-bold p-2.5 rounded-lg text-center ${
            feedbackMsg.type === "success" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
          }`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          {tab === "my_guild" && (
            currentGuild ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2 bg-slate-950 rounded-xl border border-slate-700">{currentGuild.bannerIcon}</span>
                    <div>
                      <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                        {currentGuild.name} <span className="text-cyan-400 text-xs px-2 py-0.5 bg-slate-950 rounded border border-slate-700">{currentGuild.tag}</span>
                      </h3>
                      <p className="text-xs text-slate-400">{currentGuild.description}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Líder: 👑 {currentGuild.leaderName} | Nível {currentGuild.level}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Tesouro da Guilda</span>
                    <span className="text-sm font-black text-emerald-400 flex items-center gap-1 justify-end">
                      <Coins className="w-4 h-4" /> {currentGuild.treasuryGamefi} GAMEFI
                    </span>
                  </div>
                </div>

                {/* Lista de Membros */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" /> Membros Ativos ({currentGuild.members.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentGuild.members.map((m) => (
                      <div key={m.playerId} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span>{m.role === "leader" ? "👑" : m.role === "officer" ? "⭐" : "🛡️"}</span>
                          <div>
                            <span className="font-bold text-slate-200">{m.name}</span>
                            <span className="text-[10px] text-slate-500 block">Lvl {m.level} • {m.playerClass || "Guerreiro"}</span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded uppercase font-black border border-slate-800">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão de Teleporte para Guildhouse */}
                {onTeleportToGuildhouse && (
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onTeleportToGuildhouse();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[2px_2px_0px_#000] border-2 border-black flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> Entrar na Sede (Guildhouse)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Shield className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-xs">Você ainda não faz parte de nenhuma guilda.</p>
                <button
                  onClick={() => setTab("explore")}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-black text-xs uppercase rounded-xl border border-black shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Explorar Guildas Disponíveis
                </button>
              </div>
            )
          )}

          {tab === "explore" && (
            <div className="space-y-2">
              {guilds.map((g) => {
                const isMember = g.id === playerPos.guildId || g.members.some((m) => m.playerId === (playerPos.name || "player"));
                return (
                  <div key={g.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1.5 bg-slate-950 rounded-lg border border-slate-800">{g.bannerIcon}</span>
                      <div>
                        <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          {g.name} <span className="text-cyan-400 text-[10px] px-1.5 py-0.2 bg-slate-950 rounded border border-slate-800">{g.tag}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400">{g.description}</p>
                        <span className="text-[9px] text-slate-500">Membros: {g.members.length} | Líder: {g.leaderName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoin(g)}
                      disabled={isMember}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border border-black shadow-[1.5px_1.5px_0px_#000] cursor-pointer ${
                        isMember ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      }`}
                    >
                      {isMember ? "Membro" : "Entrar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "create" && (
            <form onSubmit={handleCreateGuild} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nome da Guilda</label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Ex: Ordem dos Alquimistas"
                  maxLength={30}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tag da Guilda (2-5 letras)</label>
                  <input
                    type="text"
                    value={guildTag}
                    onChange={(e) => setGuildTag(e.target.value)}
                    placeholder="Ex: STAR"
                    maxLength={5}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-amber-400 font-black uppercase outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ícone do Brasão</label>
                  <select
                    value={guildIcon}
                    onChange={(e) => setGuildIcon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
                  >
                    <option value="🛡️">🛡️ Escudo da Ordem</option>
                    <option value="⚔️">⚔️ Espadas Cruzadas</option>
                    <option value="🧙‍♂️">🧙‍♂️ Alquimista</option>
                    <option value="🏹">🏹 Caçador</option>
                    <option value="👑">👑 Coroa Imperial</option>
                    <option value="⚡">⚡ Raio Cósmico</option>
                    <option value="🔥">🔥 Fogo Sagrado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descrição / Lema</label>
                <textarea
                  value={guildDesc}
                  onChange={(e) => setGuildDesc(e.target.value)}
                  placeholder="Descreva o propósito e os ideais da sua guilda..."
                  rows={2}
                  maxLength={120}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-slate-400">
                  Custo de Fundação: <strong className="text-amber-400">{GUILD_CREATION_COST_GAMEFI} GAMEFI</strong>
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Criar e Fundar Guilda
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
