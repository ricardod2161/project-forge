
## ETAPA 0 · VALIDAÇÃO E COMPREENSÃO

This is a massive SaaS platform specification. I'll present the full validation analysis before any code is written.

---

### a) Síntese do Produto (5 linhas)

**Arquiteto IA** é uma plataforma SaaS B2B/B2C 100% em português que transforma ideias brutas de software em projetos técnicos completos usando IA. O público-alvo são desenvolvedores, product managers, empreendedores digitais e agências que utilizam plataformas low-code/no-code como Lovable, Bubble e Bolt. O problema resolvido é a barreira entre "ter uma ideia" e "ter um briefing técnico profissional estruturado" — processo que hoje leva horas e requer conhecimento avançado. A monetização é via assinatura em 3 tiers (Free / Pro R$47 / Expert R$147), com upsell natural pelo volume de projetos e prompts. O diferencial é a combinação de geração de arquitetura + prompts prontos para uso + score de qualidade + exportação multiplataforma em um único produto opinionado e premium.

---

### b) Stack Final Adotada

| Tecnologia | Escolha | Justificativa |
|---|---|---|
| Frontend | React + TypeScript + Vite | Já presente no projeto; TypeScript estrito elimina bugs de runtime |
| UI | shadcn/ui + Tailwind CSS | Design system extensível, zero lock-in, componentes acessíveis por padrão |
| Backend | Supabase (Cloud Lovable) | Auth + PostgreSQL + Storage + Edge Functions em um único provider; RLS nativo |
| IA | Lovable AI Gateway (Gemini Flash/Pro) | API key pré-configurada, sem necessidade de OPENAI_KEY do usuário; streaming compatível |
| Estado Global | React Query (TanStack Query) | Já incluso via `@tanstack/react-query` no projeto; server state + caching |
| Estado de UI | Zustand | Re-renders cirúrgicos em componentes profundos (wizard, sidebar) |
| Animações | Framer Motion | Biblioteca padrão para microinterações e transições de página fluidas |
| Roteamento | React Router v6 | Já configurado no projeto |
| Gráficos | Recharts | Leve, componível, suporte nativo a SVG responsivo |
| Validação | Zod + react-hook-form | Type-safe, integração nativa com shadcn/ui Form |
| Ícones | Lucide React | Tree-shakeable, consistente com shadcn/ui |

> **Desvio da spec original**: A spec menciona OpenAI GPT-4o diretamente. Será usado o Lovable AI Gateway (suporta modelos Gemini e GPT-5) pois elimina a necessidade de configurar OPENAI_API_KEY manualmente e já está provisionado no ambiente Supabase.

---

### c) 3 Riscos Técnicos Identificados

**Risco 1 — Complexidade de Estado no Wizard (M03)**
O wizard de 4 etapas com streaming de IA, auto-save em localStorage e persistência no Supabase precisa de um hook `useProjectWizard()` muito bem desenhado. Se o estado não for isolado corretamente, haverá vazamentos entre projetos e re-renders desnecessários. Mitigação: Zustand slice separado por wizard instance + debounced auto-save.

**Risco 2 — Performance do Módulo de Prompts (M09)**
10 tipos de prompts gerados via Edge Function com streaming simultâneo pode criar gargalos de conexão. Se o usuário navegar entre abas durante a geração, o stream pode ser abortado ou duplicado. Mitigação: AbortController por aba + cache local após primeira geração + indicador de estado por tipo.

**Risco 3 — Escopo do MVP vs. Produto Completo**
A spec descreve 17 módulos com dezenas de sub-features. Tentar implementar tudo de uma vez resultará em código fragmentado e UI inconsistente. Mitigação: implementação em etapas com critério de corte técnico claro (definido abaixo), priorizando o fluxo crítico: Auth → Dashboard → Criar Projeto → Gerar Prompts → Score.

---

### d) 2 Decisões de Arquitetura Mais Críticas

**Decisão 1 — Modelo de Roteamento e Layout**
A aplicação tem dois contextos completamente diferentes: **Landing Page** (público, marketing) e **App** (privado, produto). A decisão é usar **layouts aninhados** no React Router v6: `/` para landing, `/app/*` para o dashboard autenticado. Isso evita que o sidebar e header do app sejam renderizados na landing page, e facilita proteção de rotas com um único wrapper `<ProtectedRoute>`.

**Decisão 2 — Arquitetura das Edge Functions**
Com 17 módulos gerando conteúdo via IA, criar uma Edge Function por tipo de geração (17+) seria ingerenciável. A decisão é criar **3 Edge Functions principais**:
- `generate-content` — recebe `{ project_id, generation_type, context }`, roteia para o prompt correto e retorna streaming
- `evaluate-project` — avalia as 7 dimensões de qualidade e retorna scores estruturados via tool calling
- `export-project` — gera os formatos de exportação de forma síncrona

---

### e) Estimativa de Módulos por Etapa

```text
ETAPA 1 — Design System + Estrutura (fundação)
  - tailwind.config.ts com paleta completa
  - globals.css com variáveis dark/light
  - Componentes base: Button, Card, Badge, Input, Skeleton
  - Componentes produto: ProjectCard, ScoreRing, AIStreamingIndicator
  - Layout geral: Sidebar + Header + ProtectedRoute
  - Roteamento completo (todas as rotas, mesmo que vazias)

ETAPA 2 — Auth + Onboarding (M01)
  - Login / Cadastro / Recuperação de senha
  - Middleware de proteção de rotas
  - Fluxo de onboarding 3 etapas
  - useAuth() hook

ETAPA 3 — Banco de Dados Supabase (todas as tabelas)
  - 18 tabelas com RLS
  - Triggers + Functions PostgreSQL
  - Seed de templates iniciais

ETAPA 4 — Dashboard (M02) + Criação de Projeto (M03)
  - Dashboard com métricas, recentes, favoritos
  - Wizard 4 etapas com streaming de IA

ETAPA 5 — Módulo de Prompts (M09) + Score (M12)
  - 10 tipos de prompts com Edge Function
  - Radar chart + ScoreRing + avaliação

ETAPA 6 — Módulos secundários (M04-M08, M11, M13)
  - Estrutura, Telas, DB, Regras, Revisão IA, Versões

ETAPA 7 — Exportação (M10) + Templates (M14) + Config (M16)
  - Central de exportação
  - Biblioteca de templates com 15 nichos

ETAPA 8 — Landing Page (M17 pricing + landing)
  - Todas as seções premium
  - Contador animado, grade de pontos, responsiva

ETAPA 9 — Polimento + Checklist Final
  - Estados de UI em 100% das telas
  - Responsividade mobile-first
  - Dark/light mode completo
  - Acessibilidade e performance
```

---

### Proposta de Início

Para maximizar o valor entregue por iteração, **a ETAPA 1 será executada imediatamente após autorização** — ela cria a fundação visual e estrutural que todas as demais etapas dependem. Sem ela, código de features ficaria inconsistente.

✅ Especificação validada. Pronto para iniciar Etapa 1 sob autorização.
