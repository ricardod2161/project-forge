
## M13 — Revisão Automática por IA

### O que existe hoje
- Aba "Revisão IA" na `ProjectDetailPage` exibe apenas um `EmptyTab` estático
- Nenhuma Edge Function existe no projeto ainda (`supabase/functions/` vazio)
- `LOVABLE_API_KEY` já está disponível como secret no Supabase
- Estrutura do projeto (`Project` type) contém todos os campos necessários para análise

### O que será construído

**1. Edge Function `review-project`**
- Recebe `{ project_id }` no body
- Valida JWT via `supabase` client (Authorization header)
- Busca os dados do projeto na tabela `projects` (título, tipo, nicho, features, integrations, audience, monetização, complexidade, ideia original)
- Monta um prompt de sistema especializado em arquitetura de software
- Chama o Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) com `google/gemini-3-flash-preview`
- Usa tool calling para obter JSON estruturado com array de `findings`:
  ```ts
  interface Finding {
    category: "lacuna" | "inconsistencia" | "melhoria" | "risco"
    severity: "critico" | "importante" | "sugestao"
    title: string
    description: string
    recommendation: string
  }
  ```
- Trata erros 429 e 402 do AI Gateway com mensagens claras
- CORS headers em todas as respostas

**2. Hook `useProjectReview` no frontend**
- `useMutation` que chama a edge function via `supabase.functions.invoke("review-project", { body: { project_id } })`
- Armazena o resultado em estado local (não persiste no banco — análise sob demanda)
- Retorna `{ findings, isLoading, error, mutate }`

**3. Componente `AIReviewTab` em `ProjectDetailPage`**

Estado inicial: painel com botão "Analisar Projeto com IA" + descrição do que a análise faz.

Durante análise: skeleton loader com `AIStreamingIndicator` já existente.

Após análise: lista de findings categorizados com:
- Badge de severidade colorido: Crítico (vermelho), Importante (amarelo), Sugestão (verde/azul)
- Badge de categoria: Lacuna, Inconsistência, Melhoria, Risco
- Título e descrição do problema
- Recomendação em destaque
- Contadores no topo: "3 Críticos · 5 Importantes · 8 Sugestões"
- Filtro por severidade (chips clicáveis)
- Botão "Reanalisar" para nova execução

Erros rate limit / créditos: toast com mensagem clara em português.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/review-project/index.ts` | Criar — Edge Function completa |
| `supabase/config.toml` | Editar — adicionar bloco `[functions.review-project]` |
| `src/pages/app/ProjectDetailPage.tsx` | Editar — substituir `EmptyTab` da aba "ai" por `AIReviewTab` funcional |

### Detalhes do prompt de IA (Edge Function)

O system prompt instrui o modelo a agir como arquiteto sênior de software, analisando:
- Completude dos requisitos (há funcionalidades críticas faltando para o tipo de sistema?)
- Inconsistências entre campos (ex: tipo SaaS mas sem monetização definida)
- Riscos técnicos baseados em complexidade vs features vs integrações
- Lacunas comuns em projetos desse nicho específico
- Melhorias de escopo e posicionamento

O modelo retorna via tool calling um array estruturado — sem alucinações de formato.

### Ordem de execução
1. Edge Function `review-project` + `config.toml`
2. Componente `AIReviewTab` com hook integrado
3. Substituir aba "ai" na `ProjectDetailPage`
