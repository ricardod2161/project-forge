
## Auditoria Completa + Plano de Upgrade Premium v3.0

### Estado atual — diagnóstico real de 17 arquivos lidos

**Fundação sólida que preservamos:**
- Auth, wizard, RLS, React Query, Edge Functions — tudo funcional
- Design tokens bem definidos (cores, tipografia, sombras)
- Lógica de negócio nas páginas está correta

**Problemas reais identificados (20 itens):**

**CRÍTICOS — Bugs que quebram a experiência:**
1. `tailwind.config.ts` tem `darkMode: ["class"]` mas o CSS usa `:root` para dark e `.light` para claro. Tailwind nunca aplica variantes `dark:` porque procura a classe `.dark` que nunca existe. Todo `dark:text-*`, `dark:bg-*` etc nos componentes shadcn nunca funcionam. Precisa adicionar `darkMode: false` e confiar apenas nas CSS vars OU corrigir para `darkMode: "selector"` com `.light` como target.
2. `App.css` tem `#root { max-width: 1280px; margin: 0 auto; }` — isso quebra o layout full-width do app, comprimindo tudo a 1280px e quebrando sidebar em telas grandes.
3. Triggers `on_auth_user_created` ainda não existem (confirmado em `db-triggers: There are no triggers`). Novos usuários não têm perfil criado, quebrando SettingsPage.
4. ProjectDetailPage aba "Requisitos" é listada em TABS mas não existe handler — nem está no array TABS, logo o conteúdo nunca é renderizado.

**IMPORTANTES — UX quebrada ou degradada:**
5. `ProjectCard`: títulos muito pequenos (text-xs = 0.875rem), difícil de ler. Botão "Abrir" invisível até hover (opacity-0) — usuários não sabem que pode clicar.
6. `DashboardPage`: saudação sem hierarquia (`text-xl` é o h1, mas com font-size `2rem` no config = enorme, ou `text-xl` = `2rem` no config customizado). Verificado: `text-xl` no config custom mapeado para `2rem` — muito grande para saudação.
7. `PromptsPage` e outras: `Skeleton` redefinido localmente em cada arquivo (4+ redefinições). Duplicação massiva.
8. `EvaluationsPage`, `VersionsPage`, `TemplatesPage`: não têm padding/wrapper consistente com as outras páginas.
9. `ProjectsPage`: layout de busca e filtros quebra no mobile (flex-row soma com input de largura livre).
10. `NewProjectPage`: progress bar de etapas sem animação de progresso, sem indicação de qual etapa está ativa visualmente além da cor.

**MELHORIAS DE QUALIDADE — Visual e UX:**
11. Ausência de componentes base reutilizáveis: `PageHeader`, `EmptyState`, `StatCard`, `ErrorState` — cada página reimplementa.
12. `AppSidebar`: "Novo Projeto" button escondido quando collapsed — deveria aparecer como ícone no collapsed mode.
13. `AppHeader`: notificações sem funcionalidade real, badge vermelho sempre aceso.
14. `LandingPage`: seção "Como Funciona" com conectores posicionados incorretamente (elemento absolute sem pai relative).
15. `ProjectDetailPage`: tab scroll horizontal no mobile sem indicador de que há mais abas.
16. Cards de métricas no Dashboard: nenhuma tendência ou comparação, apenas números frios.
17. `SettingsPage`: seção de Aparência duplica funcionalidade do header toggle — mas visualmente mais rica que o header.
18. `ExportsPage`: sem exportação JSON, apenas Markdown.
19. `PlansPage`: cards sem comparação visual horizontal, sem tabela de features por plano.
20. Falta de `ErrorBoundary` global para capturar crashes silenciosos.

---

### Componentes base a criar (`src/components/ui/` estendidos)

**`src/components/PageHeader.tsx`** — Reutilizável em todas as páginas:
```tsx
<PageHeader title="..." subtitle="..." badge="X itens">
  <Button>Ação</Button>
</PageHeader>
```

**`src/components/EmptyState.tsx`** — Substitui ~8 implementações locais:
```tsx
<EmptyState icon={...} title="..." description="..." action={{ label: "...", to: "..." }} />
```

**`src/components/StatCard.tsx`** — Substitui MetricCard em Dashboard:
```tsx
<StatCard label="..." value="..." icon={...} trend="+12%" loading />
```

**`src/components/ErrorBoundary.tsx`** — Wrapper global para App.tsx

---

### Plano de execução (10 mudanças em ordem de impacto)

#### 1. Corrigir `App.css` + `tailwind.config.ts`
- Remover `#root { max-width: 1280px; margin: 0 auto; }` de `App.css` — esse é o bug de layout mais crítico
- Corrigir `darkMode` no Tailwind para funcionar com o sistema atual

#### 2. Migration — triggers definitivos (nova migration limpa)
- `on_auth_user_created` sem a lógica IF NOT EXISTS que falhou
- `updated_at` em todas as tabelas públicas

#### 3. Criar componentes base reutilizáveis
- `PageHeader.tsx`, `EmptyState.tsx`, `StatCard.tsx`, `ErrorBoundary.tsx`
- Eliminar as ~12 redefinições locais de `Skeleton`

#### 4. Refatorar `DashboardPage` com visual premium
- Usar `StatCard` com trend indicators (% em relação ao período anterior seria fictício, mas mostra estrutura)
- Saudação com tamanho hierárquico correto
- Grid mais generoso e respirado
- "Atividade recente" timeline além dos projetos

#### 5. Refatorar `ProjectsPage` + `ProjectCard`
- `ProjectCard`: título em `text-sm`, botão "Abrir" sempre visível (não opacity-0)
- `ProjectsPage`: busca full-width mobile, filtros como tabs flutuantes
- Ordenação por nome/data/score adicionada

#### 6. Aprimorar `AppSidebar` + `AppHeader`
- Sidebar collapsed: mostrar ícone do "Novo Projeto" (sem esconder no collapsed)
- Header: remover badge de notificação fixo (sem funcionalidade = confunde o usuário)
- Sidebar: adicionar tooltip nos ícones quando collapsed

#### 7. Refatorar `ProjectDetailPage` — tabs mobile + polish
- Tabs: scroll horizontal com indicador de fade nos extremos (mask-image)
- Cada aba usa os componentes base
- Header do projeto mais premium com gradiente sutil

#### 8. Melhorar `NewProjectPage` — wizard premium
- Progress bar animada com framer-motion
- Step indicators com números + labels
- Transições entre etapas mais suaves

#### 9. Refatorar `LandingPage` — fix setas + polish
- Fix da seção "Como Funciona": usar flex row com ícones de seta `→` entre os passos
- Hero com padding correto
- Seção de plans com comparação mais clara

#### 10. `SettingsPage` + `ExportsPage` + `PlansPage` — polish final
- Settings: layout de duas colunas em desktop
- ExportsPage: adicionar opção de exportar JSON além de Markdown
- PlansPage: tabela comparativa completa

---

### Arquivos a criar/modificar

| Arquivo | Ação | Impacto |
|---|---|---|
| `src/App.css` | Remover `#root` max-width | CRÍTICO — desbloqueio de layout |
| `tailwind.config.ts` | Fix darkMode | CRÍTICO |
| `supabase/migrations/[ts]_triggers_v3.sql` | Triggers corretos | CRÍTICO |
| `src/components/PageHeader.tsx` | Criar | BASE |
| `src/components/EmptyState.tsx` | Criar | BASE |
| `src/components/StatCard.tsx` | Criar | BASE |
| `src/components/ErrorBoundary.tsx` | Criar | BASE |
| `src/pages/app/DashboardPage.tsx` | Reescrever | ALTO |
| `src/components/ProjectCard.tsx` | Melhorar | ALTO |
| `src/pages/app/ProjectsPage.tsx` | Melhorar | ALTO |
| `src/components/AppSidebar.tsx` | Melhorar | MÉDIO |
| `src/components/AppHeader.tsx` | Melhorar | MÉDIO |
| `src/pages/app/ProjectDetailPage.tsx` | Melhorar tabs + header | MÉDIO |
| `src/pages/app/NewProjectPage.tsx` | Progress bar premium | MÉDIO |
| `src/pages/LandingPage.tsx` | Fix setas + polish | MÉDIO |
| `src/pages/app/SettingsPage.tsx` | Layout 2 colunas | MENOR |
| `src/pages/app/ExportsPage.tsx` | + JSON export | MENOR |
| `src/pages/app/PlansPage.tsx` | Comparativo completo | MENOR |
| `src/main.tsx` | Adicionar ErrorBoundary | MENOR |

### Ordem de execução
1. App.css + tailwind.config + migration (críticos — sem isso nada flui)
2. Componentes base (PageHeader, EmptyState, StatCard, ErrorBoundary)
3. Dashboard + ProjectCard + ProjectsPage (páginas de maior tráfego)
4. AppSidebar + AppHeader (chrome do app)
5. ProjectDetailPage + NewProjectPage
6. LandingPage + SettingsPage + ExportsPage + PlansPage
