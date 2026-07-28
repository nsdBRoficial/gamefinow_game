# ⚔️ DOCUMENTO DE ESTRATÉGIA, ARQUITETURA E DESIGN DO SISTEMA DE BATALHAS (v1.0)

**Projeto:** GameFiNow  
**Data:** 28 de Julho de 2026  
**Status:** Proposta de Arquitetura & Especificação Técnica  
**Autor:** Arquiteto de Software Sênior & Equipe Web3/GameDev  

---

## 📋 EXECUTIVE SUMMARY

O **GameFiNow** encontra-se na transição da sua fase de exploração e onboarding Web3 para o ecossistema de **gameplay ativo e economia de combate (PVE & PVP)**. Com a infraestrutura de carteiras Stellar, atributos RPG (`level`, `hp`, `maxHp`, `attack`, `defense`, `speed`), tokens (`GAMEFI`, `USDW`, `BRW`, `XLM`), backend Socket.io e painel de GM já operacionais, o próximo grande pilar do jogo é a implementação do **Sistema de Batalhas**.

Este documento apresenta uma análise aprofundada de **5 modelos de arquitetura de batalha**, comparando mecânicas, experiência do usuário (UX), impacto na sincronização multiplayer em tempo real, integração com a blockchain Stellar/Soroban e um roteiro claro de implementação em fases.

---

## 📊 MATRIZ COMPARATIVA DOS MODELOS DE BATALHA

| Modelo de Batalha | Estilo de Referência | Complexidade de Rede | Integração Web3 / Soroban | Fator Imersão MMO | Risco de Trapaça / Latência |
|---|---|---|---|---|---|
| **1. Arena por Turnos (ATB)** | *Final Fantasy VII / Pokémon* | 🟢 Baixa (Eventos Determinísticos) | 🟢 Alta (Drops & Drops On-Chain) | 🟡 Média (Transição de Tela) | 🟢 Mínimo |
| **2. Target Real-Time com Hotkeys** | *Tibia / Ragnarok Online* | 🟡 Média (Ticks no Servidor) | 🟢 Alta (Loot Pool Continuo) | 🟢 Excelente (Mapa Aberto) | 🟡 Médio (Exige Server-Tick) |
| **3. Action RPG (Hack & Slash)** | *Zelda / Secret of Mana* | 🔴 Alta (Hitboxes Criptográficas) | 🟡 Média (Durabilidade de NFTs) | 🟢 Excelente (Ação Direta) | 🔴 Alto (Sensível a Ping) |
| **4. Batalha Tática em Grid** | *Dofus / FF Tactics* | 🟢 Baixa (Ações por Célula) | 🟢 Máxima (Apostas PvP Soroban) | 🟡 Média (Modo Instanciado) | 🟢 Mínimo |
| **5. Autobattler On-Chain** | *Auto-Chess / AFK Arena* | 🟢 Zero (Execução Local / Backend) | 🟢 Total (100% Soroban Contract) | 🔴 Baixa (Foco em Prep) | 🟢 Zero (Auditável On-Chain) |

---

## 🕹️ ANÁLISE DETALHADA DAS 5 PROPOSTAS DE BATALHA

---

### 🟢 PROPOSTA 1: Arena por Turnos Instanciada (Estilo Final Fantasy VII / Pokémon)

#### 1. Mecânica de Gameplay
- Ao colidir com um mob no mapa (Slime/Blob, Worm, Bee, Crab, Snake) ou aceitar um duelo PvP, a tela realiza um efeito retro de transição para uma **Arena de Batalha 2D dedicada**.
- Cada participante possui uma barra de tempo de ação (**ATB - Active Time Battle**) ou turnos alternados baseados no atributo **Agilidade (AGI/Speed)**.
- **Menu de Ações**:
  - ⚔️ **Atacar**: Executa dano físico baseado no atributo `FOR (STR)`.
  - 🪄 **Habilidade / Feitiço**: Consome MP/Energia e aplica efeitos baseados em `INT` ou `FÉ (Sincronia Stellar)`.
  - 🎒 **Item / Poção**: Usa itens do inventário Web3 (ex: Poção de HP compativel com token).
  - 🛡️ **Defender**: Reduz o dano recebido no próximo turno em 50%.
  - 🏃 **Fugir**: Chance de escapar da batalha (apenas PvE).

#### 2. Integração Web3 & Soroban
- Vencer batalhas confere recompensas em **Tokens GAMEFI** e **EXP**.
- Vitórias contra chefes (Bosses) podem acionar o contrato Soroban para mintar **NFTs de Equipamento/Loot** ou transferir micro-recompensas diretamente para a carteira Stellar do jogador.

#### 3. Prós & Contras
- **Vantagens**:
  - Determinístico e livre de dessincronias por lag de internet.
  - Excelente para exibir animações estilizadas de magias e efeitos Web3.
  - Baixíssimo consumo de banda no WebSocket do Socket.io.
- **Desvantagens**:
  - Transição de tela pode interromper o fluxo de caminhada livre pelo mapa.

---

### 🟢 PROPOSTA 2: Combate Real-Time em Mapa Aberto com Targeting (Estilo Tibia / Ragnarok)

#### 1. Mecânica de Gameplay
- O combate ocorre **diretamente no mapa 2D**, sem telas de transição.
- O jogador clica com o mouse no mob/jogador para **Fixar Alvo (Target Lock)**, exibindo um retículo vermelho no inimigo.
- O ataque básico é executado automaticamente em intervalos definidos pelo atributo `AGI / Speed` quando dentro do alcance do ataque.
- **Barra de Atalhos (Hotkeys `1`, `2`, `3`, `4`, `Space`)**:
  - Atalhos para disparar magias à distância, curas instantâneas ou ataques especiais com tempo de recarga (*cooldown*).
- **Mecânica Co-op**: Múltiplos jogadores no mesmo mapa podem atacar o mesmo chefe ou mob simultaneamente.

#### 2. Integração Web3 & Soroban
- **Loot Pool Compartilhado / Individual**: O dano causado por cada jogador no mob/boss determina a proporção de moedas `GAMEFI` e itens dropados.
- **Cofre de Despojos**: Recompensas acumuladas no inventário podem ser convertidas em transações on-chain em lote (*batch withdrawal*).

#### 3. Prós & Contras
- **Vantagens**:
  - Mantém a imersão MMO contínua sem quebrar o ritmo da navegação.
  - Combate cooperativo natural entre jogadores que estão no mesmo ambiente.
  - Sensação autêntica de RPG clássico estilo Tibia/Ragnarok.
- **Desvantagens**:
  - Requer autoridade no servidor Node.js (tick-rate) para validar posições e evitar "ataques à distância falsos" (*ghost hits*).

---

### 🟡 PROPOSTA 3: Combate Action RPG Direcional (Estilo Zelda / Secret of Mana)

#### 1. Mecânica de Gameplay
- Movimentação livre em 8 direções. Pressionar a tecla de ataque (`Espaço` ou `J`) faz o personagem desferir um golpe de espada/corte na direção exata para a qual está olhando.
- Hitboxes geométricas no Canvas calculam se a lamina atingiu o mob.
- Inclui esquiva com tempo de invulnerabilidade (*Dash / Dodge Roll* com tecla `Shift`).

#### 2. Integração Web3 & Soroban
- Equipamentos possuem durabilidade. Cada golpe desferido reduz ligeiramente a durabilidade da espada NFT, exigindo manutenção no Bigorna/Customizer usando tokens `GAMEFI`.

#### 3. Prós & Contras
- **Vantagens**: Altamente dinâmico e focado na habilidade mecânica do jogador.
- **Desvantagens**: Exige latência extremamente baixa (< 50ms) no Socket.io para PvP; vulnerável a descolamentos de posição em conexões móveis.

---

### 🟢 PROPOSTA 4: Batalha Tática em Grade / Grid (Estilo Dofus / Final Fantasy Tactics)

#### 1. Mecânica de Gameplay
- Ao iniciar a batalha, uma área delimitada do mapa projeta uma **grade tática de casinhas (Grid 8x8 ou 10x10)**.
- Cada personagem possui **Pontos de Movimento (PM)** baseados na Agilidade e **Pontos de Ação (PA)** para usar ataques ou magias.
- Posicionamento estratégico (ataques pelas costas causam 1.5x de dano crítico; ataques de longe exigem Linha de Visão livre).

#### 2. Integração Web3 & Soroban
- **Modo Duelo com Aposta (Wager Match)**: Dois jogadores podem travar 10 XLM ou 100 GAMEFI em um contrato inteligente Soroban. O vencedor da partida tática recebe automaticamente o montante acumulado.

#### 3. Prós & Contras
- **Vantagens**: Ecorrem de forma 100% determinística; ideal para torneios competitivos PvP com recompensas financeiras em crypto.
- **Desvantagens**: Partidas podem ser mais longas e cadenciadas.

---

### 🟢 PROPOSTA 5: Autobattler On-Chain Auditável (Estilo Auto-Chess / AFK Arena)

#### 1. Mecânica de Gameplay
- O jogador prepara a sua ficha RPG no Passaporte (equipa armas, distribui pontos de Atributos `STR`, `INT`, `AGI`, `RES` e define uma estratégia de 3 magias prioritárias).
- Ao encontrar um inimigo, o sistema simula a batalha de forma veloz e visual (estilo rastro de animações).

#### 2. Integração Web3 & Soroban
- A lógica da batalha é executada **inteiramente dentro de um Smart Contract Soroban em Rust**.
- A seed de números aleatórios é derivada da própria hash do bloco Stellar, garantindo que o resultado do combate seja **100% auditável, impossível de adulterar e sem dependência de servidores centralizados**.

#### 3. Prós & Contras
- **Vantagens**: Segurança absoluta on-chain, ideal para minigames e combates assíncronos.
- **Desvantagens**: Menos controle direto do jogador no exato momento da luta.

---

## 🚀 RECOMENDAÇÃO ARQUITETÔNICA & PLANO DE IMPLEMENTAÇÃO

### 🏆 Modelo Recomendado: **Abordagem Híbrida (Proposta 2 + Proposta 1)**

Recomendamos uma implementação evolutiva em duas frentes:

1. **Fase 1 (PvE em Mapa Aberto - Estilo Tibia)**:
   - Manter o combate contra os mobs (Slimes, Worms, Bees, Crabs) diretamente no mapa 2D do `GameCanvas.tsx`.
   - Adicionar o **Target Lock (Seleção de Inimigo)** com contorno no mob e barra de HP flutuante.
   - Pressionar a tecla de ação/ataque ataca o mob travado, aplicando a fórmula de dano baseada nos atributos RPG já implementados (`STR`, `DEF`, `HP`).
   - Mobs derrotados dropam moedas `GAMEFI` e concedem `EXP`.

2. **Fase 2 (PvP & Boss Battles em Arena por Turnos - Estilo Final Fantasy VII)**:
   - Para duelos entre jogadores (PvP) ou batalhas contra Chefes Globais do mapa, abrir a **Modal de Arena de Batalha por Turnos**.
   - Garantir que a disputa seja justa, limpa e imune a lag de rede.

---

## 🛠️ ESPECIFICAÇÃO TÉCNICA E FÓRMULAS DE COMBATE

### 1. Cálculo de Dano Físico
$$\text{Dano Causado} = \max\left(1, \text{Ataque do Atacante} \times \left(1 + \frac{\text{STR}}{100}\right) - \frac{\text{DEF do Alvo}}{2}\right)$$

### 2. Cálculo de Dano Mágico
$$\text{Dano Mágico} = \text{Dano Base da Magia} \times \left(1 + \frac{\text{INT}}{80}\right) + \text{Bônus de Fé Stellar}$$

### 3. Frequência de Ataque (Cooldown em ms)
$$\text{Intervalo de Ataque (ms)} = \max\left(400, 1500 - (\text{AGI} \times 10)\right)$$

### 4. Fórmula de Recompensa de EXP & Loot
$$\text{EXP Ganhos} = \text{Level do Mob} \times 25 + (\text{HP Máximo do Mob} \times 0.1)$$
$$\text{Tokens Dropados (GAMEFI)} = \text{Random}(1, \text{Level do Mob}) \times \text{Multiplicador de Buffs}$$

---

## 📝 DECISÃO E PRÓXIMOS PASSOS

Este documento consolida todas as opções viáveis para tornar o **GameFiNow** um jogo com combate envolvente e economicamente sólido na Stellar.

- **Documento Salvo em**: [`DOC_ESTRATEGIA_BATALHAS.md`](file:///c:/Users/Usu%C3%A1rio/Documents/GitHub/gamefinow_game/DOC_ESTRATEGIA_BATALHAS.md)

Estou pronto para prosseguir com a arquitetura e desenvolvimento da **Fase 1 (Combate PvE em Tempo Real estilo Tibia)** assim que você aprovar a estratégia!
