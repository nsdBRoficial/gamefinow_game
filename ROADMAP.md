# GameFiNow - Roadmap de Funcionalidades

O jogo está atualmente consolidado com a sua Engine de Batalhas Fase 1, integração básica Web3 On-ramp via Stellar Testnet e Otimizações de Loop de Jogo 2D. 

Abaixo listamos as funcionalidades que já estão documentadas, mas que serão implementadas nas próximas grandes iterações do desenvolvimento:

## 1. Combate PvP / Boss Avançado (Fase 2)
- **Arena por Turnos (Estilo Final Fantasy/Pokémon):** Transição de tela durante o engajamento com chefes ou outros jogadores (`TurnBattleModal.tsx`).
- **ATB (Active Time Battle):** Barra de tempo para ações sequenciais.
- **WagerPvP Soroban:** Contrato Inteligente para depósito e aposta entre dois jogadores para batalhas diretas na Arena, com a resolução feita On-Chain.

## 2. Sistema de Drops Avançado e Inventário
- **Drop Tables Estendidos:** Monstros droparão materiais complexos (Ex: Safira Brilhante, Pérola do Mar) além do Ouro/XP padrão.
- **Inventário Web3:** Integração da `backpack` com os tokens e NFTs do jogo, salvos em banco de dados e on-chain.
- **Sistema de Fadiga (Anti-Bot):** Variável `energy_stamina` aplicada para coibir uso de macros, reduzindo o XP em 70% caso a Stamina seja zerada.

## 3. Música e Efeitos Específicos
- **SFX Extensos:** Sons dinâmicos baseados no golpe (`sound_hit_sword`, `sound_hit_magic`) em substituição ao atual beep sintetizado genérico.
- **BGM (Background Music):** Música em loop que muda dependendo da região (Centro, Norte, Vulcão, Floresta) e na ativação da Tela de Combate por turnos.

## 4. Integração Contínua Soroban
- **LootDistributor.soroban:** Distribuir recompensas semanais baseadas no leaderboard de monstros abatidos por jogador, exigindo conexão e verificação de assinatura da rede Stellar via Freighter/WalletNow.

---
*Roadmap gerado em auditoria de QA e performance. Para implementar estas funções, consulte os documentos `DOC_REQUISITOS_BATALHAS.md` e `DOC_EVOLUCAO_E_DROPS.md`.*
