
## Plano — Etapa 3: Banco de Dados + Dashboard com dados reais + Wizard completo

### O que existe hoje
- Apenas tabela `profiles` no banco
- `DashboardPage` com métricas hardcoded (zeros)
- `NewProjectPage` com apenas Etapa 1 estática, sem state management e sem salvar
- `ProjectsPage` sem listagem real
- `ProjectCard` com interface tipada mas sem dados

---

### 1. Migração do Banco de Dados

Criar uma migration SQL com as 5 tabelas solicitadas + triggers:

**`projects`**
```sql
id, user_id, title, slug, description, original_idea, type, niche,
status (draft/active/archived), quality_score, is_favorite, metadata (jsonb),
created_at, updated_at
```
RLS: SELECT/INSERT/UPDATE/DELETE filtrado por `auth.uid() = user_id`

**`prompts`**
```sql
id, project_id, user_id, type, title, content, platform, version,
tokens_estimate, created_at, updated_at
```
RLS: via `user_id`

**`project_versions`**
```sql
id, project_id, version_number, snapshot (jsonb), changes_summary,
generated_by_ai, ai_observations, created_at, updated_at
```
RLS: join com projects para verificar user_id

**`templates`**
```sql
id, niche, title, description, preview_image, content (jsonb),
is_featured, usage_count, created_at, updated_at
```
RLS: SELECT público (templates são compartilhados)

**`activity_logs`**
```sql
id, user_id, project_id, action, entity_type, entity_id, metadata (jsonb), created_at
```
RLS: por `user_id`

Triggers `updated_at` em todas as tabelas que têm esse campo.

---

### 2. Hook `useProjects`

Criar `src/hooks/useProjects.ts` com React Query:
- `useProjectMetrics()` — queries para `count(*)` de projects e prompts por usuário
- `useRecentProjects()` — 6 projetos mais recentes ordenados por `updated_at`
- `useCreateProject()` — mutation para inserir na tabela `projects`

---

### 3. Dashboard com dados reais

**`DashboardPage.tsx`** refatorado:
- Métricas via `useProjectMetrics()` com skeleton loader durante loading
- Seção "Projetos Recentes" com grid de `ProjectCard` (máx 6)
- Estado vazio (sem projetos): ilustração + CTA — mostrado condicionalmente
- Números animados com `framer-motion` count-up

---

### 4. Wizard de Criação de Projeto (4 etapas completas)

**Hook `src/hooks/useProjectWizard.ts`** com Zustand:
```ts
interface WizardState {
  currentStep: number        // 0-3
  idea: string               // etapa 1
  type: string               // etapa 2
  niche: string              // etapa 2
  complexity: number         // etapa 2
  platform: string           // etapa 2
  audience: string           // etapa 3
  features: string[]         // etapa 3
  monetization: string       // etapa 3
  integrations: string[]     // etapa 3
  isSubmitting: boolean
}
```
Auto-save no `localStorage` via middleware Zustand `persist`.

**`NewProjectPage.tsx`** completamente reescrito com as 4 etapas:

- **Etapa 1 — Ideia**: textarea grande, contador de chars, botões Próximo/Voltar
- **Etapa 2 — Classificação**: cards clicáveis para tipo (SaaS/App/ERP/etc), grid de chips para nicho, slider de complexidade (1-5), chips de plataforma alvo
- **Etapa 3 — Detalhamento**: público-alvo (textarea), funcionalidades (input + chips removíveis), modelo de monetização (radio cards), integrações (chips)
- **Etapa 4 — Confirmação**: preview de todas as escolhas + botão "Criar Projeto" com loading state

Ao confirmar: insert na tabela `projects` via `useCreateProject()` → redireciona para `/app/projetos/:id`.

**`ProjectsPage.tsx`** atualizada para listar projetos reais com skeleton + empty state.

---

### Arquivos criados/modificados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/[timestamp]_core_tables.sql` | Criar — 5 tabelas + RLS + triggers |
| `src/hooks/useProjects.ts` | Criar — React Query hooks |
| `src/hooks/useProjectWizard.ts` | Criar — Zustand store do wizard |
| `src/pages/app/DashboardPage.tsx` | Reescrever — métricas reais + projetos recentes |
| `src/pages/app/NewProjectPage.tsx` | Reescrever — wizard 4 etapas funcional |
| `src/pages/app/ProjectsPage.tsx` | Reescrever — listagem real com skeleton |

---

### Ordem de execução
1. Migração do banco (5 tabelas)
2. Hook `useProjects`
3. Hook `useProjectWizard`
4. Dashboard atualizado
5. Wizard completo
6. ProjectsPage atualizada
