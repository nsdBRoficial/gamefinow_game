---
name: gamefinow-test-master
description: >-
  Suíte de testes, personas e automação do GameFiNow baseada no DOC_PLANO_TESTES.md.
  Use sempre que for planejar, criar, executar ou auditar testes (unitários, componentes,
  integração, contratos REST/Socket, e2e e não-funcionais) no projeto GameFiNow.
---

# 🧪 GameFiNow Test Master Skill

Esta skill instrui o agente na criação, manutenção e execução de testes em toda a arquitetura do **GameFiNow**, seguindo estritamente as diretrizes do [DOC_PLANO_TESTES.md](file:///c:/Users/Usuário/Documents/GitHub/gamefinow_game/DOC_PLANO_TESTES.md).

---

## 1. Princípios Fundamentais de Teste

1. **Determinismo:** Sempre utilize seeds para geradores pseudoaleatórios e `vi.useFakeTimers()` para testes envolvendo cooldowns, ticks de regeneração e timers de buffs/debuffs.
2. **Isolamento de Borda:** Nunca execute chamadas de rede real (Horizon Stellar, Friendbot, Supabase Cloud ou Google GenAI) em testes unitários ou de integração padrão. Use mocks com `msw` ou `vi.spyOn`.
3. **Padrão AAA (Arrange-Act-Assert):** Cada teste deve focar em um comportamento claro. Descreva os nomes dos testes em Português do Brasil com clareza (ex: `it('deve aplicar cooldown após conjurar magia com sucesso')`).
4. **Co-localização vs Diretório `tests/`:**
   - Testes unitários puros de lógica/dados/store ficam co-localizados (`*.test.ts` ao lado do código-fonte).
   - Testes de componentes (`*.component.test.tsx`), integração REST/Socket (`tests/integration/`), fixtures e E2E residem na pasta `tests/`.

---

## 2. Personas de Teste (Catálogo Oficial)

Ao criar cenários e fixtures de teste, vincule explicitamente à persona correspondente:

| ID | Persona | Características & Foco do Teste |
|---|---|---|
| **P01** | 🐣 **Novato Nina** | 1º acesso, sem carteira, mobile. Foco: landing, onboarding, joystick nipplejs, tutorial. |
| **P02** | 🎮 **Casual Caio** | Nível 3–10. Foco: quests, ganho de XP, compra de poções, exploração de mapas. |
| **P03** | ⚔️ **Hardcore Hugo** | Nível máximo. Foco: combos de magias, rotação de cooldowns, limites de stats e equipamentos. |
| **P04** | 🏟️ **PvP Paula** | Competitiva na Arena. Foco: matchmaking, cálculo de dano físico/mágico, morte e respawn. |
| **P05** | 🛡️ **Líder de Guilda Gui** | Gerência de guilda. Foco: `join_guild`, chat de guilda e salas privadas. |
| **P06** | 💰 **Investidor Ivo** | Foco Web3: mineração, cofres (`vault`), relayer de transações e SEP-24 / Soroban. |
| **P07** | 🗣️ **Social Sofia** | Interações e chat: mensagens globais, filtro de profanidade e suporte i18n multilíngue. |
| **P08** | 🧑‍⚖️ **Admin Ana** | Painel de moderação: autenticação JWT de admin, ban, suspend, métricas e botão de pânico. |
| **P09** | 🦹 **Trapaceiro Tito** | Vetores de ataque: speedhack, teleporte, adulteração de dano, spam de socket e injeção. |
| **P10** | 📶 **Instável Ícaro** | Conexões instáveis: reconexão de Socket.IO, pacotes fora de ordem e desconexão abrupta. |
| **P11** | ♿ **Acessível Alice** | Acessibilidade: navegação 100% por teclado, conformidade ARIA e contraste. |
| **P12** | 🔁 **Recuperador Rui** | Restauração de conta: recuperação automática Google e fallback por Secret Key SEP-10. |
| **P13** | 🚫 **Banido Bruno** | Rejeição de conexões e rotas para jogadores marcados com status banido/suspenso. |
| **P14** | 🤖 **Bot de Carga** | Testes sintéticos de throughput de pacotes de movimentação e combate na Arena. |
| **P15** | 🎨 **Fashionista Fê** | Loja de cosméticos, outfits, títulos e personalização de personagem. |
| **P16** | 🌐 **Google Gabriel** | Login 1-clique com Supabase Google OAuth + criação atômica de Keypair Stellar Ed25519. |

---

## 3. Matriz de Cobertura Crítica por Domínio

### 3.1 Autenticação e Carteiras (`AUTH-01` a `AUTH-08`)
- Validar geração automática de par de chaves Stellar Ed25519 atrelado ao `google_uid`.
- Garantir que a restauração de conta recupere o `stellar_address` e progresso do banco sem sobrescrever a chave existente.
- Garantir isolamento: transações on-chain continuam usando assinaturas criptográficas Ed25519 nativas.

### 3.2 Combate e PvP (`PVP-01` a `PVP-10`)
- Validar cálculo matemático de dano baseado em classe (Guerreiro escalando com STR, Ranger com AGI/Range, Mago com INT).
- Fim de one-shot kill: validar que magias básicas e supremas respeitam porcentagens saudáveis de HP máximo do alvo.
- Validar alcance (range) autoritativo no servidor antes de aplicar qualquer efeito de dano.

### 3.3 Store Zustand (`ST-01` a `ST-12`)
- `addExperience`: conferir cálculo de limiar e level-up sem extrapolar nível máximo.
- `castSpell` / `castSpellSlot`: validar bloqueio quando mana insuficiente ou em cooldown.
- `buyPotions` e inventário: garantir regras de saldo e capacidade máxima.

---

## 4. Comandos e Execução de Testes

```bash
# Rodar todos os testes unitários via Vitest
npm run test

# Rodar arquivo específico
npx vitest run src/pvp/pvpEngine.test.ts

# Rodar com cobertura de código
npx vitest run --coverage
```

## 5. Checklist para Novos Testes
1. [ ] A qual persona o teste pertence?
2. [ ] O teste depende de aleatoriedade ou tempo? Se sim, fixar seed ou fake timers.
3. [ ] Os mocks de rede (Stellar, Supabase, Google) estão devidamente configurados?
4. [ ] O teste cobre o caminho feliz e os principais casos de borda (edge cases e payloads inválidos)?
5. [ ] O nome do teste está claro e padronizado em Português do Brasil?
