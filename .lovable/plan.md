
## Avaliação Real do Sistema + Plano de Elevação para Produção v2.2

### Estado atual — diagnóstico honesto após leitura completa

**O que já funciona bem (não tocar):**
- Auth completo (login, cadastro, logout, proteção de rotas)
- Banco com 5 tabelas + RLS + triggers no SQL (migrations existem)
- Dashboard carregando métricas reais via React Query
- Wizard 4 etapas salvando na tabela `projects`
- ProjectDetailPage com 11 abas, edição inline, favoritar, excluir
- Revisão IA via Edge Function (M13) funcional
- Todas as páginas secundárias (Prompts, Templates, Versões, Avaliações, Configurações, Exportações) com dados reais
- Design system visual coerente (dark/light, Sora + DM Sans)

**Problemas reais identificados (o que de fato precisa ser corrigido):**

1. **CRÍTICO — Triggers não existem no banco** — `supabase-config` confirma: "There are no triggers in the database." As migrations SQL criaram os triggers mas não foram executados no banco real. Todos os `updated_at` nunca atualizam.

2. **CRÍTICO — `db-functions` mostra `handle_new_user` sem trigger** — O trigger que chama `handle_new_user` ao criar usuário também não existe, o que significa que novos cadastros **não criam perfil na tabela `profiles`** — quebrando `SettingsPage` e `AppHeader`.

3. **IMPORTANTE — `NewProjectPage` — botão "Refinar com IA" sem funcionalidade** — O botão existe com classe `border-primary/40 text-primary` mas sem handler. Nenhuma Edge Function de refinamento existe.

4. **IMPORTANTE — Command Palette (Cmd+K) no header** — O botão de busca existe visualmente mas não abre nenhum modal. O `cmdk` já está instalado no `package.json`.

5. **IMPORTANTE — `PlansPage` sem conexão ao plano real do usuário** — O plano atual está hardcoded como `current: true` no plano Free, sem ler a coluna `plan` da tabela `profiles`.

6. **IMPORTANTE — `EvaluationsPage` e `ProjectDetailPage` — aba "Avaliação"** — Não há forma de executar a avaliação de score. A aba "eval" mostra apenas `EmptyTab`. Não existe Edge Function para calcular quality_score.

7. **IMPORTANTE — `NewProjectPage` — Etapa 3 "Refinar com IA"** — O botão não tem handler. Falta Edge Function `refine-idea`.

8. **MELHORIA — `LandingPage`** — Seção de FAQ existe mas os itens não têm accordion interativo. A seção de features está estática sem animações de entrada no scroll. Sem seção "Como Funciona" com 3 passos.

9. **MELHORIA — `ProjectDetailPage` abas "Módulos", "Telas", "Banco de Dados", "Regras"** — Mostram `EmptyTab` estáticos. Devem oferecer geração por IA via Edge Function.

10. **MELHORIA — Gerador de Prompts com IA real (M09)** — A `PromptsPage` lista prompts salvos mas não tem forma de gerar novos. A aba "Prompts" em `ProjectDetailPage` lista prompts salvos mas sem botão "Gerar". Não existe Edge Function `generate-prompt`.

---

### O que será implementado nesta sessão

#### FASE 1 — Correções Críticas de Banco (migrations)

**Migration 1: Criar triggers ausentes + trigger de `handle_new_user`**
```sql
-- Trigger para profiles ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers updated_at em todas as tabelas
CREATE TRIGGER update_projects_updated_at ...
CREATE TRIGGER update_prompts_updated_at ...
CREATE TRIGGER update_project_versions_updated_at ...
CREATE TRIGGER update_templates_updated_at ...
CREATE TRIGGER update_profiles_updated_at ...
```

#### FASE 2 — Edge Functions novas (3 funções)

**`generate-prompt`** — Gera prompts por tipo (10 tipos: frontend, backend, banco, deploy, MVP, mobile, testes, segurança, API, documentação). Recebe `{ project_id, prompt_type }`, retorna conteúdo via Gemini, salva na tabela `prompts` e retorna o objeto salvo.

**`refine-idea`** — Recebe `{ idea }`, retorna a ideia refinada/expandida via Gemini. Usada no botão "Refinar com IA" da Etapa 1 do wizard.

**`generate-ai-content`** — Gera conteúdo para as abas Módulos, Telas, Banco de Dados e Regras de Negócio. Recebe `{ project_id, content_type }`, retorna texto estruturado Markdown.

#### FASE 3 — Frontend — Funcionalidades que faltam

**`NewProjectPage`** — Conectar botão "Refinar com IA" à Edge Function `refine-idea` com streaming visual (texto aparecendo progressivamente na textarea).

**`ProjectDetailPage`** — Implementar as 4 abas de geração:
- "Módulos": botão "Gerar com IA" → chama `generate-ai-content` com `content_type: "modules"`
- "Telas": botão "Gerar com IA" → `content_type: "screens"`
- "Banco de Dados": botão "Gerar com IA" → `content_type: "database"`
- "Regras": botão "Gerar com IA" → `content_type: "rules"`
- "Avaliação" (aba "eval"): botão "Calcular Score" → chama `evaluate-project` e salva `quality_score` no banco

**Novo componente `AIContentTab`** — Reutilizável para as abas de conteúdo gerado por IA: mostra estado vazio com botão "Gerar", loading com `AIStreamingIndicator`, resultado em Markdown formatado, botão Copiar, botão Regenerar.

**Command Palette (Cmd+K)** — Implementar usando `cmdk` já instalado. Modal com busca de projetos, navegação rápida, ações como "Novo projeto", "Ver templates". Ativado por Cmd+K / Ctrl+K.

**`PlansPage`** — Conectar ao plano real: ler `profiles.plan` via React Query e marcar o plano correto como "atual".

**`EvaluationsPage`** — Adicionar Edge Function `evaluate-project` e botão "Avaliar com IA" nos cards de projetos sem score.

#### FASE 4 — Gerador de Prompts completo (M09)

**`PromptsPage`** — Adicionar seção de geração: seletor de projeto + seletor de tipo de prompt (10 tipos com ícones) + botão "Gerar Prompt" → chama `generate-prompt` → salva e recarrega lista.

**Aba "Prompts" em `ProjectDetailPage`** — Adicionar botão "+ Gerar Prompt" que abre modal com seleção de tipo.

**Edge Function `evaluate-project`** — Avalia o projeto em 7 dimensões (Escopo 0-100, Estrutura 0-100, Técnico 0-100, Completude 0-100, Viabilidade 0-100, Monetização 0-100, Maturidade 0-100), calcula score final, salva em `projects.quality_score` e retorna dimensões para radar chart em `EvaluationsPage`.

#### FASE 5 — Polish e UX

**`LandingPage`** — Adicionar seção "Como Funciona" com 3 passos animados. FAQ com Accordion do Radix já instalado. Animações de entrada no scroll com `framer-motion` `whileInView`.

---

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/[ts]_triggers_fix.sql` | Criar — triggers reais no banco |
| `supabase/functions/generate-prompt/index.ts` | Criar — M09 geração de prompts |
| `supabase/functions/refine-idea/index.ts` | Criar — refinamento de ideia |
| `supabase/functions/generate-ai-content/index.ts` | Criar — módulos/telas/banco/regras |
| `supabase/functions/evaluate-project/index.ts` | Criar — score de qualidade |
| `supabase/config.toml` | Editar — registrar 4 novas funções |
| `src/components/CommandPalette.tsx` | Criar — Cmd+K com cmdk |
| `src/components/AIContentTab.tsx` | Criar — aba reutilizável de conteúdo IA |
| `src/pages/app/NewProjectPage.tsx` | Editar — conectar "Refinar com IA" |
| `src/pages/app/ProjectDetailPage.tsx` | Editar — abas Módulos/Telas/DB/Regras/Avaliação + Command Palette |
| `src/pages/app/PromptsPage.tsx` | Editar — adicionar gerador M09 |
| `src/pages/app/EvaluationsPage.tsx` | Editar — botão "Avaliar" + radar chart |
| `src/pages/app/PlansPage.tsx` | Editar — conectar plano real do usuário |
| `src/pages/app/LandingPage.tsx` | Editar — Como Funciona + FAQ accordion |
| `src/components/AppHeader.tsx` | Editar — ativar Command Palette |

### Ordem de execução
1. Migration triggers (crítico — resolve profiles e updated_at)
2. Edge Functions (4 funções: generate-prompt, refine-idea, generate-ai-content, evaluate-project)
3. Config.toml atualizado
4. CommandPalette + AIContentTab (componentes base)
5. ProjectDetailPage abas IA
6. PromptsPage M09
7. EvaluationsPage com score
8. NewProjectPage refinar ideia
9. PlansPage com plano real
10. LandingPage polish
