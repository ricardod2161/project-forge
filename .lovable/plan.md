
## Problema central
O usuário identificou corretamente: o `generate-prompt` atual combina stack, design, banco, CMS, performance, integração e deploy em **um único bloco monolítico**. O resultado é um prompt confuso que a IA receptora não sabe onde começar.

## Solução: 2 níveis estruturais

### Nível 1 — Prompt Mestre (reformulado)
Passa a ter **escopo reduzido e cirúrgico**:
- Objetivo do projeto
- Público-alvo
- Proposta de valor única
- Stack real (apenas o necessário)
- Páginas/rotas principais com estratégia de renderização
- Estilo visual (tokens CSS, não código completo)
- Regras críticas de implementação (NUNCA usar qualquer, sem hardcode de cores, etc.)

**Remove do Mestre**: schema SQL completo, copywriting, SEO detalhado, performance checklist, deploy guide, e-commerce schema — tudo isso vai para módulos.

### Nível 2 — Prompts de Módulo (10 para sistema, 10 para site)
Cada módulo é independente e auto-suficiente. A IA sabe exatamente o que construir.

**Para Sistema:**
- `master` → Contexto + Stack + Rotas + Regras (reformulado)
- `frontend` → Componentes por página + Design system completo
- `backend` → Edge Functions completas (sem misturar com banco)
- `database` → Schema SQL puro (sem Edge Functions)
- `auth` → **NOVO**: Fluxo completo de auth + guards + profiles
- `dashboard` → Painel admin + métricas (atual)
- `mvp` → Escopo mínimo (atual)
- `premium` → Versão avançada (atual)
- `correction` → Debugging (atual)
- `refactoring` → Refatoração (atual)

**Para Site:**
- `site_master` → Contexto + Stack + Mapa de rotas + Regras (reformulado)
- `site_design` → Design system completo + tokens CSS reais
- `site_copy` → Copywriting real por seção
- `site_seo` → SEO técnico + JSON-LD + keywords
- `site_sections` → Código de cada seção (atual)
- `site_performance` → Core Web Vitals (atual)
- `site_forms` → Formulários + integrações (atual)
- `site_ecommerce` → E-commerce completo (atual)
- `site_cms` → Blog/CMS (atual)
- `site_deploy` → Deploy + go-live (atual)

## O que muda tecnicamente

### `supabase/functions/generate-prompt/index.ts`

**1. Reformular `master` e `site_master`:**

`master` — novo foco EXCLUSIVO:
```
CONTEXTO DO PROJETO: objetivo, público, proposta de valor, diferenciais
STACK TÉCNICA: React + Vite + TypeScript strict, Supabase, routing, libs essenciais (com versões)
RENDERING STRATEGY: por rota — SSG/ISR/SSR com justificativa de cada uma
PÁGINAS PRINCIPAIS: lista de rotas com guard (público/autenticado), componente responsável
DESIGN TOKENS: apenas as CSS variables HSL (--primary, --accent, --background etc.) — sem código de componente
REGRAS DE IMPLEMENTAÇÃO: 
  - Nunca hardcode de cor no JSX (sempre CSS vars)
  - Nunca any — tipos específicos ou unknown
  - RLS em toda tabela
  - Zod em todos os formulários
  - Loading/empty/error em todo componente de dados
CHECKLIST DE ENTREGA: 20+ itens verificáveis (não genéricos)
```

`site_master` — novo foco EXCLUSIVO:
```
CONTEXTO DO SITE: objetivo, público, diferencial, tom de voz
STACK: React + Vite + Tailwind + shadcn/ui + versões
MAPA DE ROTAS: cada rota com rendering strategy (SSG/ISR/SSR)
DESIGN TOKENS: CSS variables HSL somente (sem escala tipográfica completa — essa vai para site_design)
COPYWRITING RESUMIDO: headline + subheadline de cada seção (copy completo vai para site_copy)
REGRAS: prefers-reduced-motion, no hardcode, landmarks semânticos, alt text
CHECKLIST DE ENTREGA: 20+ itens
```

**2. Adicionar `auth` como novo tipo de sistema:**
```typescript
"auth": {
  title: "Autenticação e Autorização",
  platform: "Supabase",
  instructions: `Especificação completa do sistema de auth...
  - Trigger handle_new_user → INSERT em profiles
  - Roles: enum app_role, tabela user_roles, has_role() SECURITY DEFINER
  - ProtectedRoute component com useAuth hook
  - Fluxos: cadastro, login, recuperação de senha, sessão persistente
  - Guards admin via user_roles
  - JWT no cookie httpOnly (não localStorage)
  ...`
}
```

**3. `frontend` — remover design system completo (vai para site_design)**
O `frontend` deixa de repetir tokens CSS e passa a referenciar o design system, focando em componentes e estrutura de páginas.

**4. `backend` — remover schema SQL**
O `backend` passa a se concentrar apenas em Edge Functions, webhook handlers e RLS policies. Schema SQL fica exclusivamente em `database`.

**5. `QUALITY_REQUIREMENTS` — atualizar**
Adicionar restrição de escopo por tipo:
```
✓ O prompt mestre define OBJETIVO, STACK e REGRAS — não duplica módulos
✓ Cada módulo é auto-suficiente e referencia o mestre para contexto
✓ Não repetir conteúdo de outros módulos em um módulo específico
```

**6. `SYSTEM_PROMPT_APPS` — reformular**
Adicionar diretiva anti-mistura:
```
REGRA CRÍTICA: cada tipo de prompt tem escopo EXCLUSIVO.
- O prompt MESTRE não contém código de componentes, schema SQL ou copywriting
- O prompt BANCO não contém Edge Functions
- O prompt FRONTEND não contém configurações de servidor
Um desenvolvedor deve poder usar cada prompt de forma INDEPENDENTE.
```

### `src/pages/app/ProjectDetailPage.tsx`

**1. `PROMPT_TYPES_LIST` — adicionar `auth`:**
```typescript
{ value: "auth", label: "Autenticação", shortLabel: "Auth", platform: "Supabase", desc: "Fluxo completo de auth, guards, roles e perfis." },
```
Inserir entre `backend` e `database`.

**2. Reordenar lista de sistema** para refletir a hierarquia:
```
Mestre → Auth → Frontend → Backend → Banco → Dashboard → MVP → Premium → Correção → Refatoração → Multi
```

**3. Atualizar descrições** dos tipos existentes para deixar claro o escopo exclusivo de cada um.

## Arquivos alterados
1. `supabase/functions/generate-prompt/index.ts` — reformular `master`, `site_master`, `frontend`, `backend`, adicionar `auth`, atualizar system prompts e quality requirements
2. `src/pages/app/ProjectDetailPage.tsx` — adicionar `auth` em `PROMPT_TYPES_LIST`, reordenar e atualizar descrições

## O que NÃO muda
- UI da aba Prompts — mesma estrutura de sub-tabs horizontal
- Edge function de auth/banco/infra — intocadas
- Tipos de site — mantidos, apenas `site_master` reformulado
- Banco de dados — sem migrations

## Resultado esperado
Um prompt `master` de ~600-800 palavras denso e focado, que orienta o contexto. Cada módulo com 500-900 palavras exclusivas da sua responsabilidade. A IA receptora (Lovable) sabe exatamente o que construir em cada chamada sem conflito de escopo.
