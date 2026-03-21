
## Diagnóstico Completo — 17 anos de experiência, zero tolerância a bug

### Estado atual do sistema (leitura de 32 arquivos)

**O que funciona corretamente:**
- Auth (login/cadastro/logout) com tratamento de erros traduzidos
- Wizard 4 etapas com Zustand persist + refinar ideia com IA funcional
- Dashboard com métricas reais via React Query
- ProjectsPage com busca e filtros funcionais
- ProjectDetailPage com 11 abas, edição inline, favoritar, excluir
- ProjectCard com dropdown de ações (favoritar, arquivar)
- CommandPalette Cmd+K funcional
- 5 Edge Functions deployadas (review-project, generate-prompt, refine-idea, generate-ai-content, evaluate-project)
- RLS em todas as tabelas
- Revisão IA (M13) funcional, Score de Qualidade (M12) funcional
- PromptsPage, TemplatesPage, VersionsPage, EvaluationsPage, SettingsPage, ExportsPage todas funcionais

### Bugs reais identificados (não cosméticos)

**BUG 1 — CRÍTICO: Trigger `on_auth_user_created` ainda não existe no banco**
A migration `20260321002512` tentou criar o trigger com `DO $$ IF NOT EXISTS` mas a tabela consultada (`pg_trigger`) não inclui triggers de schema `auth`. O resultado: a `db-triggers` confirma `"There are no triggers in the database"`. Isso significa que `profiles` nunca é criado automaticamente, quebrando `SettingsPage` (erro silencioso no `.single()` sem perfil) e `AppHeader` (displayName pode ser undefined).

**BUG 2 — CRÍTICO: `AIContentTabWrapper` usa variável errada `err` ao invés de `error`**
Em `ProjectDetailPage.tsx` linha 857:
```ts
} as { data: { content?: string; error?: string } | null; err?: unknown };
if (err) throw err;
```
O destructuring do `invoke` retorna `{ data, error }` não `err`. Este bug silencia completamente erros das 4 abas de IA (Módulos, Telas, Banco, Regras) — sempre chega como `undefined`, jogando pro catch genérico.

**BUG 3 — CRÍTICO: `SettingsPage` usa `useTheme` do `next-themes`**
`AppearanceSection` importa `useTheme` de `next-themes` (linha 4). O projeto **não usa** `next-themes` — o tema é controlado via `document.documentElement.classList` no `AppHeader`. Isso faz a seção de Aparência em Configurações nunca refletir o tema atual e não mudar o tema quando acionada.

**BUG 4 — IMPORTANTE: `AIContentTabWrapper` — estado de geração perdido ao trocar abas**
Cada vez que o usuário clica em outra aba e volta, o conteúdo gerado desaparece (state local). O conteúdo gerado por IA deve ser persistido enquanto o componente pai estiver montado.

**BUG 5 — IMPORTANTE: `PromptsPage` sem link para gerar prompt**
A PromptsPage lista prompts mas o empty state direciona para "Criar primeiro projeto" em vez de "Ir para um projeto e gerar prompts". Sem forma de gerar diretamente da PromptsPage (diferente do ProjectDetailPage que tem o gerador inline).

**BUG 6 — IMPORTANTE: `ExportsPage` aba "exports" na ProjectDetailPage ainda usa `EmptyTab`**
Linha 1087: `{activeTab === "exports" && <EmptyTab ...>}` — nunca foi conectada à exportação real. O usuário que abre a aba "Exportações" dentro de um projeto específico vê placeholder.

**BUG 7 — MENOR: `LandingPage` — seção "Como Funciona" tem connector arrows com posição incorreta**
Linha 184: `<div className="hidden md:block absolute mt-7 ml-48 w-16 h-px bg-border" />` dentro de um elemento com `className="flex flex-col items-center text-center"` que não tem `relative`. As setas ficam posicionadas incorretamente.

**BUG 8 — MENOR: `DashboardPage` — métrica "Projetos Ativos" sempre 0**
Se o usuário nunca mudou o status de "draft" para "active", mostra 0. Seria mais útil mostrar "Favoritos" ou "Rascunhos" no lugar.

**BUG 9 — MENOR: `PlansPage` — botão "Começar agora" sem funcionalidade**
Todos os botões de plano redirecionam para `/cadastro` mesmo quando o usuário já está logado (PlansPage é uma rota autenticada). Deve redirecionar para Configurações ou exibir "Entrar em contato".

**BUG 10 — MENOR: Falta de `ThemeProvider` — `next-themes` importado mas sem Provider**
`AppearanceSection` importa `next-themes` mas `next-themes` não tem `ThemeProvider` no `App.tsx`. Vai crashar silenciosamente.

**BUG 11 — COSMÉTICO: `tailwind.config.ts` usa `darkMode: ["class"]` mas o tema dark é `:root` e o light é `.light`**
O Tailwind está configurado para dark mode via classe, mas o CSS usa `:root` para escuro e `.light` para claro. Isso é invertido — quando Tailwind adiciona `.dark` a nada muda, quando remove também. O tema funciona porque o AppHeader manualmente adiciona/remove `.light`, mas é frágil.

**BUG 12 — COSMÉTICO: `AppHeader` e `SettingsPage` têm implementações de tema em conflito**
O AppHeader gerencia tema via `localStorage + classList`, enquanto SettingsPage tenta usar `next-themes`. Dois sistemas incompatíveis.

---

### Plano de correções

#### Correção 1 — Trigger `on_auth_user_created` (nova migration)
Criar migration correta sem o `IF NOT EXISTS` do `pg_trigger` que não funciona para triggers auth:
```sql
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_versions_updated_at BEFORE UPDATE ON public.project_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### Correção 2 — `AIContentTabWrapper` — fix variável `err` → `error`
Linha 857–858 de `ProjectDetailPage.tsx`:
```ts
// ANTES (bug):
} as { data: {...} | null; err?: unknown };
if (err) throw err;

// DEPOIS (correto):
const { data, error: invokeError } = await supabase.functions.invoke("generate-ai-content", {
  body: { project_id: projectId, content_type: contentType },
});
if (invokeError) throw invokeError;
```

#### Correção 3 — Remover `next-themes` de `SettingsPage`
Substituir `useTheme` de `next-themes` por hook customizado local que lê/escreve o mesmo `localStorage` e manipula classList que o AppHeader usa. Criar `useAppTheme()` hook compartilhado entre `AppHeader` e `SettingsPage`.

#### Correção 4 — Persistir conteúdo IA gerado nas abas durante sessão
Mover o estado `content/isLoading/error` de `AIContentTabWrapper` para o componente pai `ProjectDetailPage`, indexado por `contentType`, usando `useRef` ou `useState` com mapa:
```ts
const [aiContent, setAiContent] = useState<Record<string, string | null>>({});
```

#### Correção 5 — Aba "Exportações" em ProjectDetailPage
Substituir `EmptyTab` por componente inline que gera e baixa a documentação do projeto específico (reutilizando a função `generateDoc` já existente em `ExportsPage`).

#### Correção 6 — Corrigir setas de "Como Funciona" na LandingPage
Remover as `div` de seta absolutas que não têm um elemento `relative` pai correto, ou converter a seção para usar `flex` com ícones de seta entre os passos.

#### Correção 7 — `PlansPage` — botões contextuais para usuário logado
Ao invés de `/cadastro`, os CTAs em `PlansPage` devem mostrar "Plano atual" para o plano ativo e "Entrar em contato" para upgrade (pois não há integração com Stripe ainda), com visual diferente.

#### Correção 8 — `DashboardPage` — substituir "Projetos Ativos" por "Favoritos"
Mostrar projetos favoritados ao invés de ativos — dado mais útil para a maioria dos usuários que tem projetos em rascunho.

#### Correção 9 — `PromptsPage` — melhorar empty state e adicionar contador por tipo
Empty state deve orientar o usuário a ir para um projeto e gerar. Adicionar badge de contagem por tipo de prompt (filtro por tipo).

---

### Arquivos a criar/modificar

| Arquivo | Ação | Criticidade |
|---|---|---|
| `supabase/migrations/[ts]_triggers_final.sql` | Criar — triggers reais corretos | CRÍTICO |
| `src/hooks/useAppTheme.ts` | Criar — hook compartilhado de tema | CRÍTICO |
| `src/pages/app/ProjectDetailPage.tsx` | Editar — 3 bugs (AIContentTabWrapper erro + estado persistente + aba exports) | CRÍTICO |
| `src/pages/app/SettingsPage.tsx` | Editar — remover next-themes, usar useAppTheme | CRÍTICO |
| `src/components/AppHeader.tsx` | Editar — usar useAppTheme | MÉDIO |
| `src/pages/LandingPage.tsx` | Editar — corrigir setas "Como Funciona" | MENOR |
| `src/pages/app/PlansPage.tsx` | Editar — CTAs contextuais para usuário logado | MENOR |
| `src/pages/app/DashboardPage.tsx` | Editar — "Favoritos" ao invés de "Ativos" | MENOR |
| `src/pages/app/PromptsPage.tsx` | Editar — melhorar empty state + filtro por tipo | MENOR |

### Ordem de execução
1. Migration triggers (banco — crítico)
2. Hook `useAppTheme` (base para correções 3 e 12)
3. `AppHeader` com `useAppTheme`
4. `SettingsPage` sem `next-themes`
5. `ProjectDetailPage` — 3 correções simultâneas (AIContentTabWrapper bug, estado persistido, aba exports)
6. `DashboardPage`, `PlansPage`, `PromptsPage`, `LandingPage` — polish final
