
## Análise Completa do Codebase — Diagnóstico Real

**O que já está implementado e funcionando (não mexer):**
- `useProjectWizard`: `isSubmitting` já está FORA do `partialize` — item 1.3 já resolvido
- `AppSidebar`: botão "Novo Projeto" já existe e funciona em collapsed E expanded — item 3.2 já resolvido
- `AppHeader`: `useEffect` com `keydown` para cmd+K já existe, hint `⌘K` já aparece — item 3.1 já resolvido
- `ProjectsPage`: busca, filtros de status, ordenação e debounce já implementados — itens 2.9 e 4.2 já resolvidos
- `SettingsPage`: `SecuritySection` (resetPassword), `PlanSection`, `AppearanceSection` já existem — partes de 2.7 já resolvidas
- `ExportsPage`: já tem exportação Markdown E JSON — 2.8 parcialmente resolvido (falta incluir prompts)
- `EvaluationsPage`: já tem cards de score + `EvaluateButton`
- `ProjectDetailPage`: já tem tab "Avaliação" com `RadarChart` + dimensões detalhadas + prioridades (mas salvando só em memória, não em tabela dedicada)

**Bugs e lacunas reais identificados:**

**CRÍTICO:**
- `next-themes` está em `package.json` e importado em `src/components/ui/sonner.tsx` — não pode ser simplesmente removido sem substituir o `useTheme`
- `tsconfig.app.json`: `strict: false`, `noImplicitAny: false` — risco de bugs silenciosos
- `generate-prompt/index.ts`: usa `google/gemini-3-flash-preview` + prompt exige apenas "400 palavras" — qualidade baixa
- `useAllUserPrompts` e `useAllVersions` em `useProjectDetail.ts`: não usam `useAuth()` — dependem só de RLS
- `ProjectDetailPage`: usa Skeleton local (`const Skeleton = ...`) em vez de `@/components/ui/skeleton`
- `EvaluationsPage`: usa Skeleton local em vez do shadcn
- `App.tsx`: sem `React.lazy` — todas as 11 páginas do `/app/**` carregam no bundle inicial, sem `Suspense`
- `QueryClient`: sem `refetchOnWindowFocus: false` — refetch desnecessário ao voltar ao tab
- `useProjects`: não inclui `prompts(count)` na query — `ProjectCard` sempre recebe `promptsCount=0`

**IMPORTANTES:**
- `NewProjectPage`: nenhuma validação por etapa — usuário pode avançar com campos vazios
- `SettingsPage`: falta seção "Preferências de IA" (salvar em `profiles.preferences`)
- `SettingsPage`: falta "Zona de Perigo" com exclusão de conta
- `ExportsPage`: exportação não inclui prompts gerados
- `ProjectDetailPage`: tab "Prompts" mostra lista simples, sem sub-abas por tipo (10 tipos) e sem botão "Gerar" inline por tipo
- `EvaluationsPage`: mostra apenas score total, sem dimensões detalhadas (essas existem só na aba do projeto)
- Tabela `evaluations` não existe — scores por dimensão não persistem; avaliação recalcula sempre do zero
- Sem `useDuplicateProject` em `useProjects.ts`
- Sem auto-save com indicador visual no wizard
- Sem barra de limite do plano Free no `AppLayout`
- `App.tsx`: sem `ErrorBoundary`

**MENORES:**
- `useProjectWizard` partialize: `isSubmitting` já está excluído — confirmado OK
- `src/components/ui/sonner.tsx`: usa `useTheme` do `next-themes` — precisa de wrapper para não quebrar ao remover
- `.env.example` não existe
- `README.md` genérico

---

## Plano de Execução — 6 Blocos Sequenciais

### Bloco 1 — Correções críticas de qualidade e segurança
**Arquivos:** `tsconfig.app.json`, `src/App.tsx`, `src/hooks/useProjectDetail.ts`, `src/components/ui/sonner.tsx`

1.1 **TypeScript strict mode** — ativar `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Corrigir erros resultantes em todos os arquivos (substituir `any` por tipos explícitos, remover imports não usados, adicionar tipos em parâmetros de função).

1.2 **`next-themes`** — `sonner.tsx` usa `useTheme` do `next-themes`. Substituir por `useAppTheme` para remover a dependência. Depois anotar no `package.json` para remoção.

1.3 **`refetchOnWindowFocus: false`** no `QueryClient` em `App.tsx`.

1.4 **`React.lazy` + `Suspense`** para todas as páginas `/app/**` em `App.tsx`. Criar `PageSkeleton` minimalista.

1.5 **`useAllUserPrompts` e `useAllVersions`** — adicionar `useAuth()` + filtro `user_id` explícito + `enabled: !!user?.id`.

1.6 **`useUpdateProject`** — criar tipo explícito `ProjectUpdatePayload` em vez do cast `as Record<string, unknown>`.

### Bloco 2 — Persistência de avaliações (tabela evaluations)
**Arquivos:** `supabase/migrations/[ts]_evaluations.sql`, `src/hooks/useProjectDetail.ts`, `supabase/functions/evaluate-project/index.ts`

2.1 **Migration SQL** para criar `public.evaluations` com `id`, `project_id`, `user_id`, `overall_score`, `dimensions` (JSONB), `summary`, `top_priorities` (JSONB), `created_at`. RLS com `is_project_owner`. Índices em `project_id` e `user_id`.

2.2 **Atualizar `evaluate-project`** para salvar na tabela `evaluations` além de atualizar `projects.quality_score`.

2.3 **Criar `useProjectEvaluation(projectId)`** em `useProjectDetail.ts` que busca a avaliação mais recente da tabela `evaluations`.

2.4 **`EvalTab` em `ProjectDetailPage`** — carregar dados de `useProjectEvaluation` (persistido) em vez de estado local. Manter o visual atual (RadarChart + dimensões + prioridades).

2.5 **`EvaluationsPage`** — expandir cards dos projetos avaliados para mostrar dimensões da última avaliação (mini progress bars por dimensão, top_priorities). Substituir Skeleton local por `import { Skeleton } from "@/components/ui/skeleton"`.

### Bloco 3 — Funcionalidades no Wizard e ProjectCard
**Arquivos:** `src/pages/app/NewProjectPage.tsx`, `src/hooks/useProjects.ts`, `src/components/ProjectCard.tsx`

3.1 **Validação por etapa no Wizard:**
- Etapa 1: `nextStep()` só se `idea.trim().length >= 30` — contador inline `X/30 chars`
- Etapa 2: `nextStep()` só se `type && niche && platform` — highlight warning em cards não selecionados
- Etapa 3: `nextStep()` só se `audience.trim().length >= 10`
- Etapa 4: mensagens rotativas durante `isSubmitting`

3.2 **Auto-save com indicador visual** no wizard — `lastSaved` state + debounce 800ms + badge sutil "Salvo automaticamente".

3.3 **`useProjects`** — modificar query para incluir `prompts(count)` e mapear `prompts_count` no tipo `Project`.

3.4 **`useDuplicateProject`** em `useProjects.ts` — buscar projeto, criar cópia com ` (Cópia)` no título e `status: draft`. `ProjectCard` — adicionar opção "Duplicar" no dropdown de ações.

### Bloco 4 — SettingsPage completo + ExportsPage
**Arquivos:** `src/pages/app/SettingsPage.tsx`, `src/pages/app/ExportsPage.tsx`

4.1 **SettingsPage — Preferências de IA:**
- Select "Nível de detalhe" (Resumido | Completo | Máximo detalhe)
- Toggle "Sugestões proativas no Dashboard"
- Persistir em `profiles.preferences` via mutation

4.2 **SettingsPage — Zona de Perigo:**
- Botão "Excluir minha conta" com `AlertDialog` que exige digitar o email
- Chamar `supabase.auth.signOut()` + toast informando que a exclusão está em processamento (conta real requer admin SDK via Edge Function — mostrar UI adequada sem prometer exclusão imediata)

4.3 **ExportsPage — incluir prompts:**
- `useProjectPrompts` no ExportsPage
- Nova opção de export "Prompts" — concatena todos os prompts do projeto com seções por tipo, versão, tokens e data
- Adicionar terceiro botão no format toggle: `markdown | json | prompts`

### Bloco 5 — PromptsTab inline por tipo + Skeletons
**Arquivos:** `src/pages/app/ProjectDetailPage.tsx`

5.1 **`PromptsTab`** — redesign completo com sub-abas horizontais por tipo (10 tipos: master, frontend, backend, database, dashboard, mvp, premium, correction, refactoring, multiplatform):
- Badge por tipo: "Não gerado" (cinza) / "Gerado" (verde, mostrando versão)
- Botão "Gerar" (primeira vez) / "Regenerar" (já existe)
- Área de preview com font mono + botão "Copiar"
- Tokens estimados no footer de cada prompt
- Chamada `supabase.functions.invoke("generate-prompt", { body: { project_id, prompt_type } })`

5.2 **`AnimatePresence`** nas trocas de aba — envolver conteúdo com `motion.div` `key={activeTab}`.

5.3 **Substituir Skeleton local** em `ProjectDetailPage` e `EvaluationsPage` por `import { Skeleton } from "@/components/ui/skeleton"`.

5.4 **Barra de limite Free** em `AppLayout`:
- Buscar `profile.plan` e métricas
- Se `plan === "free"`: mostrar banner discreto no topo do `main` com progresso "X/3 projetos"

### Bloco 6 — Documentação e Edge Function de qualidade
**Arquivos:** `.env.example`, `README.md`, `supabase/functions/generate-prompt/index.ts`

6.1 **`generate-prompt`** — upgrade de qualidade:
- Modelo: `google/gemini-2.5-flash` (mais capaz)
- Prompt: exigir mínimo 900 palavras, estruturado nas 7 seções definidas (CONTEXTO / STACK / MÓDULOS / BANCO / REGRAS / COMPORTAMENTO / ENTREGA)
- `systemPrompt`: adicionar instrução explícita de estrutura e formato

6.2 **CORS `allowedOrigin`** — lê `ALLOWED_ORIGIN` do env (fallback `"*"`) em todas as 6 Edge Functions

6.3 **`.env.example`** criado e documentado

6.4 **`README.md`** atualizado com setup real

---

## Tabela de arquivos por bloco

| Bloco | Arquivo | Tipo |
|---|---|---|
| 1 | `tsconfig.app.json` | Editar |
| 1 | `src/App.tsx` | Editar — lazy + Suspense + refetchOnWindowFocus |
| 1 | `src/components/ui/sonner.tsx` | Editar — trocar next-themes por useAppTheme |
| 1 | `src/hooks/useProjectDetail.ts` | Editar — tipos + auth em all-prompts/all-versions |
| 2 | `supabase/migrations/[ts]_evaluations.sql` | Criar |
| 2 | `supabase/functions/evaluate-project/index.ts` | Editar — salvar em evaluations |
| 2 | `src/hooks/useProjectDetail.ts` | Editar — useProjectEvaluation hook |
| 2 | `src/pages/app/EvaluationsPage.tsx` | Editar — dimensões + Skeleton correto |
| 2 | `src/pages/app/ProjectDetailPage.tsx` | Editar — EvalTab usa dados persistidos |
| 3 | `src/pages/app/NewProjectPage.tsx` | Editar — validação por etapa + auto-save |
| 3 | `src/hooks/useProjects.ts` | Editar — prompts(count) + useDuplicateProject |
| 3 | `src/components/ProjectCard.tsx` | Editar — promptsCount real + duplicar |
| 4 | `src/pages/app/SettingsPage.tsx` | Editar — prefs IA + zona de perigo |
| 4 | `src/pages/app/ExportsPage.tsx` | Editar — incluir prompts na exportação |
| 5 | `src/pages/app/ProjectDetailPage.tsx` | Editar — PromptsTab + AnimatePresence + Skeleton |
| 5 | `src/layouts/AppLayout.tsx` | Editar — barra Free |
| 6 | `supabase/functions/generate-prompt/index.ts` | Editar — modelo melhor + estrutura 900 palavras |
| 6 | todas as 6 Edge Functions | Editar — CORS allowedOrigin |
| 6 | `.env.example` | Criar |
| 6 | `README.md` | Editar |

**Ordem de execução:** Bloco 1 → 2 → 3 → 4 → 5 → 6. Migration do Bloco 2 antes de qualquer código que depende da tabela `evaluations`.
