# 🚀 Guia de Deploy e Configuração na Vercel — GameFiNow

Este guia assegura que a versão de produção na **Vercel** funcione com 100% de integridade para todos os jogadores online, combate PvP e persistência na rede Stellar.

---

## 1. Conexão do Repositório
- O repositório [`nsdBRoficial/gamefinow_game`](https://github.com/nsdBRoficial/gamefinow_game) já está sincronizado na branch **`main`**.
- A cada novo push na branch `main`, a Vercel dispara o deployment automático.

---

## 2. Configurações de Build na Vercel
Ao importar ou revisar o projeto no Dashboard da Vercel:
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build` (ou `vite build`)
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node.js Version:** `18.x` ou `20.x` (compatível com React 19 e Vite 6)

---

## 3. Variáveis de Ambiente (Environment Variables)
No Dashboard da Vercel em **Settings → Environment Variables**, certifique-se de configurar as seguintes variáveis para o ambiente **Production** (e **Preview**):

| Variável | Valor Recomendado / Descrição |
|---|---|
| `VITE_BACKEND_URL` | URL pública do backend WebSocket (ex: `https://seu-backend-gamefinow.up.railway.app` ou `https://seu-backend.onrender.com`). Caso esteja em teste local, fallback é `http://localhost:3001` |
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase (ex: `https://ztpspitdagsligdkjufk.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` do Supabase |
| `VITE_STELLAR_NETWORK` | `testnet` |
| `VITE_HORIZON_URL` | `https://horizon-testnet.stellar.org` |
| `VITE_GAMEFI_TREASURY_PUBLIC_KEY` | Chave pública da Tesouraria GameFiNow |
| `VITE_GAMEFI_TOKEN_CODE` | `GAMEFI` |
| `VITE_GAMEFI_TOKEN_ISSUER` | Chave emissora do token GAMEFI |
| `VITE_GAMEFI_FEE_PERCENTAGE` | `0.005` |

> ⚠️ **Nota sobre WebSocket no Deploy:** A Vercel é especializada na hospedagem estática e serverless do Frontend. Para que os jogadores na web se vejam e batalhem em tempo real na internet, o backend Socket.io (`src/server.ts`) deve estar rodando em um serviço com suporte a conexões WebSocket contínuas (ex: Railway, Render, VPS ou Fly.io), e sua URL pública apontada em `VITE_BACKEND_URL`.

---

## 4. Arquivos de Roteamento SPA
O arquivo [`vercel.json`](file:///c:/Users/Usuário/Documents/GitHub/gamefinow_game/vercel.json) já está configurado na raiz com a regra de rewrite:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Isso impede erros `404 Not Found` ao recarregar a página em qualquer rota interna.
