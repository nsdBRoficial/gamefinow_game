<div align="center">
  <img src="https://stellar.org/images/stellar-logo.svg" alt="Stellar Logo" width="100"/>
  <h1>GameFiNow - v0.5.0</h1>
  <p><strong>A Gamified On-Boarding Experience for the Stellar Ecosystem</strong></p>
</div>

## 🌟 Sobre o Projeto (v0.5.0)

O **GameFiNow** é um MMO RPG retro focado em Web3 que visa educar e integrar novos usuários na rede Stellar de forma intuitiva, divertida e fluida. O projeto atua como uma ponte gamificada onde os jogadores realizam missões interativas que simulam interações reais e on-chain (como On-Ramp de PIX, integração com a WalletNow SDK, AMM Swap via Soroban, e Holding de criptoativos).

Nesta **v0.5.0 (East Map & WalletNow On-Ramp Integration)**, trouxemos um grande avanço no fluxo central do jogo!

### ✨ Principais Novidades da v0.5.0

- 🗺️ **Sistema de Mapas Isolados & East Map:** Arquitetura do World Map remodelada. Agora os biomas são isolados. O *East Map* foi totalmente redesenhado como o lar dos temíveis Worms e do Terminal de On-Ramp PIX.
- 💳 **WalletNow On-Ramp Integrado:** Implementação do portal de conversão Fiduciário → Crypto simulando uma operação Pix via **WalletNow SDK** (Testnet). Suporte a XLM, USDW e BRW!
- ⚡ **Buffs de Status em Tempo Real:** 
  - Completar o On-Ramp agora concede ao jogador o título de **Investidor** 💰.
  - A Aura de Velocidade (+10%) ⚡ agora aumenta a velocidade de movimento do herói visivelmente (+10% real no motor de movimento).
- 💚 **Neon Dinâmico e Customização Visual:** Jogadores que concluem etapas essenciais ganham um brilho *Neon Radioativo* no nome (On-Ramp) que avança pelas bordas da carteira nas missões seguintes.
- 🎯 **HUD Reativa de Missões Ativas:** O Painel de Missões no canto superior esquerdo agora acompanha organicamente o estado da *Quest* atual. Completou On-Ramp? O HUD atualiza imediatamente para o passo seguinte (Soroban AMM Swap).
- 🐛 **Correção de Eventos e Ambiente Vercel:** Correção profunda de captura de eventos de teclado (WASD, Setas e Espaço) resolvendo travamentos em ambientes iframes/Vercel (Shadow DOM). A Engine agora auto-força o foco garantindo jogabilidade suave em deploy de produção!
- 💬 **Balões de Diálogo (NPC Bubbles) Dinâmicos:** Outros jogadores (MMO NPCs) agora possuem um chat randômico que enriquece a lore da Stellar e do mundo DeFi (ex: "Consenso em 5 segundos!", "Taxa quase zero!").

## 🕹️ Tecnologias Utilizadas

- **React 19 + TypeScript**: Base da interface e componentes da HUD.
- **Vite**: Bundler rápido para dev e produção.
- **HTML5 Canvas API**: Motor de renderização em 60 FPS com Tilemaps retro customizados.
- **Tailwind CSS v4**: Estilização dinâmica, grids, glassmorphism UI e animações da HUD.
- **Zustand**: Gerenciamento de estado global de Alta Performance (Inventário, Missões, Carteira).
- **Stellar Horizon / WalletNow SDK**: Mock/Integração para gerar transações educacionais de testnet.

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js v18+

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000`

## 🛠️ Deploy na Vercel

O projeto está otimizado para deploy *zero-config* na Vercel. Devido às otimizações de `tabIndex` e `window.focus()` da **v0.5**, o Web Canvas é resistente aos containers Iframe/Shadow DOM da plataforma, capturando as teclas direcionais de imediato e sem rolagem indevida do navegador principal.

Basta associar seu repositório no dashboard da Vercel e rodar o pipeline automático (`npm run build`).

---
<div align="center">
  <b>Built with ❤️ by Hackers Club / GameFiNow Team</b>
</div>
