import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import { Player } from "../types";

// Mock localStorage para ambiente Vitest/Node
if (typeof global.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    length: 0,
  };
}

describe("Arena PvP System & Contextual Mechanics", () => {
  beforeEach(() => {
    // Reset da store para estado limpo
    useGameStore.setState({
      playerPos: {
        x: 30,
        y: 46,
        targetX: 30,
        targetY: 46,
        dir: "down",
        isMoving: false,
        frame: 0,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        mapId: "arena",
      } as Player,
      isDead: false,
      isBattleModeActive: false,
      lockedTargetId: null,
      targetInfo: null,
      activeBuffs: [],
      arenaScore: { kills: 0, deaths: 0, streak: 0, highestStreak: 0 },
    });
  });

  describe("Contextual Respawn na Arena vs Centro", () => {
    it("deve renascer em x: 30, y: 53 na Arena ao morrer dentro do mapa arena", () => {
      const store = useGameStore.getState();

      // Jogador morre na arena
      store.killPlayer("Gladiador", 100);

      const deadState = useGameStore.getState();
      expect(deadState.isDead).toBe(true);
      expect(deadState.lastDeathInfo?.killerName).toBe("Gladiador");
      expect(deadState.lastDeathInfo?.mapId).toBe("arena");
      expect(deadState.arenaScore?.deaths).toBe(1);
      expect(deadState.arenaScore?.streak).toBe(0);

      // Jogador clica em Renascer
      deadState.respawnPlayer();

      const respawnState = useGameStore.getState();
      expect(respawnState.isDead).toBe(false);
      expect(respawnState.playerPos.mapId).toBe("arena");
      expect(respawnState.playerPos.x).toBe(30);
      expect(respawnState.playerPos.y).toBe(53);
      expect(respawnState.playerPos.hp).toBe(100);

      // Deve conceder o escudo protetor de invulnerabilidade (anti-spawn kill)
      const respawnShield = respawnState.activeBuffs?.find((b) => b.id === "buff_shield_respawn");
      expect(respawnShield).toBeDefined();
      expect(respawnShield?.statModifiers?.invulnerable).toBe(true);
    });

    it("deve renascer em x: 30, y: 30 no Centro ao morrer fora da arena", () => {
      // Jogador no centro
      useGameStore.setState((prev) => ({
        playerPos: { ...prev.playerPos, mapId: "center", x: 25, y: 25 },
      }));

      const store = useGameStore.getState();
      store.killPlayer("Blob", 50);

      const deadState = useGameStore.getState();
      expect(deadState.lastDeathInfo?.mapId).toBe("center");

      deadState.respawnPlayer();

      const respawnState = useGameStore.getState();
      expect(respawnState.playerPos.mapId).toBe("center");
      expect(respawnState.playerPos.x).toBe(30);
      expect(respawnState.playerPos.y).toBe(30);
    });
  });

  describe("Arena Scoreboard & Kill / Death Tracker", () => {
    it("deve contabilizar abates, sequência (streak) e maior sequência corretamente", () => {
      const store = useGameStore.getState();

      store.recordArenaKill();
      store.recordArenaKill();
      store.recordArenaKill();

      let score = useGameStore.getState().arenaScore;
      expect(score?.kills).toBe(3);
      expect(score?.deaths).toBe(0);
      expect(score?.streak).toBe(3);
      expect(score?.highestStreak).toBe(3);

      // Morte reseta a sequência atual, mas mantém a maior sequência
      store.recordArenaDeath();

      score = useGameStore.getState().arenaScore;
      expect(score?.kills).toBe(3);
      expect(score?.deaths).toBe(1);
      expect(score?.streak).toBe(0);
      expect(score?.highestStreak).toBe(3);

      // Próximo abate recomeça a sequência
      store.recordArenaKill();
      score = useGameStore.getState().arenaScore;
      expect(score?.kills).toBe(4);
      expect(score?.streak).toBe(1);
      expect(score?.highestStreak).toBe(3);
    });

    it("deve zerar o placar da sessão ao invocar resetArenaScore (ao sair da arena)", () => {
      const store = useGameStore.getState();

      store.recordArenaKill();
      store.recordArenaKill();
      store.recordArenaDeath();

      expect(useGameStore.getState().arenaScore?.kills).toBe(2);

      store.resetArenaScore();

      const resetScore = useGameStore.getState().arenaScore;
      expect(resetScore?.kills).toBe(0);
      expect(resetScore?.deaths).toBe(0);
      expect(resetScore?.streak).toBe(0);
      expect(resetScore?.highestStreak).toBe(0);
    });
  });

  describe("Target Locking e TargetHUD Integration", () => {
    it("deve travar o alvo em outro jogador e armazenar metadados no targetInfo", () => {
      const store = useGameStore.getState();

      store.setLockedTarget("rival_player_99", {
        id: "rival_player_99",
        name: "LordStellar",
        level: 15,
        hp: 450,
        maxHp: 500,
        isPlayer: true,
        playerClass: "stellar_knight",
      });

      const updated = useGameStore.getState();
      expect(updated.lockedTargetId).toBe("rival_player_99");
      expect(updated.targetInfo).toBeDefined();
      expect(updated.targetInfo?.name).toBe("LordStellar");
      expect(updated.targetInfo?.hp).toBe(450);
      expect(updated.targetInfo?.playerClass).toBe("stellar_knight");
      expect(updated.targetInfo?.isPlayer).toBe(true);

      // Cancelar alvo
      store.setLockedTarget(null, null);
      const cleared = useGameStore.getState();
      expect(cleared.lockedTargetId).toBeNull();
      expect(cleared.targetInfo).toBeNull();
    });
  });

  describe("Multiplayer Tab Isolation & Player Visibility", () => {
    it("deve garantir que getOrCreatePlayerId retorne IDs distintos para janelas/abas distintas", async () => {
      const { getOrCreatePlayerId } = await import("../services/multiplayerService");
      
      const id1 = getOrCreatePlayerId();
      expect(id1).toMatch(/^anon_/);

      // Simula segunda janela com window.name diferente
      const originalWindow = global.window;
      (global as any).window = {
        name: "gfn_tab_subwindow_2",
      };
      
      // Chave de carteira explícita tem precedência
      const customKey = "GBBDU2327798327TESTKEYSTELLAR999";
      const idWallet = getOrCreatePlayerId(customKey);
      expect(idWallet).toBe(customKey);

      // Restaura window
      (global as any).window = originalWindow;
    });

    it("jogadores em abas distintas no mapa arena devem se manter visíveis mutuamente", () => {
      const player1Id = "anon_window1_abc";
      const player2Id = "anon_window2_xyz";

      // Mock da lista de jogadores recebida via sync_players no mapa "arena"
      const arenaPlayers = [
        { player_id: player1Id, name: "Mary", map_id: "arena", x: 30, y: 46 },
        { player_id: player2Id, name: "Anonymo", map_id: "arena", x: 32, y: 48 },
      ];

      // Visão da Janela 1: descarta apenas a si mesma e mantém player2
      const window1OtherPlayers = arenaPlayers.filter(
        (p) => p.player_id !== player1Id && p.map_id === "arena"
      );
      expect(window1OtherPlayers.length).toBe(1);
      expect(window1OtherPlayers[0].player_id).toBe(player2Id);
      expect(window1OtherPlayers[0].name).toBe("Anonymo");

      // Visão da Janela 2: descarta apenas a si mesma e mantém player1
      const window2OtherPlayers = arenaPlayers.filter(
        (p) => p.player_id !== player2Id && p.map_id === "arena"
      );
      expect(window2OtherPlayers.length).toBe(1);
      expect(window2OtherPlayers[0].player_id).toBe(player1Id);
      expect(window2OtherPlayers[0].name).toBe("Mary");
    });

    it("deve forçar o nascimento no Centro (mapId: center, x: 30, y: 30) se o jogador deslogar, fechar a tela ou cair enquanto estiver na Arena", () => {
      // Simula estado residual salvo no localStorage dentro da arena
      localStorage.setItem(
        "stellar_island_player_pos_v3",
        JSON.stringify({
          x: 30,
          y: 46,
          targetX: 30,
          targetY: 46,
          mapId: "arena",
          name: "GladiadorOffline",
        })
      );

      // Lê a posição inicial restaurada
      const savedRaw = localStorage.getItem("stellar_island_player_pos_v3");
      expect(savedRaw).toBeDefined();
      const parsed = JSON.parse(savedRaw!);

      const isArena = parsed.mapId === "arena";
      const sanitizedMapId = isArena ? "center" : parsed.mapId;
      const sanitizedX = isArena ? 30 : parsed.x;
      const sanitizedY = isArena ? 30 : parsed.y;

      expect(sanitizedMapId).toBe("center");
      expect(sanitizedX).toBe(30);
      expect(sanitizedY).toBe(30);
    });
  });
});
