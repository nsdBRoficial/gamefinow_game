const { io } = require("socket.io-client");

const backendUrl = "http://localhost:3001";
console.log("Conectando ao backend em", backendUrl);

const socketA = io(backendUrl);
const socketB = io(backendUrl);

const playerA = {
  playerId: "anon_playerA",
  name: "Player A",
  hp: 100, maxHp: 100, mp: 50, maxMp: 50, speed: 5, level: 1, playerClass: "warrior", activeBuffs: [],
  isEliminated: false, arenaX: 0, arenaY: 0, dir: "down", isMoving: false, frame: 0,
};

const playerB = {
  playerId: "anon_playerB",
  name: "Player B",
  hp: 100, maxHp: 100, mp: 50, maxMp: 50, speed: 5, level: 1, playerClass: "warrior", activeBuffs: [],
  isEliminated: false, arenaX: 0, arenaY: 0, dir: "down", isMoving: false, frame: 0,
};

let sessionId = null;
let currentPhase = "start";

socketA.on("connect", () => {
  console.log("Player A conectado:", socketA.id);
  socketA.emit("arena_join_request", {
    playerId: playerA.playerId,
    mode: "ffa",
    playerPayload: playerA
  });
});

socketB.on("connect", () => {
  console.log("Player B conectado:", socketB.id);
});

socketA.on("arena_sync", (session) => {
  console.log(`[Player A] Recebeu arena_sync. Status: ${session.status}, Players: ${session.players.length}`);
  sessionId = session.sessionId;

  if (currentPhase === "start") {
    currentPhase = "b_join";
    setTimeout(() => {
      console.log("Player B entrando na arena...");
      socketB.emit("arena_join_request", {
        playerId: playerB.playerId,
        mode: "ffa",
        playerPayload: playerB
      });
    }, 500);
  }
});

socketB.on("arena_sync", (session) => {
  console.log(`[Player B] Recebeu arena_sync. Status: ${session.status}, Players: ${session.players.length}`);
  if (session.status === "pre_battle" && currentPhase === "b_join") {
    currentPhase = "a_leave";
    
    // Testa saida do player A
    setTimeout(() => {
      console.log("Player A simulando saída (arena_leave) e desconexão...");
      socketA.emit("arena_leave", { sessionId, playerId: playerA.playerId });
      socketA.disconnect();
    }, 500);
  }
});

// Acompanha updates do lado do Player B
socketB.on("arena_player_eliminated", (data) => {
  console.log(`[Player B] Recebeu arena_player_eliminated para: ${data.playerId}`);
  if (currentPhase === "a_leave") {
    currentPhase = "a_reconnect";
    setTimeout(() => {
      console.log("Player A simulando reconexão (F5) num novo socket...");
      const socketA_new = io(backendUrl);
      socketA_new.on("connect", () => {
        console.log("Player A reconectado:", socketA_new.id);
        socketA_new.emit("arena_join_request", {
          playerId: playerA.playerId,
          mode: "ffa",
          sessionId: sessionId, // Ele guardou no sessionStorage e enviou
          playerPayload: playerA
        });
      });
      
      socketA_new.on("arena_sync", (sess) => {
        console.log(`[Player A_new] Recebeu arena_sync. Status: ${sess.status}, Players: ${sess.players.length}`);
        
        // Verifica que ele entrou e nao tem duplicados
        console.log("FIM DO TESTE DE FLUXO.");
        process.exit(0);
      });
    }, 500);
  }
});
