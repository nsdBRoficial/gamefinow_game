# GameFiNow — Roadmap de Funcionalidades

> **v0.8.8** • Stellar Testnet • Agosto 2026

O GameFiNow está em expansão ativa. Abaixo o estado completo das funcionalidades por fase, com o que já foi implementado e o que está planejado para as próximas iterações.

---

## ✅ Fase 0 — Genesis (Concluído)

**Fundação do jogo e integração Web3 básica.**

- [x] Integração com Stellar Testnet via Horizon API
- [x] Token GAMEFI on-chain (issuer: `GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B`)
- [x] **4 Quests de Onboarding** educativas (Wallet → On-Ramp → Soroban → Hold)
- [x] Engine 2D de 60 FPS com Canvas HTML5 e tilemaps pixel art (mapa 60×60)
- [x] **WalletNow SDK** para criação de carteira, On-Ramp e Swap
- [x] Internacionalização (i18n) em 3 idiomas: EN / PT-BR / ES
- [x] Landing Page e Login Screen animados
- [x] Passkeys (WebAuthn) para login biométrico sem senha
- [x] HUD com exibição de balances (XLM, USDW, BRW, GAMEFI)

---

## 🔥 Fase 1 — Expansion (Em Andamento — v0.7.5 a v0.8.8)

**Economia do jogo, multiplayer e sistemas de progressão.**

- [x] **15+ stands de parceiros** no mapa (Soroswap, WalletNow, DefIndex, PigFi, Dupply, NIDO, AutoFin, NEARX, WAVE, TroqPay, Vellora, MUTAV, Web3Edu, ParaDevs, EnergyPay)
- [x] **Loja P2P on-chain** com taxa de 0.5% ao treasury
- [x] **10 Outfits pixel art** com compra em XLM real on-chain
- [x] **Multiplayer em Tempo Real** via Socket.io e Supabase
- [x] **About Page** completa com Live Stats da Stellar Testnet
- [x] **UI Mobile** com joystick NippleJS
- [x] **Sistema de Combate** real-time com monstros (Slimes, Worms, Crabs, Bees, Snakes)
- [x] **Sistema de Magias** com 4 classes e feitiços de Cura, Fogo e Raio
- [x] **⭐ [NOVO v0.8.8] Sistema de Guildas** — criação, entrada, roles, tesouro, teleport
- [x] **⭐ [NOVO v0.8.8] Consagração de Classe** — 4 classes com modificadores únicos e passivas
- [x] **Painel Admin GM** com moderação via WebSocket e JWT
- [x] **Backend Relayer** com validação atômica de taxa no servidor Express
- [x] **Sistema de Banimento/Suspensão** com RLS do Supabase
- [x] **Rename de Personagem** on-chain por 5 XLM
- [x] **5 cores de name tag** baseadas no progresso de quests
- [x] **Guardian Star Mechanics** — acesso ao centro protegido após 4 quests
- [x] **Faucet, Burn Altar, P2P Store, Cyber ATM** para Guardiões

---

## ⏳ Fase 2 — Economy (Em Breve)

**DeFi avançado e monetização sustentável.**

- [ ] **Cofres de Rendimento (Yield Vaults)** on-chain com Soroban — lock GAMEFI por 24h com APY passivo
- [ ] **Pools de Liquidez** in-game com AMM integrado (SoroSwap)
- [ ] **Governança DAO** — votações no Distrito Norte com tokens GAMEFI
- [ ] **Auditoria de Contrato Soroban** — revisão de segurança para mainnet
- [ ] **GAMEFI Staking** — sistema de recompensas para holders de longo prazo
- [ ] **Inventário Web3** — itens e NFTs salvos on-chain e no banco de dados
- [ ] **Anti-Bot Stamina System** — variável `energy_stamina` que reduz XP em 70% ao zerar
- [ ] **Drop Tables Estendidos** — monstros dropam materiais raros (Safira, Pérola)

---

## 🌌 Fase 3 — Multiverse (Planejado — Mainnet)

**Escalonamento global e expansão cross-chain.**

- [ ] **Lançamento na Stellar Mainnet** com token GAMEFI listado em DEXs/CEXs
- [ ] **Bridges Cross-Chain** para ecossistemas compatíveis
- [ ] **Aplicativo Mobile Nativo** (iOS/Android) com Passkeys integradas
- [ ] **Torneios com Prize Pools** em stablecoins (USDC/BRW)
- [ ] **SDK para Parceiros** — API pública para integração de novos protocolos no mundo
- [ ] **Sistema de PvP Avançado** — Arena por turnos (estilo Final Fantasy/Pokémon) com `WagerPvP Soroban`
- [ ] **BGM e SFX Extensos** — música dinâmica por região e efeitos de golpe por tipo
- [ ] **LootDistributor.soroban** — distribuição semanal de recompensas baseada em leaderboard

---

## 📊 Status de Integrações On-Chain

| Feature | Status | Tipo |
|---------|--------|------|
| Criação de Carteira (WalletNow SDK) | ✅ Live | 100% On-Chain |
| On-Ramp via Anchor (SEP-24) | ✅ Live | Híbrido |
| Swap Soroban (DEX) | ✅ Live | 100% On-Chain |
| Hold Vault / Escrow | ✅ Live | 100% On-Chain |
| Compra de Outfits em XLM | ✅ Live | 100% On-Chain |
| Rename de Personagem (5 XLM) | ✅ Live | 100% On-Chain |
| Fee Relayer (taxa 0.5%) | ✅ Live | Backend Off-Chain |
| Multiplayer (Socket.io) | ✅ Live | Backend Off-Chain |
| Sistema de Guildas | ✅ Live | localStorage (Fase 1) |
| Consagração de Classe | ✅ Live | localStorage (Fase 1) |
| Yield Vaults (Soroban) | ⏳ Planejado | 100% On-Chain |
| DAO Governance | ⏳ Planejado | 100% On-Chain |

---

> *Para implementar as funcionalidades da Fase 2+, consulte os documentos técnicos:*
> - [`DOC_REQUISITOS_BATALHAS.md`](./DOC_REQUISITOS_BATALHAS.md)
> - [`DOC_EVOLUCAO_E_DROPS.md`](./DOC_EVOLUCAO_E_DROPS.md)
> - [`DOC_ECONOMIA_TOKENOMICS.md`](./DOC_ECONOMIA_TOKENOMICS.md)
> - [`DOC_MULTIPLAYER_MMO.md`](./DOC_MULTIPLAYER_MMO.md)
