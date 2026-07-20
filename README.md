<div align="center">
  <img src="https://stellar.org/images/stellar-logo.svg" alt="Stellar Logo" width="100"/>
  <h1>GameFiNow — v0.7.0</h1>
  <p><strong>A Gamified On-Boarding Experience for the Stellar Ecosystem</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-v0.7.0-cyan?style=flat-square" alt="version"/>
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

## ✨ What's New in v0.7.0 — Multilingual & Lore Overhaul

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
  <b>Built with ❤️ by Hackers Club / GameFiNow Team</b><br/>
  <sub>v0.7.0 — Stellar Testnet — July 2026</sub>
</div>
