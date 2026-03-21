
## Multi-Provider AI — Redução de Custos v1.0

### O que será feito

Migrar 5 das 6 Edge Functions para provedores diretos (Groq, Google AI, OpenAI), mantendo `generate-screen-mockup` inalterada. Adicionar fallback automático Groq → Gemini. Criar arquivo `_shared/ai-providers.ts` com helpers reutilizáveis. Atualizar SettingsPage com seção de provedores. Atualizar `.env.example`.

### Pré-requisito: Adicionar 3 secrets no backend

Após aprovação, o usuário precisará adicionar no painel do backend (Lovable Cloud → Secrets):
- `GROQ_API_KEY` — em console.groq.com (tier gratuito disponível)
- `GOOGLE_AI_KEY` — em aistudio.google.com/apikey (tier gratuito: 1.500 req/dia)
- `OPENAI_API_KEY` — em platform.openai.com/api-keys (pago, mas GPT-4o mini é muito barato)

`LOVABLE_API_KEY` já existe e continua sendo usado apenas em `generate-screen-mockup`.

---

### Arquivos alterados

**1. `supabase/functions/_shared/ai-providers.ts`** (novo)
- `callAIWithFallback(systemPrompt, userPrompt, maxTokens, temperature)` — tenta Groq 70B, faz fallback automático para Gemini 2.0 Flash se rate limit (429)
- `callGemini(prompt, options)` — Google AI direto com formato nativo
- `callOpenAIWithTools(systemPrompt, userPrompt, tools, toolChoice)` — OpenAI com tool calling

**2. `supabase/functions/refine-idea/index.ts`**
- Trocar `LOVABLE_API_KEY` + gateway por `callAIWithFallback` com modelo `llama-3.1-8b-instant` (Groq 8B)
- Remover verificação de 402, ajustar mensagem 429 para Groq

**3. `supabase/functions/generate-prompt/index.ts`**
- Trocar fetch do gateway por `callAIWithFallback` com Groq 70B + fallback Gemini
- `max_tokens: 4096`, `temperature: 0.6`
- Remover verificação de 402

**4. `supabase/functions/generate-ai-content/index.ts`**
- Trocar gateway por `callGemini()` direto (Google AI nativo)
- Formato de resposta muda: `candidates[0].content.parts[0].text` em vez de `choices[0].message.content`
- Remover `modelForContentType` (não mais necessário)
- Tratar erros 403 (chave inválida), 429 (rate limit)

**5. `supabase/functions/evaluate-project/index.ts`**
- Trocar gateway por OpenAI API diretamente (`gpt-4o-mini`)
- Manter todo o schema de `tools` e `tool_choice` — apenas a URL, key e model mudam
- `temperature: 0.3`, `max_tokens: 2000`
- Erros 401/402 → mensagem sobre OPENAI_API_KEY

**6. `supabase/functions/review-project/index.ts`**
- Trocar gateway por `callAIWithFallback` com Groq 70B + fallback Gemini
- `temperature: 0.5`, `max_tokens: 4096`
- Manter tool calling para `submit_review_findings` intacto

**7. `supabase/functions/generate-screen-mockup/index.ts`** — NÃO ALTERAR

**8. `src/pages/app/SettingsPage.tsx`**
- Adicionar `AIProvidersSection` componente (visual only, sem formulário)
- 4 linhas de provedores: Groq (gratuito), Google AI (gratuito), OpenAI (pago), Lovable Gateway (mockups)
- Inserir na coluna direita do grid, logo abaixo de `AIPreferencesSection`
- Import `Zap` já existe; adicionar se necessário

**9. `.env.example`**
- Adicionar as 3 novas keys documentadas com comentários PT-BR

---

### Nota sobre review-project + tool calling no Groq

`review-project` usa `tool_choice` com tool calling. Groq suporta function calling, porém o fallback `callAIWithFallback` retorna texto puro. Para esta função, o tool calling será feito diretamente no Groq com fallback apenas para texto simples se necessário. Alternativa mais robusta: usar diretamente `callGroq` com o corpo completo incluindo `tools`.

### Economia esperada
- Before: tudo via Lovable Gateway com markup
- After: Groq free tier + Google AI free tier + OpenAI gpt-4o-mini (baratíssimo)
- Estimativa: 65-70% de redução de custo
