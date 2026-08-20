/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GUILD_CREATION_COST_GAMEFI = 50;

export interface GuildMember {
  playerId: string;
  name: string;
  role: "leader" | "officer" | "member";
  playerClass?: string;
  level: number;
  joinedAt: number;
}

export interface Guild {
  id: string;
  name: string;
  tag: string; // Ex: "[STAR]", "[XLM]"
  description: string;
  leaderId: string;
  leaderName: string;
  level: number;
  treasuryGamefi: number;
  bannerIcon: string;
  bannerColor: string;
  members: GuildMember[];
  createdAt: number;
}

const STORAGE_KEY = "gamefinow_guilds_v1";

export function loadAllGuilds(): Guild[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Erro ao carregar guildas do localStorage", e);
  }

  // Guilda padrão inicial
  const defaultGuild: Guild = {
    id: "guild-stellar-knights",
    name: "Cavaleiros de Stellar",
    tag: "[STAR]",
    description: "A mais nobre ordem de exploradores da Ilha Central e defensores da rede.",
    leaderId: "founder-1",
    leaderName: "Kaelen",
    level: 2,
    treasuryGamefi: 250,
    bannerIcon: "🛡️",
    bannerColor: "#3b82f6",
    members: [
      { playerId: "founder-1", name: "Kaelen", role: "leader", playerClass: "warrior", level: 10, joinedAt: Date.now() - 86400000 },
      { playerId: "member-2", name: "Lyra", role: "officer", playerClass: "soroban_mage", level: 8, joinedAt: Date.now() - 43200000 },
    ],
    createdAt: Date.now() - 86400000,
  };

  return [defaultGuild];
}

export function saveGuilds(guilds: Guild[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guilds));
  } catch (e) {
    console.error("Erro ao salvar guildas", e);
  }
}

export function createGuild(
  name: string,
  tag: string,
  description: string,
  bannerIcon: string,
  bannerColor: string,
  leaderId: string,
  leaderName: string,
  leaderClass?: string,
  leaderLevel: number = 1
): Guild {
  const formattedTag = tag.startsWith("[") && tag.endsWith("]") ? tag.toUpperCase() : `[${tag.replace(/[\[\]]/g, "").toUpperCase()}]`;
  const newGuild: Guild = {
    id: `guild_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    tag: formattedTag,
    description,
    leaderId,
    leaderName,
    level: 1,
    treasuryGamefi: 0,
    bannerIcon: bannerIcon || "🛡️",
    bannerColor: bannerColor || "#3b82f6",
    members: [
      {
        playerId: leaderId,
        name: leaderName,
        role: "leader",
        playerClass: leaderClass,
        level: leaderLevel,
        joinedAt: Date.now(),
      },
    ],
    createdAt: Date.now(),
  };

  const guilds = loadAllGuilds();
  guilds.push(newGuild);
  saveGuilds(guilds);

  return newGuild;
}

export function joinGuild(guildId: string, member: GuildMember): Guild | null {
  const guilds = loadAllGuilds();
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return null;

  if (!guild.members.some((m) => m.playerId === member.playerId)) {
    guild.members.push(member);
    saveGuilds(guilds);
  }

  return guild;
}
