# BEN — Agente de Onboarding Bendini Logística

Assistente IA para Gestores de Unidade Móvel da Bendini.

## Funcionalidades
- 💬 Chat IA com todas as regras e procedimentos
- 🚀 Onboarding passo a passo (8 etapas)
- ✅ Checklist de viagem (20 itens)
- 🧠 Quiz de avaliação (8 questões)

---

## Deploy na Vercel (recomendado)

### Opção 1 — Via GitHub (mais fácil)
1. Crie um repositório no GitHub e suba esta pasta
2. Acesse [vercel.com](https://vercel.com) e faça login
3. Clique em **"Add New Project"**
4. Importe o repositório do GitHub
5. Deixe as configurações padrão (Vercel detecta Vite automaticamente)
6. Clique em **"Deploy"**
7. Pronto! Você receberá uma URL como `bendini-agente.vercel.app`

### Opção 2 — Via Vercel CLI
```bash
npm install -g vercel
npm install
vercel
```

---

## Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com) e faça login
2. Clique em **"Add new site" → "Deploy manually"**
3. Rode localmente:
   ```bash
   npm install
   npm run build
   ```
4. Arraste a pasta `dist/` para o Netlify
5. Pronto!

---

## Rodar localmente
```bash
npm install
npm run dev
```
Acesse: http://localhost:5173

---

## ⚠️ Importante — Chave da API
O agente usa a API da Anthropic. A chave já está configurada para funcionar
no ambiente do Claude.ai. Para usar em produção independente, você precisará:

1. Criar uma conta em [console.anthropic.com](https://console.anthropic.com)
2. Gerar uma API Key
3. Criar um arquivo `.env` na raiz:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Atualizar o fetch em `src/App.jsx` para incluir o header:
   ```js
   "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
   "anthropic-version": "2023-06-01",
   "anthropic-dangerous-direct-browser-access": "true"
   ```
5. Na Vercel/Netlify, adicionar a variável de ambiente nas configurações do projeto

---

Desenvolvido para a Bendini Logística · Penha/SC
