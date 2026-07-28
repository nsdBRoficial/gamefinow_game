import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected with socket id:", socket.id);
  
  // Emular o testeban entrando no mapa
  socket.emit("join_map", {
    mapId: "center",
    playerId: "GD5E6QXJMXXU4ONX2MIX3Q4U2KFPZJM53BYIQ3TOKSHP6GKS5PCJYVD7",
    playerPayload: {
      name: "testeban",
      wallet: "GD5E6QXJMXXU4ONX2MIX3Q4U2KFPZJM53BYIQ3TOKSHP6GKS5PCJYVD7"
    }
  });
  console.log("join_map emitted!");
});

socket.on("kick_user", (data) => {
  console.log("RECEIVED kick_user EVENT:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server!");
  process.exit(0);
});

setTimeout(() => {
  console.log("Timeout! Exiting...");
  process.exit(1);
}, 5000);
