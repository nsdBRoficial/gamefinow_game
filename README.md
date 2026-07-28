<div align="center">
  <img src="https://stellar.org/images/stellar-logo.svg" alt="Stellar Logo" width="100"/>
  <h1>GameFiNow — v0.7.9.5</h1>
  <p><strong>A Gamified On-Boarding Experience for the Stellar Ecosystem</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-v0.7.9.5-cyan?style=flat-square" alt="version"/>
    <img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="license"/>
    <img src="https://img.shields.io/badge/network-Stellar_Testnet-yellow?style=flat-square" alt="network"/>
    <img src="https://img.shields.io/badge/i18n-EN_|_PT_|_ES-green?style=flat-square" alt="languages"/>
  </p>
</div>

---

## 🌟 About the Project

**GameFiNow** is a retro-style MMO RPG built on Web3, designed to educate and onboard new users into the Stellar network in an intuitive, fun, and engaging way. Players complete interactive quests that simulate real on-chain interactions — from generating a cryptographic keypair, to depositing funds via an Anchor (On-Ramp), to swapping tokens using Soroban smart contracts and locking assets in a hold vault.

The game runs entirely in the browser, using a 60 FPS HTML5 Canvas engine, and communicates with the **Stellar Testnet** via **WalletNow SDK** and the **Horizon API**.

---

## ✨ What's New in v0.7.9.5 — Game Master Command Center & Player Moderation

### 🛡️ Centro de Comando GM (Game Master)
- **Painel Administrativo Completo**: Uma dashboard estilo "Central de Comando" secreta acessível apenas por administradores em `/admin`.
- **Autenticação Segura JWT**: Usa JWT + chave secreta para validar a entrada do moderador e assinar todas as ações punitivas.
- **Relatórios de Jogadores ao Vivo**: Tabela listando todos os jogadores que estão online ou que já conectaram, exibindo ID da carteira, nome customizado, status e ações rápidas de moderação.

### 🔨 Sistema de Banimento & Suspensão em Tempo Real
- **Moderação Instantânea via WebSockets**: Integração nativa entre o Supabase e o servidor `socket.io` em NodeJS (Express).
- **Opções de Punição Escalonadas**: O GM pode aplicar advertências, suspensões temporárias (1 dia, 3 dias, 7 dias) ou Banimento Permanente.
- **Enforcer RLS (Row Level Security)**: As políticas do banco de dados protegem contra edição não autorizada no painel, garantindo que o status de `is_banned` e `suspended_until` sejam imutáveis por jogadores.
- **Bloqueio de Jogo (Kick Engine)**: Se um usuário suspenso tenta entrar na sala, o servidor recusa e injeta uma tela vermelha opaca impenetrável via manipulação do `document.body` e destrói os dados do Storage para prevenir By-Pass! Efeitos de "Fantasmas" no mapa causados por montagens assíncronas do React Strict Mode foram corrigidos!

---

## ✨ What's New in v0.7.7 — Real XLM Outfits, On-Chain Character Rename & Customization Engine

### 👗 Real Stellar On-Chain XLM Outfit Purchases
- **On-Chain Outfit Shop**: Integrated real XLM transaction execution directly to the project treasury wallet (`GAMEFI_TREASURY_PUBLIC_KEY`: `GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B`).
- **High-Fidelity Pixel Art Outfits**: Added 10 rich retro pixel outfits (Cyber Armor, Samurai, Valkyrie, Royal Suit, Golden Armor, Dress, etc.) and legendary weapons (Viking Axe, Magic Wand, Katana, Wings).
- **Female Hourglass Waist Silhouette**: Female character sprites (`gender: "female"`) now render with a smooth 16px shoulder ➔ 14px waist ➔ 16px hips curve.

### 💳 On-Chain Character Rename (5 XLM)
- **Stellar Name Change Fee**: Replacing player names in the Outfit customizer now charges **5 XLM** sent directly to the GameFi treasury.
- **Horizon & Explorer Validation**: Generates a 64-character transaction hash with a direct link to **Stellar Expert Explorer** upon successful payment confirmation.

### 🎨 5-Tier Quest Overhead Name Tag Colors & Matrix Green
- **Automatic Quest Progress Colors**: Overhead name tags on the 2D map update automatically as quests are completed:
  1. 🌊 **Náufrago Recém-Chegado** (0 Quests): White NPC (`#ffffff`)
  2. 📜 **Iniciado de Stellar** (Quest 1 Wallet): Yellow (`#ffc600`)
  3. 💳 **Operador On-Ramp** (Quest 2 On-Ramp): Noble Gold (`#fbbf24` with `#f59e0b` glow)
  4. 🧪 **Alquimista do Soroban** (Quest 3 Soroban): Mystic Purple (`#e879f9` with `#d946ef` glow)
  5. 👑 **Herói Lendário de Stellar** (Quest 4 Holder Vault): **Electric Matrix Green (`#00ff66` with `#00e676` neon glow)**
- **Unlocked Color Selector**: Completing all 4 quests unlocks manual selection in the Customizer between the 3 advanced quest colors (Gold, Purple, Matrix Green).

---

## ✨ What's New in v0.7.5 — Advanced Interactions & Tokenomics Expansion

### 🌟 Guardian Star Mechanics
- **End-Game Access Control**: The center of the map is now protected. Players must complete the 4 main quests (acquiring the 4 NFT Jewels) to forge their **Guardian Star**.
- **Exclusive Structures**: Only Guardians can access the Faucet, Burn Altar, P2P Store, and Cyber ATM.

### 🏛️ New Interactive Structures & Tokenomics
- **Magic Faucet (Fonte)**: A daily blessing of 10 GAMEFI tokens for active Guardians.
- **Burn Altar (Pira)**: A deflationary mechanic allowing players to burn tokens directly on-chain.
- **P2P Store (Mercado)**: A vibrant marketplace for players to trade assets.
- **Cyber ATM**: Enhanced terminal for advanced DeFi interactions.
- **HUD Update**: The GAMEFI COIN balance now features its own prominent golden badge and dedicated chip separated from traditional assets.

### 📚 New Educative NPCs
- **PigFi [NPC]**: Focuses on micro-investments and family savings ("O cofrinho da infância evoluiu. Com o PigFi, sua família poderá começar a guardar dólar a partir de R$50 via Pix de um jeito simples, visual e divertido.").
- **Wave [NPC]**: Educates on transparent condominium administration and governance via blockchain ("Administração e governança de condomínios com transparência e segurança").

---

### 🌐 Full Internationalization (i18n)
- **3 Languages supported natively:** English (default), Portuguese (PT-BR), Spanish (ES)
- Powered by `react-i18next` with dedicated locale files in `src/i18n/locales/`
- All UI labels, HUD elements, quest texts, NPC dialogues, and barrier messages are fully localized
- Language can be switched at any time from the Landing Page or Login Screen — quest progress is preserved

### 🏠 New Landing Page
- Animated hero section before the login screen
- Highlights the core value proposition: Learn → Play → Grow
- CTA button: **"PLAY FOR FREE NOW"** leads directly to the Login Screen

### 🎮 Redesigned Login Screen
- Animated pixel art aesthetic with dynamic particle effects
- Character selection, name input, and language switcher
- Fully translated in all 3 languages

### 🧙 Improved NPC Storyline & Dialogues
- **James [NPC]** — Temple Master: Now delivers a complete, immersive introduction guiding the player through the entire journey from wallet creation to legendary status
- **Kael [NPC]** — Keymaster: Clear cryptographic keypair explanation in RPG lore
- **Captain HC [NPC]** — Anchor/On-Ramp: Financial bridging explained as a harbor port
- **Alchemist [NPC]** — Soroban Market: Smart contract swaps explained as alchemical transmutation
- **Elder Bobba [NPC]** — Hold Vault: Long-term holding as the final virtue of a legendary guardian

### 🐛 Fixes & Cleanup
- Fixed all hardcoded Portuguese strings remaining in the HUD
- Fixed TypeScript type errors (`Quest` interface, `t()` hook scoping in sub-components)
- QA pass: `tsc --noEmit` runs clean with zero errors

---

## 🗺️ The 4-Quest Onboarding Journey

| # | Quest | Zone | NPC | Blockchain Concept |
|---|-------|------|-----|--------------------|
| 1 | **Forge Your Identity** | East (Blue Bridge) | Kael [NPC] | Cryptographic Keypair |
| 2 | **Acquire Realm Coins** | North (Green Portal) | Captain HC [NPC] | Anchor / On-Ramp |
| 3 | **Trade on the Catalog** | West (Purple Portal) | Alchemist [NPC] | Soroban Smart Contracts |
| 4 | **VIP Legend Vault** | South (Golden Portal) | Elder Bobba [NPC] | Escrow / Hold |

---

## 🕹️ Tech Stack

| Technology | Role |
|------------|------|
| **React 19 + TypeScript** | UI components and HUD |
| **Vite 6** | Fast bundler for dev & production |
| **HTML5 Canvas API** | 60 FPS game engine with retro tilemaps |
| **Tailwind CSS v4** | Styling, glassmorphism, animations |
| **Zustand** | Global state management (inventory, quests, wallet) |
| **react-i18next** | Multilingual support (EN / PT / ES) |
| **WalletNow SDK** | On-Ramp, Vault, Swap integrations |
| **Stellar Horizon API** | Testnet balance fetching & transactions |
| **NippleJS** | Mobile joystick controls |

---

## 🚀 Running Locally

**Prerequisites:** Node.js v18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Type check (zero-error guarantee)
npm run lint

# Production build
npm run build
```

---

## 📁 Project Structure

```
src/
├── App.tsx                   # Main app router & game loop orchestrator
├── gameData.ts               # Tile types, NPC definitions, quest config
├── types.ts                  # TypeScript interfaces (Quest, NPC, WalletState...)
├── components/
│   ├── LandingPage.tsx       # Marketing landing page (new in v0.7.0)
│   ├── LoginScreen.tsx       # Animated login / character creation
│   ├── GameCanvas.tsx        # 60 FPS canvas engine & player controller
│   ├── GameOverlay.tsx       # Quest modals (Wallet, OnRamp, Soroban, Hold)
│   ├── DialogSystem.tsx      # NPC dialogue pop-up system
│   ├── FloatingWindows.tsx   # Inventory, wardrobe, ledger, rulebook
│   ├── MapModal.tsx          # Full-screen world map viewer
│   └── PassportModal.tsx     # Player passport / ID card
├── i18n/
│   ├── i18n.ts               # i18next configuration
│   └── locales/
│       ├── en.json           # English strings (default)
│       ├── pt.json           # Portuguese strings
│       └── es.json           # Spanish strings
├── maps/                     # Map tile definitions (center, east, west, north, south)
├── services/
│   ├── stellarServices.ts    # WalletNow SDK & Horizon API integrations
│   └── sep24Service.ts       # SEP-24 anchor deposit flow
└── store/
    └── gameStore.ts          # Zustand global state store
```

---

## ☁️ Deploying to Vercel

Zero-config deployment. The Canvas engine is iframe-resistant (custom `tabIndex` and `window.focus()` handling ensures WASD/Arrow keys work inside Vercel's sandbox):

1. Connect your repo to [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

---

<div align="center">
  <b>Built by nsdBR GameFiNow Team</b><br/>
  <sub>v0.7.5 — Stellar Testnet — July 2026</sub>
</div>
