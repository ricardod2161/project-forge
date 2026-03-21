import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithFallback } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TYPES — SISTEMAS / APPS
// ─────────────────────────────────────────────────────────────────────────────
const PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {

  "master": {
    title: "Prompt Mestre Lovable",
    platform: "Lovable",
    instructions: `Crie um prompt mestre COMPLETO e ULTRA-DETALHADO para construir o sistema do zero no Lovable. O prompt deve cobrir TODOS os aspectos abaixo com especificidade cirúrgica:

STACK TÉCNICA (obrigatório especificar versões):
- Framework: React 18 + Vite + TypeScript strict
- Estilização: Tailwind CSS v3 + shadcn/ui + CSS Variables no index.css
- Estado global: Zustand para UI, TanStack Query v5 para dados assíncronos
- Backend: Supabase (Auth JWT, PostgreSQL, Storage, Edge Functions Deno)
- Roteamento: React Router v6 com rotas protegidas via ProtectedRoute
- Validação: Zod schemas em todos os formulários + react-hook-form
- Animações: Framer Motion (apenas acima da dobra, com prefers-reduced-motion)

DESIGN SYSTEM COMPLETO (valores HEX reais — não genéricos):
- Definir em index.css as variáveis CSS: --primary, --secondary, --accent, --background, --foreground, --muted, --border, --destructive com valores HSL reais
- Tipografia: especificar Google Fonts + pesos (ex: "Plus Jakarta Sans" 500/600/700/800)
- Escala tipográfica completa: H1 a H6 com tamanhos Tailwind, line-height e font-weight
- Variantes de Button: primary, secondary, ghost, destructive com classes Tailwind exatas
- Padrão de Card: border, radius, sombra, hover state
- Microinterações: padrão global de animação de entrada (opacity + translateY, ease, duração)

ESTRUTURA DE ROTAS (todas as rotas do sistema com guards):
- Listar cada rota: path, componente, guard (público/autenticado/admin), dados carregados
- Ex: /dashboard → SSR-like via useQuery + ProtectedRoute + dados do perfil + projetos

SCHEMA DO BANCO (SQL completo):
- Cada tabela com: CREATE TABLE, tipos de dados PostgreSQL, DEFAULT, NOT NULL, FK
- RLS policies por tabela: SELECT/INSERT/UPDATE/DELETE com auth.uid()
- Índices justificados (ex: CREATE INDEX idx_projects_user_id ON projects(user_id))
- Triggers necessários (updated_at automático, etc.)
- Enums PostgreSQL se aplicável

MÓDULOS E FUNCIONALIDADES (cada módulo com sub-features):
- Listar cada módulo do sistema com: descrição, componentes React, hooks, queries Supabase

AUTENTICAÇÃO COMPLETA:
- Fluxo: cadastro (email+senha), login, recuperação de senha, sessão persistente
- Guards: ProtectedRoute + middleware para rotas admin
- Profile automático via trigger handle_new_user() no banco

API / EDGE FUNCTIONS (cada função com especificação completa):
- Nome, método HTTP, body esperado com tipos TypeScript, validação Zod, ações, resposta 200/400/500

VARIÁVEIS DE AMBIENTE (todas necessárias com comentário de onde obter):
- VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, LOVABLE_API_KEY, etc.

ESTADOS DE UI OBRIGATÓRIOS em cada módulo:
- Loading: Skeleton com mesma estrutura do conteúdo real
- Empty state: ícone + mensagem + CTA contextual
- Error: mensagem inline + retry
- Success: toast sonner ou mensagem inline

CHECKLIST DE ENTREGA (mínimo 25 itens concretos e verificáveis):
- Cada item deve ser verificável em produção (não genérico)
- Ex: "Login com email válido redireciona para /dashboard" ✓
- Ex: "Rota /admin bloqueia usuário com role=user" ✓`
  },

  "frontend": {
    title: "Frontend Completo",
    platform: "Lovable",
    instructions: `Gere um prompt ULTRA-DETALHADO de frontend React para este sistema. Especifique cada componente, estado e interação:

DESIGN SYSTEM EM CÓDIGO (implementar em index.css + tailwind.config.ts):
- CSS Variables com valores HSL reais: --primary: X X% X%, --accent: X X% X%, etc.
- Google Fonts: especificar família, pesos, subset=latin, display=swap via @import
- Tailwind config: fontFamily com as fontes escolhidas, extend.colors mapeando as CSS vars
- Componentes shadcn/ui a instalar: lista exata (Button, Card, Dialog, Form, Input, etc.)

ESTRUTURA DE COMPONENTES (árvore completa):
- pages/: uma por rota, responsável por layout e composição
- components/ui/: shadcn customizados
- components/[feature]/: componentes específicos de cada módulo
- hooks/: um hook por recurso de dados (useProjects, useAuth, useProfile, etc.)
- lib/: utils.ts, validations.ts (Zod schemas), supabase.ts

CADA PÁGINA (especificar):
- Nome do arquivo, rota correspondente, guard (público/autenticado)
- Seções/componentes que compõem a página
- Dados carregados (useQuery key, tabela Supabase, select fields)
- Estados: loading skeleton, empty state, error state
- Animações de entrada (Framer Motion: fade-up com stagger se lista de cards)

FORMULÁRIOS (cada um com especificação completa):
- Campos: nome, tipo HTML, validação Zod, mensagem de erro
- React Hook Form + zodResolver
- Submit: loading state no botão, toast de sucesso/erro
- Sem animação Framer Motion em inputs (afeta UX)

RESPONSIVIDADE (cada layout):
- Mobile-first: especificar breakpoints tailwind (sm/md/lg/xl)
- Grids: ex: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
- Navigation: mobile = Sheet/Drawer, desktop = Sidebar ou Topbar

ACESSIBILIDADE (WCAG 2.1 AA):
- Contraste mínimo 4.5:1 para texto
- Labels associados a inputs (não só placeholder)
- aria-label em botões icon-only
- Focus visible em todos os interativos
- Skip to content link

ESTADOS DE UI (padrão para todos os componentes):
- Loading: Skeleton com mesma estrutura do conteúdo real (não spinner genérico)
- Empty: ícone Lucide relevante + título + subtítulo + CTA
- Error: Alert vermelho com mensagem amigável + retry button
- Success: toast sonner com ícone verde`
  },

  "backend": {
    title: "Backend / API",
    platform: "Supabase",
    instructions: `Gere um prompt COMPLETO de backend com especificação técnica de nível enterprise para todas as Edge Functions e configurações Supabase:

EDGE FUNCTIONS (uma seção completa por função):
Cada função deve incluir:
- Nome do arquivo: supabase/functions/[nome]/index.ts
- Método HTTP e rota de chamada
- Autenticação: verificar JWT via createClient com header Authorization
- CORS: corsHeaders completo incluindo todos os x-supabase-client-* headers
- Input: body JSON com interface TypeScript exata + validação Zod schema
- Lógica de negócio: passo a passo das operações
- Integração Supabase: queries específicas (tabela, filtros, campos)
- Integração AI (se aplicável): callAIWithFallback com system+user prompts
- Output: tipo de retorno, formato JSON de sucesso
- Tratamento de erros: 400 (validação), 401 (auth), 429 (rate limit), 500 (interno)
- Exemplo de Response: { data: {...} } ou { error: "mensagem amigável" }

RLS POLICIES (cada tabela com políticas completas):
-- Exemplo de nível esperado:
CREATE POLICY "users_select_own" ON public.tabela
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON public.tabela
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Especificar para SELECT, INSERT, UPDATE, DELETE separadamente
-- Incluir políticas admin com has_role() quando necessário

WEBHOOKS E INTEGRAÇÕES EXTERNAS:
- Endpoint de webhook: URL do Make.com/Zapier, payload exato
- Validação do payload antes de enviar
- Retry logic em caso de falha do webhook externo
- Idempotência: como evitar duplicações

AUTENTICAÇÃO E AUTORIZAÇÃO:
- Trigger handle_new_user: INSERT em profiles com campos do raw_user_meta_data
- Roles: enum app_role, tabela user_roles, função has_role() SECURITY DEFINER
- Middleware de sessão: verificar auth.uid() em todas as operações
- JWT decode: extrair user_id do token para queries

STORAGE (se aplicável):
- Nome dos buckets, policies de acesso (public/private)
- Upload via supabase.storage.from(bucket).upload(path, file)
- URL de acesso: supabase.storage.from(bucket).getPublicUrl(path)

CONFIGURAÇÕES (supabase/config.toml):
- Listar cada função com verify_jwt = false se necessário
- Email templates customizados se aplicável

VARIÁVEIS DE AMBIENTE DA FUNÇÃO:
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- APIs externas: nome da var, de onde obter, formato esperado`
  },

  "database": {
    title: "Esquema do Banco de Dados",
    platform: "Supabase",
    instructions: `Gere o schema SQL COMPLETO e PRODUCTION-READY para este sistema. Nível de detalhe esperado = um DBA sênior revisaria e aprovaria sem alterações:

SCHEMA COMPLETO (cada tabela com):
CREATE TABLE public.[tabela] (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- todos os campos com: tipo PostgreSQL exato, DEFAULT, NOT NULL/NULL, CHECK constraints
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

TIPOS DE DADOS CORRETOS:
- Texto curto (<255): text ou varchar(N) com justificativa
- Texto longo: text
- Números inteiros: integer ou bigint
- Decimais: numeric(precision, scale) — ex: numeric(10,2) para dinheiro
- Booleanos: boolean NOT NULL DEFAULT false
- Datas: timestamptz (sempre com fuso) ou date
- Arrays: text[] ou uuid[]
- JSON flexível: jsonb (não json)
- Enums: CREATE TYPE public.nome_enum AS ENUM (...)

ÍNDICES (cada um com justificativa de performance):
CREATE INDEX idx_[tabela]_[campo] ON public.[tabela]([campo]);
-- Justificativa: "Query X filtra por este campo frequentemente"
-- Incluir índices compostos quando query usa múltiplos campos no WHERE

ROW LEVEL SECURITY (completo para cada tabela):
ALTER TABLE public.[tabela] ENABLE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "[tabela]_select_policy" ON public.[tabela]
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy INSERT, UPDATE, DELETE separadamente
-- Políticas especiais para tabelas compartilhadas ou públicas

TRIGGERS ESSENCIAIS:
-- updated_at automático
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.[tabela]
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- handle_new_user (se profiles existir)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, ...) VALUES (NEW.id, ...);
  RETURN NEW;
END;
$$;

FUNÇÕES DE BANCO (SECURITY DEFINER):
-- Para operações que precisam bypassar RLS:
CREATE OR REPLACE FUNCTION public.is_owner(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM [tabela] WHERE id = _id AND user_id = auth.uid())
$$;

RELACIONAMENTOS (diagrama textual):
-- Descrever cada FK com cardinalidade e comportamento ON DELETE
-- Ex: projects (N) → profiles (1): ON DELETE CASCADE

SEEDS / DADOS INICIAIS:
-- INSERT de dados obrigatórios para funcionamento (ex: categorias padrão, planos, roles)

CHECKLIST DE INTEGRIDADE:
-- [ ] Todas as tabelas com RLS habilitado
-- [ ] Todas as FKs com ON DELETE definido
-- [ ] Triggers de updated_at em todas as tabelas mutáveis
-- [ ] Índices em todas as FKs e campos de busca frequente`
  },

  "dashboard": {
    title: "Dashboard Analítico",
    platform: "Lovable",
    instructions: `Gere um prompt completo para dashboard analítico com métricas reais, visualizações e UX de produto maduro:

LAYOUT DO DASHBOARD:
- Sidebar colapsável com navegação principal
- Topbar com: breadcrumb, search global, notifications bell, avatar dropdown
- Grid de KPIs no topo: 4 cards com métrica principal, variação vs período anterior, ícone, cor de tendência
- Seção de gráficos: 2 colunas (linha temporal + pizza/barra)
- Tabela de dados recentes com paginação

COMPONENTES DE VISUALIZAÇÃO (Recharts):
- LineChart para métricas temporais: definir dataKey, color (#HEX específico), dot, tooltip customizado
- BarChart para comparações: multiple bars com cores do design system
- PieChart ou DonutChart para distribuições: com legenda customizada
- ResponsiveContainer em todos os gráficos
- Tooltip customizado com font-mono para números e formatação em pt-BR

KPI CARDS (especificar cada um):
- Título, valor atual (formatado: moeda/percentual/número), variação percentual
- Cor da variação: verde se positivo, vermelho se negativo
- Ícone Lucide relevante
- Loading skeleton: mesma estrutura do card preenchido

FILTROS:
- Seletor de período: Hoje / 7 dias / 30 dias / 90 dias / Personalizado
- Filtros adicionais por categoria/status: chips multi-select
- Estado dos filtros em Zustand (persistir na URL via searchParams)
- Contador de resultados filtrados

DADOS E QUERIES:
- useQuery para cada bloco de dados com staleTime adequado
- Derivar métricas no cliente com useMemo (não recalcular no servidor)
- Refresh automático a cada 5 minutos para métricas live

RESPONSIVIDADE:
- Mobile: KPIs em grid 2x2, gráficos em coluna única, tabela com scroll horizontal
- Tablet: KPIs em 2x2, gráficos em 2 colunas
- Desktop: KPIs em 1x4, layout completo

ESTADOS ESPECIAIS:
- Loading: Skeleton para cada seção (KPIs, gráficos, tabela)
- Empty: "Nenhum dado no período selecionado" com ícone BarChart e CTA
- Error: Alert com retry + timestamp da última atualização bem-sucedida`
  },

  "mvp": {
    title: "MVP — Versão Mínima",
    platform: "Lovable",
    instructions: `Gere um prompt de MVP com escopo RIGIDAMENTE CONTROLADO. O objetivo é o menor produto que valida a hipótese central com menos de 2 semanas de implementação:

PRINCÍPIO DO MVP:
- Definir claramente a hipótese central que o MVP valida
- Critério de corte: "se a funcionalidade não ajuda a validar a hipótese, não entra no MVP"
- Lista explícita de "O que NÃO está no MVP" (funcionalidades futuras)

FUNCIONALIDADES CORE (mínimo viável):
- Máximo 3-4 funcionalidades que cobrem o fluxo principal do usuário
- Cada funcionalidade: nome, descrição em 1 frase, critério de "está pronto"
- Fluxo do usuário de ponta a ponta: cadastro → ação principal → resultado

STACK SIMPLIFICADA (sem over-engineering):
- React + Vite + Tailwind + shadcn/ui (não customizar — usar defaults)
- Supabase Auth + 1-3 tabelas no banco (apenas o essencial)
- Zero Edge Functions no início (usar Supabase client direto quando possível)
- Sem integrações externas (webhook, CRM, analytics vem depois)

BANCO DE DADOS (mínimo):
- Máximo 3-4 tabelas com apenas campos obrigatórios
- Schema simples, sem triggers complexos, sem enums (usar text com validação no frontend)
- RLS básica: usuário vê apenas seus próprios dados

DESIGN INTENCIALMENTE SIMPLES:
- Usar componentes shadcn/ui sem customização visual
- Cores do tema padrão (neutro, profissional)
- Zero animações Framer Motion (economizar tempo)
- Layout funcional > layout bonito neste estágio

CHECKLIST DE LANÇAMENTO DO MVP (itens obrigatórios):
- [ ] Cadastro e login funcionando
- [ ] Fluxo principal end-to-end sem erros
- [ ] Mobile responsivo (375px, 768px)
- [ ] Zero console.error em produção
- [ ] Deploy na Vercel funcionando
- [ ] URL pública compartilhável

MÉTRICAS DE VALIDAÇÃO (definir antes de construir):
- Métrica primária: o que vai medir para validar a hipótese?
- Threshold de sucesso: "se X usuários fizerem Y em Z dias, o MVP foi validado"
- Como coletar: evento GA4 ou tabela de tracking no banco`
  },

  "premium": {
    title: "Versão Premium / Completa",
    platform: "Lovable",
    instructions: `Gere um prompt para a versão COMPLETA e PREMIUM do produto com todas as funcionalidades avançadas, integrações e experiências diferenciadas:

FUNCIONALIDADES AVANÇADAS (além do MVP):
- Listar cada funcionalidade premium com: descrição, valor para o usuário, complexidade estimada
- Diferenciadores competitivos: o que torna esta versão única no mercado

SISTEMA DE PLANOS E MONETIZAÇÃO:
- Definir tiers (Free/Pro/Enterprise ou equivalente)
- Por tier: funcionalidades disponíveis, limites (storage, uso de IA, projetos)
- Tabela plan_limits no banco com os limites
- Guards de feature: verificar tier antes de ações premium
- Upgrade flow: modal com comparação de planos + CTA de upgrade

INTEGRAÇÕES EXTERNAS AVANÇADAS:
- Para cada integração: OAuth flow ou API key, dados trocados, frequência de sync
- Webhooks de entrada e saída com retry logic e idempotência
- Rate limiting por usuário para chamadas de API externa

PERSONALIZAÇÃO E CONFIGURAÇÕES:
- Perfil completo: avatar upload (Supabase Storage), preferências, notificações
- Workspace/organização: convidar membros, roles, permissões granulares
- Tema: light/dark/system via next-themes

IA E AUTOMAÇÃO:
- Descrever cada feature de IA: input, modelo usado, output, como exibir (stream vs batch)
- Lovable AI Gateway para modelos sem API key extra
- Cache de resultados de IA no banco para evitar reprocessamento

PERFORMANCE E ESCALA:
- Paginação cursor-based para listas grandes (não offset)
- Busca full-text: tsvector + GIN index no PostgreSQL
- Cache de queries frequentes: TanStack Query staleTime configurado
- Lazy loading de componentes pesados: React.lazy + Suspense

OBSERVABILIDADE:
- Logs estruturados nas Edge Functions (console.log com JSON)
- Error boundaries em todos os módulos críticos
- Tracking de eventos GA4 nas ações principais do usuário

CHECKLIST DE PRODUÇÃO (25+ itens):
- Cada item verificável em ambiente de produção real`
  },

  "correction": {
    title: "Prompt de Correção de Bugs",
    platform: "Lovable",
    instructions: `Gere um prompt estruturado e METÓDICO de debugging específico para este tipo de sistema. Nível de detalhe de um engenheiro sênior resolvendo bugs em produção:

MAPA DE BUGS COMUNS (por categoria):

AUTENTICAÇÃO E SESSÃO:
- Sessão expira silenciosamente sem redirecionar para login
- Token JWT inválido não tratado — sistema quebra sem mensagem
- Refresh token não implementado — usuário deslogado após 1h
- Verificação: supabase.auth.onAuthStateChange implementado?

QUERIES E BANCO DE DADOS:
- Query sem RLS retorna dados de outros usuários
- N+1 queries em listas (um fetch por item da lista)
- Falta de tratamento de erro em .from().select() — data pode ser null
- Missing await em operações assíncronas
- Verificação: todas as queries têm .eq("user_id", user.id)?

FORMULÁRIOS E VALIDAÇÃO:
- Submit múltiplo — usuário clica 2x e cria duplicata
- Validação apenas no frontend sem validação no backend (Edge Function)
- Zod parse sem .safeParse() — throws em vez de retornar erro amigável
- Limpeza do formulário após submit não implementada

ESTADO E RE-RENDERS:
- useEffect com dependency array incorreto — loop infinito ou dados obsoletos
- Estado não resetado ao trocar de rota — dados do item anterior aparecem
- Race condition: dois fetches concorrentes, o mais antigo sobrescreve o mais recente
- QueryClient não invalidado após mutação — UI desatualizada

EDGE FUNCTIONS:
- CORS headers ausentes em respostas de erro (apenas em 200)
- Erro não tratado retorna HTML de erro do Deno em vez de JSON
- Body não lido antes de retornar erro — Response(null) em vez de Response(JSON)
- Segredo não configurado — função quebra silenciosamente em produção

CHECKLIST DE DEBUGGING (executar em ordem):
1. [ ] Abrir DevTools → Console → verificar erros JavaScript
2. [ ] DevTools → Network → verificar chamadas de API (status, payload, response)
3. [ ] Supabase → Logs → verificar erros nas Edge Functions
4. [ ] Testar com usuário diferente — bug é do usuário ou do sistema?
5. [ ] Verificar se bug ocorre em mobile (375px)
6. [ ] Verificar se bug ocorre em incógnito (sessão limpa)

FIXES PARA CADA CATEGORIA:
- Código de correção específico para cada tipo de bug listado acima
- Padrão defensivo a adotar em novos componentes`
  },

  "refactoring": {
    title: "Refatoração e Otimização",
    platform: "Lovable",
    instructions: `Gere um prompt de refatoração TÉCNICA e ESTRATÉGICA focado em performance, manutenibilidade e arquitetura limpa:

ANÁLISE DE DEBT TÉCNICO (identificar antes de refatorar):
- Componentes > 300 linhas: candidatos a split
- useEffect com múltiplas responsabilidades: separar por concern
- Props drilling > 3 níveis: candidato a Context ou Zustand
- Lógica duplicada em múltiplos componentes: extrair para hook/util

COMPONENTIZAÇÃO (regras de divisão):
- Single Responsibility: cada componente faz UMA coisa
- Container vs Presentational: separar lógica de dados da UI
- Composição via children/slots em vez de props complexas
- Co-location: arquivos relacionados na mesma pasta

CUSTOM HOOKS (extrair para):
- useAuth: tudo de autenticação (session, user, signIn, signOut)
- use[Resource]: fetch, loading, error, mutações para cada recurso
- useLocalStorage: persistência local com TypeScript generics
- useDebounce: para inputs de busca

PERFORMANCE (identificar e corrigir):
- Memoização seletiva: React.memo apenas em componentes com props estáveis e renders frequentes
- useMemo: cálculos derivados de listas grandes
- useCallback: handlers passados como props para componentes memoizados
- TanStack Query staleTime: configurar por tipo de dado (ex: config=5min, feed=30s)
- Code splitting: React.lazy para páginas e modais pesados

TYPESCRIPT STRICTNESS:
- Eliminar todos os 'any' — substituir por tipos específicos ou unknown
- Tipar respostas do Supabase com Database['public']['Tables']['tabela']['Row']
- Interfaces vs Types: preferir interface para objetos, type para unions
- Zod schemas exportados e reutilizados entre frontend e backend

LIMPEZA DE CÓDIGO:
- Remover console.log esquecidos
- Remover imports não utilizados
- Remover comentários óbvios (/* volta para a home */ — desnecessário)
- Nomear funções de handler de forma consistente: handleVerbNoun

ARQUITETURA DE PASTAS (estrutura final esperada):
src/
├── components/ui/          # shadcn/ui
├── components/[feature]/   # componentes de feature
├── hooks/                  # custom hooks
├── pages/                  # pages/routes
├── lib/                    # utils, validations, constants
├── stores/                 # Zustand stores
└── types/                  # TypeScript interfaces

CHECKLIST DE QUALIDADE (cada item verificável):
- [ ] Zero warnings no TypeScript strict mode
- [ ] Zero componentes > 300 linhas
- [ ] Zero props drilling > 2 níveis
- [ ] Todos os useEffect com cleanup function quando necessário
- [ ] Bundle size: analisar com vite-bundle-visualizer`
  },

  "multiplatform": {
    title: "Multiplataforma (Bubble/Bolt)",
    platform: "Bubble",
    instructions: `Gere um prompt adaptado para plataformas no-code com especificidade operacional que permite implementação direta no Bubble ou Bolt:

BUBBLE — ESTRUTURA DO PROJETO:

DATA TYPES (tabelas equivalentes no Bubble):
- Para cada entidade: nome, campos com tipos Bubble (text/number/date/boolean/list/file/geographic address)
- Privacy rules por tipo: condição de visibilidade e modificação
- Ex: User → Projects: "This Projects's Created By = Current User"

WORKFLOWS (lógica de negócio):
- Por ação do usuário: trigger (event), condições, steps em ordem
- Nomenclatura: [Página]-[Ação] (ex: Dashboard-CreateProject)
- Backend workflows para operações críticas (sem exposição no frontend)

PÁGINAS E ELEMENTOS:
- Listar cada página com: nome, URL, restrição de acesso
- Grupos e containers principais por página
- Repeating Groups: data source, filtros, ordenação
- Input elements: validators, initial content, placeholder

ESTILOS (design system no Bubble):
- Cores como styles reutilizáveis (Primary #HEX, Secondary #HEX, etc.)
- Fontes: carregar via Google Fonts no header
- Styles por tipo de elemento: Button-Primary, Button-Secondary, Card, Input

PLUGINS NECESSÁRIOS (Bubble marketplace):
- Listar cada plugin com justificativa de uso
- Configurações de cada plugin após instalação
- API Connector: configurar cada endpoint externo

API CONNECTOR (integrações externas):
- Endpoint: nome, URL, método, headers, parâmetros, tipo de dado retornado
- Como mapear resposta para o Data Type do Bubble

BOLT — ESTRUTURA EQUIVALENTE:
- Components a criar, rotas, stores de estado
- Equivalências: Bubble Workflow → Bolt action/event handler`
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TYPES — SITES
// ─────────────────────────────────────────────────────────────────────────────
const WEBSITE_PROMPT_TYPES: Record<string, { title: string; platform: string; instructions: string }> = {

  "site_master": {
    title: "Prompt Mestre do Site",
    platform: "Lovable",
    instructions: `Crie o prompt mestre COMPLETO para construir o site do zero no Lovable. Nível de detalhe: um desenvolvedor sênior deve conseguir construir o site inteiro a partir deste prompt sem fazer nenhuma pergunta.

STACK TÉCNICA (especificar versões e justificativas):
- React 18 + Vite + TypeScript strict
- Tailwind CSS v3 com CSS Variables para design system (nunca hardcode)
- shadcn/ui como base de componentes, customizado para o design system
- Framer Motion (apenas above-the-fold e key interactions, com prefers-reduced-motion)
- React Router v6 com SSG-like via React + Vite (ou Next.js com renderização por rota se aplicável)
- TanStack Query v5 para dados assíncronos (CMS, formulários)
- react-hook-form + Zod para todos os formulários
- Sonner para toasts

DESIGN SYSTEM COMPLETO (valores HEX → HSL reais e específicos):
implementar em index.css:
:root {
  --background: [HSL do fundo principal];
  --foreground: [HSL do texto principal];
  --primary: [HSL da cor principal da marca];
  --accent: [HSL da cor de destaque];
  --muted: [HSL de texto secundário];
  --border: [HSL de bordas];
  [demais variáveis...]
}

Tipografia (Google Fonts, 2 fontes no máximo):
- Display: "[Fonte Display]" — pesos 600, 700, 800 — para H1, H2, CTAs
- Body: "[Fonte Body]" — pesos 400, 500, 600 — para parágrafos e UI

Escala tipográfica com classes Tailwind exatas:
- H1: text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1]
- H2: text-3xl md:text-4xl font-display font-semibold
- [H3, Body, Small, etc. completos]

Microinterações (padrão global):
- Entrada: { opacity: 0, y: 24 } → { opacity: 1, y: 0 }, duration: 0.5s, ease: [0.22, 1, 0.36, 1]
- Stagger entre cards: delay 0.08s por item
- Hover em cards: scale(1.01) duration 0.2s

MAPA DO SITE COMPLETO (cada seção com layout detalhado):
- Descrever cada seção: Hero, Diferenciais, CTA, etc.
- Por seção: fundo, colunas, conteúdo exato, texto real (não placeholder), CTA, animações

FORMULÁRIO DE CONTATO (especificação completa):
- Campos, validação Zod, submit para API/webhook, estados de loading/success/error

SEO (cada página):
- title pattern, meta description, Open Graph tags, JSON-LD type por página
- robots.txt: bloquear /api/**, permitir tudo mais
- sitemap.xml dinâmico

RESPONSIVIDADE:
- Breakpoints testados: 375px, 768px, 1024px, 1440px
- Cada layout de seção nos 4 breakpoints

ACESSIBILIDADE:
- Contraste mínimo 4.5:1 para texto, 3:1 para texto grande
- Landmarks semânticos: header, main, nav, footer, section com aria-label
- Skip to content link

CHECKLIST DE ENTREGA (25+ itens verificáveis):
- [ ] Lighthouse ≥ 90 em Performance, Acessibilidade, SEO
- [ ] Formulário enviado chega no destino correto
- [ ] JSON-LD válido em schema.org/validator
- [ ] Meta OG pré-visualiza corretamente no WhatsApp
- [...]`
  },

  "site_copy": {
    title: "Copywriting e Textos",
    platform: "Geral",
    instructions: `Gere o copywriting COMPLETO e PRONTO PARA USO em todas as seções do site. Nível de qualidade: copy de agência premium, orientado a conversão, adaptado ao nicho específico.

PARA CADA SEÇÃO DO SITE, entregar:
1. Headline principal (H1/H2): impactante, com benefício específico, máximo 10 palavras
2. Subheadline: expandir o benefício, 1-2 linhas, sem jargão
3. Corpo do texto: 2-3 parágrafos que constroem credibilidade + desejo + urgência
4. CTA Primário: verbo de ação + benefício (ex: "Otimize Minha Presença Digital" > "Saiba Mais")
5. CTA Secundário: opção menos comprometida (ex: "Ver Casos de Sucesso")
6. Microcopy: textos de apoio (labels, tooltips, mensagens de erro/sucesso, placeholders)

SEÇÃO HERO:
- Badge de credibilidade acima do H1 (ex: "Certificado Google · Meta · LinkedIn")
- H1 que endereça a dor principal do público-alvo específico
- Proposta de valor única em 1-2 frases (diferente dos concorrentes)
- Prova social: "Mais de X empresas confiam em nós" ou métrica real

SEÇÕES DE BENEFÍCIOS/DIFERENCIAIS:
- 3-4 títulos curtos (3-5 palavras) + 1 frase de expansão cada
- Foco em benefícios, não features (o QUE o cliente ganha, não o que você faz)

DEPOIMENTOS (template para coletar e formatar):
- Estrutura: problema → solução → resultado mensurável
- Formato: "[Resultado específico] em [Tempo]. [Como foi trabalhar]. [Nome, Cargo, Empresa]"

SEÇÃO SOBRE/MANIFESTO:
- Narrativa da fundação: por que a empresa existe (problema que resolvemos)
- Abordagem diferenciada: como fazemos diferente
- Tom: humano, direto, sem corporativismo

SEO COPYWRITING (para cada página):
- Meta title: keyword principal + marca, máximo 60 caracteres
- Meta description: benefício + CTA implícito, máximo 155 caracteres
- H1 único por página com keyword principal natural
- Alt text para imagens: descritivo e contextual, não keyword stuffing

VARIAÇÕES A/B PARA HERO:
- Versão A: headline focada em dor (o problema do cliente)
- Versão B: headline focada em transformação (o resultado)
- Testar: CTA "Falar com Especialista" vs "Ver Como Funciona"

TOM DE VOZ:
- Definir: formal/casual, técnico/acessível, sério/leve — com base no tom definido
- Exemplo de vocabulário a usar e a evitar
- Como tratar objeções comuns nos textos`
  },

  "site_seo": {
    title: "Estratégia SEO Completa",
    platform: "Geral",
    instructions: `Gere uma estratégia SEO COMPLETA e IMPLEMENTÁVEL, adaptada ao nicho específico do site:

PESQUISA DE KEYWORDS (por página principal):
Formato de entrega por página:
- URL: /[slug]
- Keyword primária: [keyword] — volume estimado, dificuldade
- Keywords secundárias (3-5): [lista] — uso no H2, H3 e corpo
- Long-tail (3-5): [lista] — para blog e FAQs
- Intenção de busca: informacional / transacional / navegacional

META TAGS (cada página, valores específicos):
<title>: keyword principal + | + nome da marca (máx 60 chars)
<meta name="description">: benefício + CTA implícito (máx 155 chars)
<link rel="canonical">: URL canônica completa
<meta name="robots">: index,follow ou noindex para páginas de admin
Open Graph (por página):
  og:title, og:description, og:image (1200x630px), og:url, og:type

JSON-LD STRUCTURED DATA (por tipo de página):
Home:
  - Organization: name, url, logo, contactPoint, sameAs (redes sociais)
  - WebSite: com SearchAction para sitelinks searchbox

Serviços/Produtos:
  - Service: name, provider, serviceType, areaServed, description

Cases/Portfolio:
  - WebPage com Review (se depoimento presente)
  - BreadcrumbList: Home > Cases > [Título]

Blog Post:
  - BlogPosting: headline, author (Person), datePublished, dateModified, image, wordCount, articleBody

Contato:
  - ContactPage + LocalBusiness (se local) ou Organization

TECHNICAL SEO CHECKLIST:
- [ ] Um único H1 por página com keyword principal
- [ ] H2-H6 hierárquicos e com keywords secundárias naturais
- [ ] Alt text em todas as imagens (descritivo, com keyword quando natural)
- [ ] next/image para otimização automática WebP/AVIF
- [ ] Preload de LCP image (above-the-fold)
- [ ] Preconnect para Google Fonts e CDNs externos
- [ ] HTTPS com redirect 301 de HTTP
- [ ] canonical tag para evitar conteúdo duplicado
- [ ] Sitemap.xml com todas as URLs incluindo blog posts
- [ ] robots.txt bloqueando /admin, /api, /_next
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

ESTRATÉGIA DE CONTEÚDO (3 meses):
- Mês 1: 4 artigos — [temas específicos ao nicho, baixa dificuldade]
- Mês 2: 4 artigos — [temas intermediários, busca transacional]
- Mês 3: 4 artigos + 1 landing page de comparação (ex: "[Empresa] vs Concorrentes")
- Calendário: por que esses temas, nessa ordem, nesse prazo

LINK BUILDING PARA O NICHO:
- Diretórios relevantes do setor
- Sites de review (G2, Capterra, Trustpilot se aplicável)
- Parceiros para guest posts
- Oportunidades de PR digital`
  },

  "site_design": {
    title: "Design System e Identidade Visual",
    platform: "Figma / Lovable",
    instructions: `Gere o design system COMPLETO E IMPLEMENTÁVEL para o site, com valores específicos prontos para copiar em código:

CSS VARIABLES (implementar em index.css, valores HSL):
:root {
  /* Cores base */
  --background:       [H S% L%]; /* ex: 0 0% 100% */
  --foreground:       [H S% L%]; /* texto principal */
  --primary:          [H S% L%]; /* cor da marca */
  --primary-foreground: [H S% L%];
  --secondary:        [H S% L%];
  --secondary-foreground: [H S% L%];
  --accent:           [H S% L%]; /* destaques e CTAs */
  --accent-foreground: [H S% L%];
  --muted:            [H S% L%];
  --muted-foreground: [H S% L%];
  --border:           [H S% L%];
  --input:            [H S% L%];
  --ring:             [H S% L%];
  --destructive:      [H S% L%];
  --card:             [H S% L%];
  --card-foreground:  [H S% L%];
  
  /* Variáveis extras do site */
  --color-hero-bg:    [H S% L%]; /* fundo do hero */
  --gradient-hero:    linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  --shadow-card:      0 4px 6px -1px hsl(var(--foreground) / 0.1);
  --shadow-card-hover: 0 10px 25px -5px hsl(var(--primary) / 0.2);
  --radius:           0.75rem; /* rounded-xl */
}

.dark { [versão dark de todas as variáveis] }

TIPOGRAFIA (Google Fonts com import e configuração Tailwind):
@import url('https://fonts.googleapis.com/css2?family=[FonteDisplay]:wght@600;700;800&family=[FonteBody]:wght@400;500;600&display=swap');

tailwind.config.ts:
fontFamily: {
  display: ['"[FonteDisplay]"', 'sans-serif'],
  sans:    ['"[FonteBody]"', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'],
}

ESCALA TIPOGRÁFICA (classes Tailwind completas):
- hero-title:    font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight
- section-title: font-display text-3xl md:text-4xl font-semibold leading-[1.2]
- card-title:    font-display text-xl md:text-2xl font-semibold
- body-large:    font-sans text-lg leading-relaxed text-[color:var(--muted-foreground)]
- body:          font-sans text-base leading-relaxed
- caption:       font-sans text-sm text-[color:var(--muted-foreground)]
- metric:        font-mono text-3xl font-semibold text-[color:var(--primary)]

COMPONENTES CUSTOMIZADOS (Button variants):
Button primary:   bg-[color:var(--primary)] text-[color:var(--primary-foreground)]
                  px-6 py-3 rounded-[var(--radius)] font-display font-semibold text-sm
                  shadow-sm hover:shadow-md hover:brightness-110 transition-all duration-200

Button secondary: bg-transparent border border-[color:var(--border)]
                  text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-all

Button ghost:     text-[color:var(--primary)] hover:bg-[color:var(--accent)]/10 transition-all

Card:             bg-[color:var(--card)] border border-[color:var(--border)]
                  rounded-[calc(var(--radius)+4px)] p-6
                  shadow-sm hover:shadow-[var(--shadow-card-hover)]
                  hover:border-[color:var(--primary)]/30 transition-all duration-200

Badge accent:     bg-[color:var(--primary)]/10 text-[color:var(--primary)]
                  px-3 py-1 rounded-full text-xs font-semibold font-display

GRID SYSTEM (layouts de cada seção):
- Hero: 2 colunas assimétricas (60%/40%) ou 1 coluna centralizada
- Features: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Cases: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Testimonial: centralizado max-w-3xl

ESPAÇAMENTO:
- Section padding: py-16 md:py-24 lg:py-32
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Gap entre cards: gap-6 md:gap-8

MICROINTERAÇÕES (Framer Motion, padrão global):
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};
const staggerContainer = { animate: { transition: { staggerChildren: 0.08 } } };
// Hover em card: whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}`
  },

  "site_sections": {
    title: "Código de Cada Seção",
    platform: "Lovable",
    instructions: `Gere prompts ULTRA-DETALHADOS para implementar cada seção individualmente, com especificação de layout, código e conteúdo real:

PARA CADA SEÇÃO ESCOLHIDA, entregar:

1. LAYOUT EXATO:
- Estrutura HTML semântica (section > div.container > ...)
- Sistema de grid: colunas, gaps, alinhamentos específicos
- Fundo: cor/gradiente usando CSS variables
- Padding e margin em todos os breakpoints

2. COMPONENTES INTERNOS:
- Listar cada elemento filho com: tipo HTML, classes Tailwind exatas, conteúdo real
- Props necessárias para componentes reutilizáveis
- Ícones Lucide usados (nome exato do componente)
- next/image com width, height, alt, priority corretos

3. COMPORTAMENTO RESPONSIVO:
- Mobile (375px): layout de coluna única, tamanhos de texto reduzidos
- Tablet (768px): início de grid 2 colunas
- Desktop (1280px): layout final com todas as colunas
- Overflow: como listas longas são tratadas em mobile

4. ANIMAÇÕES FRAMER MOTION:
- scroll-trigger via whileInView com { once: true, margin: "-100px" }
- initial/animate states exatos com valores
- Stagger entre items de lista com variantes
- Reducted motion: import da media query e condicionamento

5. CONTEÚDO PLACEHOLDER REALISTA:
- Textos do nicho específico (não Lorem Ipsum)
- Métricas e dados plausíveis para o setor
- Nomes, cargos, empresas fictícios mas verossímeis para o nicho

6. VARIAÇÃO DE LAYOUT ALTERNATIVO:
- Descrever uma variação (ex: cards vs lista, centralizado vs assimétrico)
- Quando usar cada variação

SEÇÕES OBRIGATÓRIAS A COBRIR:
- Hero com elemento visual dinâmico
- Seção de features/diferenciais
- Seção de cases/portfolio com grid filtrável
- Depoimento/social proof
- FAQ com acordeão
- CTA final
- Footer completo (links, redes sociais, copyright, newsletter)`
  },

  "site_performance": {
    title: "Performance e Otimização",
    platform: "Geral",
    instructions: `Guia TÉCNICO E COMPLETO de performance para atingir Lighthouse 95+ em mobile e desktop:

CORE WEB VITALS (cada métrica com estratégia):

LCP (Largest Contentful Paint) — alvo: < 2.5s:
- Identificar o elemento LCP (normalmente hero image ou H1)
- next/image com priority={true} para imagens acima da dobra
- Preload manual: <link rel="preload" as="image" href="/hero.webp">
- Fontes: <link rel="preconnect" href="https://fonts.googleapis.com">
- Evitar render-blocking JS: carregar scripts com defer/async
- Servidor: resposta < 600ms (TTFB)

CLS (Cumulative Layout Shift) — alvo: < 0.1:
- Definir width e height em TODAS as imagens (evitar layout shift)
- Reservar espaço para embeds e anúncios com aspect-ratio
- Fontes: font-display: swap para evitar FOIT
- Não inserir conteúdo acima de conteúdo existente (exceto fixed/sticky)

INP (Interaction to Next Paint) — alvo: < 200ms:
- Não bloquear main thread com JSON.parse de payloads grandes
- Debounce em inputs de busca (300ms)
- Carregamento lazy de componentes não críticos
- Evitar layouts síncronos forçados (ler + escrever DOM no mesmo frame)

IMAGENS:
- next/image em TODAS as imagens (WebP/AVIF automático)
- sizes prop precisa: sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
- Blur placeholder: blurDataURL via plaiceholder ou base64 de thumbnail
- Lazy loading: priority={false} para imagens abaixo da dobra (padrão next/image)
- Formato de upload: aceitar apenas JPEG/PNG/WebP, recusar BMP/TIFF

FONTES:
- next/font/google: preload e self-hosting automático
- Apenas os pesos realmente usados: subset: ["latin"], display: "swap"
- Variable fonts quando disponível (reduz arquivos)

JAVASCRIPT:
- Bundle analysis: vite-bundle-visualizer para identificar dependências pesadas
- React.lazy + Suspense para componentes > 10KB não críticos
- Tree-shaking: importar apenas o que usa (ex: import { format } from 'date-fns' não import * as)
- Evitar: moment.js (usar date-fns), lodash completo (usar lodash-es individual)

CSS:
- Tailwind purge automático em produção (zero CSS não usado)
- CSS crítico inlined automaticamente pelo Next.js
- Evitar CSS-in-JS em componentes de server

CACHING E HEADERS:
next.config.ts:
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ]
}]

CHECKLIST LIGHTHOUSE:
- [ ] Performance ≥ 95 mobile e desktop
- [ ] LCP < 2.5s (real device, slow 4G)
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] FCP < 1.8s
- [ ] TBT < 200ms
- [ ] Sem render-blocking resources
- [ ] Todas as imagens com explicit width/height
- [ ] Preconnect para domínios de terceiros`
  },

  "site_forms": {
    title: "Formulários e Integrações",
    platform: "Lovable",
    instructions: `Prompt completo para implementar todos os formulários do site com validação, integrações e conformidade LGPD:

STACK DE FORMULÁRIOS:
- react-hook-form + zodResolver (não useState por campo)
- Zod schemas exportados de lib/validations.ts (reutilizar no backend)
- Sonner para toasts de feedback
- Lucide para ícones de estado (CheckCircle, AlertCircle, Loader2)

PARA CADA FORMULÁRIO, especificar:

1. SCHEMA ZOD (completo, com mensagens em PT-BR):
const [NomeForm]Schema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "WhatsApp inválido"),
  // ... todos os campos com validações específicas
});

2. CAMPOS E VALIDAÇÕES (cada campo):
- Tipo HTML correto: input[type="email"], tel, textarea, select
- Label com htmlFor vinculado ao id do input
- Mensagem de erro inline abaixo do campo (text-destructive text-sm)
- Placeholder: exemplo realista do que preencher

3. MÁSCARA (para telefone/CPF/CNPJ):
- Usar IMask ou implementação manual sem biblioteca pesada
- WhatsApp: (XX) XXXXX-XXXX
- CPF: XXX.XXX.XXX-XX
- CNPJ: XX.XXX.XXX/XXXX-XX

4. ESTADOS DO BOTÃO:
- Default: "Enviar" ou CTA específico
- Loading: <Loader2 className="animate-spin" /> + "Enviando..."
- Sucesso: <CheckCircle /> + "Enviado!" — disabled por 3s
- Erro: botão volta ao default + mensagem de erro inline

5. INTEGRAÇÃO (para cada destino):
Edge Function:
  - POST /api/[endpoint]
  - Body: tipar com schema Zod no backend também
  - Validação server-side obrigatória (nunca confiar só no frontend)
  - Webhook para CRM: fetch(MAKE_WEBHOOK_URL, { body: JSON.stringify(data) })
  - Persistir no banco via Supabase

6. ANTI-SPAM:
- Honeypot: campo hidden name="website" — se preenchido, rejeitar
- Rate limiting: máx 3 submits por IP por hora (verificar no backend)
- Recaptcha v3 (score > 0.5) para formulários críticos

LGPD (obrigatório em formulários que coletam dados pessoais):
- Checkbox de aceite (required): "Li e concordo com a [Política de Privacidade](link)"
- Texto: "Seus dados serão usados exclusivamente para [finalidade específica]"
- Armazenar consentimento no banco: user_id/email + timestamp + IP + purpose`
  },

  "site_ecommerce": {
    title: "Loja / E-commerce",
    platform: "Lovable",
    instructions: `Prompt completo para loja virtual integrada, desde o catálogo até o checkout e gestão de pedidos:

BANCO DE DADOS (tabelas específicas de e-commerce):
CREATE TABLE public.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_price numeric(10,2), -- preço "de" (riscado)
  stock         integer NOT NULL DEFAULT 0,
  sku           text UNIQUE,
  images        text[] NOT NULL DEFAULT '{}',
  category_id   uuid REFERENCES categories(id),
  is_active     boolean NOT NULL DEFAULT true,
  metadata      jsonb DEFAULT '{}', -- variações, atributos extras
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE public.orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id),
  email         text NOT NULL, -- para guest checkout
  status        order_status NOT NULL DEFAULT 'pending',
  items         jsonb NOT NULL, -- snapshot dos produtos
  subtotal      numeric(10,2) NOT NULL,
  discount      numeric(10,2) DEFAULT 0,
  shipping      numeric(10,2) DEFAULT 0,
  total         numeric(10,2) NOT NULL,
  payment_id    text, -- ID do Stripe/MercadoPago
  shipping_address jsonb,
  coupon_code   text,
  created_at    timestamptz DEFAULT now()
);

CREATE TYPE order_status AS ENUM ('pending','paid','processing','shipped','delivered','cancelled','refunded');

FLUXO DO CHECKOUT (4 etapas):
1. Carrinho: lista de itens, quantidades, subtotal, campo de cupom
2. Identificação: login ou guest (nome + email + CPF)
3. Entrega: endereço com CEP (autocomplete via ViaCEP API), cálculo de frete
4. Pagamento: Stripe Elements ou MercadoPago Checkout Bricks

CARRINHO (persistência):
- localStorage com JSON.stringify dos items
- Zustand store: useCartStore com actions (addItem, removeItem, updateQty, clearCart)
- Sync com banco quando usuário loga (merge de carrinhos)

GATEWAY DE PAGAMENTO:
Stripe:
  - Criar PaymentIntent no backend (Edge Function)
  - Stripe Elements no frontend (Stripe.js)
  - Webhook: /api/stripe/webhook para confirmar pagamento (verificar assinatura)
  
MercadoPago:
  - Preference criada no backend
  - Checkout Pro (redirect) ou Bricks (embedded)
  - IPN webhook para status do pagamento

GESTÃO DE PEDIDOS (painel admin):
- Tabela com filtro por status, busca por email/ID
- Ações: marcar como enviado (input tracking code), cancelar, reembolsar
- Notificação email por status change (Resend API)

PERFORMANCE:
- Listagem com filtros server-side (não carregar todos os produtos no cliente)
- next/image com sizes otimizado para cards de produto
- Skeleton para listagem e detalhe durante carregamento`
  },

  "site_cms": {
    title: "Blog / Sistema de Conteúdo",
    platform: "Lovable",
    instructions: `Prompt completo para blog integrado com CMS, SEO otimizado e experiência de leitura premium:

CMS (especificar para o escolhido):

CONTENTFUL:
- Space ID + Access Token no .env
- Content models: BlogPost (title, slug, body [Rich Text], excerpt, coverImage, author, category, tags, publishedAt)
- lib/contentful.ts: funções getPosts(), getPostBySlug(), getCategories()
- ISR: revalidate: 600 (10min) na função do blog

NOTION API:
- Integration token no .env
- Database ID da tabela de posts
- Filtros: Published = true, ordenar por Date
- Renderizar blocos do Notion em React

MARKDOWN LOCAL:
- Pasta /content/posts com arquivos .mdx
- gray-matter para frontmatter (title, date, slug, excerpt, cover, author)
- next-mdx-remote para render
- Geração de slugs automática a partir do nome do arquivo

FUNCIONALIDADES DO BLOG:
Listagem:
- Grid 3 colunas (1 em mobile)
- ArtigoCard: capa (next/image), badge de categoria, título, excerpt (2 linhas truncadas), autor + data + tempo de leitura
- Filtros: por categoria (chips) e busca por título (client-side)
- Paginação: infinite scroll ou numerada (especificar qual)

Página do artigo:
- Prose typography: @tailwindcss/typography com customização (font-sans para body, font-display para headings)
- Tabela de conteúdo automática: extrair H2/H3 com IDs, sidebar sticky em desktop
- Progress bar de leitura: sticky no topo (2px, accent color)
- Tempo de leitura: Math.ceil(wordCount / 200) min
- Compartilhamento: links para Twitter, LinkedIn, WhatsApp, copiar URL

RICH TEXT / MDX CUSTOMIZAÇÕES:
- H2: text-2xl font-display font-semibold mt-10 mb-4
- H3: text-xl font-display font-semibold mt-8 mb-3
- Blockquote: border-l-4 border-primary pl-6 italic text-muted-foreground
- Code: bg-muted rounded px-1.5 py-0.5 font-mono text-sm
- Imagens: next/image com caption em italico
- Links: text-primary underline-offset-4 hover:underline

SEO DO BLOG:
- generateMetadata: title do post, description = excerpt, og:image = capa
- JSON-LD BlogPosting: headline, author (Person), datePublished, image, wordCount, articleBody (texto limpo)
- Breadcrumb JSON-LD: Home > Blog > [Título]
- Sitemap dinâmico incluindo todos os posts
- RSS feed: /feed.xml com todos os posts

NEWSLETTER / EMAIL CAPTURE:
- Form inline no final de cada post
- Edge Function: validar + adicionar à lista (Resend API / Mailchimp)
- LGPD: checkbox de consentimento obrigatório`
  },

  "site_deploy": {
    title: "Deploy e Go-Live",
    platform: "Vercel / Netlify",
    instructions: `Guia COMPLETO de deploy e lançamento, do zero ao site em produção:

VERCEL (configuração completa):

vercel.json (se necessário):
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ],
  "redirects": [
    { "source": "/home", "destination": "/", "permanent": true },
    { "source": "/portfolio", "destination": "/cases", "permanent": true }
  ]
}

VARIÁVEIS DE AMBIENTE (configurar no painel Vercel):
Produção + Preview:
  DATABASE_URL          # Supabase connection string
  NEXTAUTH_SECRET       # openssl rand -base64 32
  NEXTAUTH_URL          # https://seu-dominio.com
  CONTENTFUL_SPACE_ID   # painel.contentful.com > Settings > API Keys
  CONTENTFUL_ACCESS_TOKEN
  NEXT_PUBLIC_GA_ID     # Google Analytics 4 Measurement ID
  NEXT_PUBLIC_GTM_ID    # Google Tag Manager Container ID
  [todas as demais...]

CI/CD:
- Branch main → produção automático
- Branches feat/* e fix/* → preview deployments automáticos
- Verificação de build antes de merge (GitHub Actions ou Vercel checks)

DOMÍNIO CUSTOMIZADO:
1. Adicionar domínio em Vercel > Domains
2. Configurar DNS: CNAME www → cname.vercel-dns.com
3. Apex domain: A record → 76.76.21.21
4. SSL automático pela Vercel (Let's Encrypt)
5. Redirect: www → sem www (ou vice-versa, consistente)

MONITORAMENTO PÓS-DEPLOY:
- Vercel Analytics: ativar no painel (sem código extra)
- Speed Insights: @vercel/speed-insights package
- Error monitoring: Sentry (opcional) ou Vercel Log Drains
- Uptime monitoring: UptimeRobot (free) com alertas email

CHECKLIST DE LANÇAMENTO (executar em ordem):
- [ ] next build localmente sem erros ou warnings
- [ ] Todas as env vars configuradas em produção
- [ ] Formulário de contato testado e chegando no destino
- [ ] Google Analytics verificado (evento pageview aparecendo)
- [ ] Meta Pixel verificado (Events Manager mostrando PageView)
- [ ] robots.txt correto (não bloquear páginas públicas)
- [ ] Sitemap.xml acessível e enviado no Google Search Console
- [ ] JSON-LD validado em: schema.org/validator
- [ ] Meta OG testado: metatags.io ou cards-dev.twitter.com
- [ ] Performance: PageSpeed Insights mobile ≥ 90
- [ ] Responsividade: testar em 375px, 768px, 1440px
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Formulário com LGPD: checkbox de aceite funcionando
- [ ] 404 customizado com link para home
- [ ] Redirect de /home e páginas legado funcionando
- [ ] SSL: https:// funcionando sem aviso do browser
- [ ] Backup da env file em local seguro (1Password, Vault, etc.)
- [ ] Google Search Console: domínio verificado + sitemap enviado`
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS — elevated to enterprise level
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_APPS = `Você é um arquiteto de software sênior especialista em criar prompts para ferramentas de IA (Lovable, Bolt, Bubble, Supabase).
Você escreve prompts de NÍVEL ENTERPRISE: extremamente densos, estruturados, acionáveis e completos — prontos para uma IA construir sistemas profissionais sem fazer nenhuma pergunta.

PADRÃO DE QUALIDADE ESPERADO (referência: prompt de construção de agência digital v2.0):
- Rendering strategy por rota: especificar SSG/ISR/SSR com justificativa para cada rota
- Design system com CSS variables REAIS: valores HSL específicos (ex: --primary: 217 91% 60%)
- Schema de banco: CREATE TABLE com tipos PostgreSQL exatos, DEFAULT, NOT NULL, FK, RLS policies
- API Routes com: body tipado, validação Zod, ações em ordem, códigos de resposta 200/400/500
- Variáveis de ambiente: todas necessárias com comentário de onde obter (ex: "painel do Contentful > API Keys")
- Checklist verificável: 20+ itens concretos testáveis em produção

LINGUAGEM: português brasileiro técnico. Imperativo direto ("Implemente...", "Crie...", "Configure...").
EXEMPLOS: sempre com valores reais do projeto (nicho, funcionalidades, público) — nunca genéricos.
CÓDIGO: incluir snippets de código reais onde exemplifica conceitos (CREATE TABLE, esquema Zod, CSS variables).

ESTRUTURA OBRIGATÓRIA — use exatamente estas 7 seções:

## 1. CONTEXTO DO PROJETO
(O que é, para quem, qual problema resolve, diferenciais competitivos específicos)

## 2. STACK TÉCNICA
(Tecnologias com versões, estratégia de renderização por rota, justificativas técnicas)

## 3. MÓDULOS E FUNCIONALIDADES
(Lista detalhada de módulos com sub-features, componentes, hooks, queries)

## 4. BANCO DE DADOS
(Schema SQL completo com tipos, constraints, RLS policies, triggers, índices justificados)

## 5. REGRAS DE NEGÓCIO CRÍTICAS
(Validações, fluxos condicionais, guards de auth, rate limiting, tratamento de erros)

## 6. COMPORTAMENTO ESPERADO DA IA
(Design system com CSS variables reais, padrões de componentes, estados de UI, animações)

## 7. CRITÉRIOS DE ENTREGA
(Checklist de 20+ itens verificáveis em produção)`;

const SYSTEM_PROMPT_SITES = `Você é um especialista sênior em criação de sites modernos de alto desempenho: design, copywriting, SEO, performance e conversão.
Você escreve prompts de NÍVEL ENTERPRISE para construir sites completos com Lovable (React + Tailwind + shadcn/ui) — prontos para implementação imediata.

PADRÃO DE QUALIDADE ESPERADO (referência: prompt de construção de agência digital v2.0):
- Design system com CSS variables REAIS: valores HSL específicos (ex: --primary: 220 90% 56%)
- Google Fonts com pesos específicos (não "usar uma fonte bonita" — "Plus Jakarta Sans 600/700/800")
- Escala tipográfica com classes Tailwind EXATAS: "H1: text-5xl md:text-6xl font-display font-bold leading-[1.1]"
- Copywriting: textos REAIS adaptados ao nicho (não placeholders genéricos)
- Animações: Framer Motion com initial/animate/transition EXATOS (não "adicionar animação")
- Rendering strategy por rota: SSG/ISR/SSR com revalidate times e justificativa
- SEO: meta tags, JSON-LD types, robots.txt, sitemap — tudo especificado

LINGUAGEM: português brasileiro técnico. Imperativo direto. Textos reais do nicho.
CÓDIGO: incluir snippets CSS variables, classes Tailwind, configuração Framer Motion.

ESTRUTURA OBRIGATÓRIA — use exatamente estas 7 seções:

## 1. CONTEXTO E OBJETIVO DO SITE
(O que é o site, para quem, objetivo principal, diferencial de mercado, tom de voz)

## 2. STACK E FERRAMENTAS
(React + Vite + Tailwind + shadcn/ui, versões, integrações, CMS se aplicável)

## 3. ESTRUTURA DE PÁGINAS E SEÇÕES
(Mapa completo com rendering strategy por rota e descrição de cada seção)

## 4. DESIGN SYSTEM
(CSS variables com HSL reais, tipografia com Google Fonts + pesos + classes Tailwind, componentes customizados)

## 5. CONTEÚDO E COPYWRITING
(Textos REAIS de cada seção: H1, subheadline, body, CTAs primário e secundário)

## 6. SEO E PERFORMANCE
(Meta tags por página, JSON-LD types, Core Web Vitals targets, estratégias específicas)

## 7. CRITÉRIOS DE ENTREGA
(Checklist de 20+ itens verificáveis em produção — não genéricos)`;

// ─────────────────────────────────────────────────────────────────────────────
// MANDATORY QUALITY REQUIREMENTS (injected into every userPrompt)
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_REQUIREMENTS = `
REQUISITOS OBRIGATÓRIOS DE QUALIDADE (sem exceção):
✓ Mínimo 1.500 palavras — seja denso, específico, informativo
✓ Design system com CSS variables HSL REAIS (ex: --primary: 217 91% 60%) — nunca cores hardcoded
✓ Schema de banco com SQL COMPLETO (tipos PostgreSQL, constraints, RLS policies)
✓ Stack técnica com VERSÕES ESPECÍFICAS e rendering strategy por rota (SSG/ISR/SSR)
✓ API Routes/Edge Functions com: body tipado, validação Zod, ações, respostas 200/400/500
✓ Checklist de entrega com MÍNIMO 20 ITENS concretos e verificáveis em produção
✓ Variáveis de ambiente necessárias com comentário de ONDE OBTER cada uma
✓ Exemplos de dados REALISTAS do nicho (não "Lorem ipsum" ou "exemplo_generico")
✓ Cada funcionalidade com: nome, descrição, componente React, hook, query Supabase
✓ Estados obrigatórios em TODOS os módulos: loading (skeleton), empty, error, success
✗ PROIBIDO: generalidades vagas, placeholders genéricos, "usar uma fonte bonita", "adicionar animação"
✗ PROIBIDO: omitir campos de schema, omitir políticas RLS, omitir tratamento de erros`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id, prompt_type } = await req.json();
    if (!project_id || !prompt_type) {
      return new Response(JSON.stringify({ error: "project_id e prompt_type são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSiteType = prompt_type.startsWith("site_");
    const typeConfig = isSiteType ? WEBSITE_PROMPT_TYPES[prompt_type] : PROMPT_TYPES[prompt_type];

    if (!typeConfig) {
      return new Response(JSON.stringify({ error: "Tipo de prompt inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const websiteMeta = (project.metadata as Record<string, unknown>) ?? {};

    const siteContext = isSiteType ? `
**Dados específicos do site:**
Tipo de site: ${websiteMeta.website_type ?? project.type ?? "Não definido"}
Estilo visual: ${websiteMeta.website_style ?? "Não definido"}
Tom de comunicação: ${websiteMeta.website_tone ?? "Não definido"}
Seções desejadas: ${(websiteMeta.website_sections as string[] ?? []).join(", ") || "Não definidas"}
Tem e-commerce: ${websiteMeta.website_has_ecommerce ? "Sim" : "Não"}
Tem blog/CMS: ${websiteMeta.website_has_blog ? "Sim" : "Não"}
CMS escolhido: ${websiteMeta.website_cms ?? "Sem CMS"}
Tem formulário: ${websiteMeta.website_has_form ? "Sim" : "Não"}
` : "";

    const systemPrompt = isSiteType ? SYSTEM_PROMPT_SITES : SYSTEM_PROMPT_APPS;

    const userPrompt = `Gere um prompt profissional do tipo "${typeConfig.title}" para o seguinte projeto:

**Projeto:** ${project.title}
**Tipo:** ${project.type ?? "Não definido"}
**Nicho:** ${project.niche ?? "Não definido"}
**Plataforma:** ${project.platform ?? "Não definida"}
**Complexidade:** ${project.complexity ?? 3}/5
**Público-alvo:** ${project.audience ?? "Não definido"}
**Ideia original:** ${project.original_idea ?? "Não fornecida"}
**Funcionalidades:** ${(project.features ?? []).join(", ") || "Nenhuma listada"}
**Integrações:** ${(project.integrations ?? []).join(", ") || "Nenhuma"}
**Monetização:** ${project.monetization ?? "Não definida"}
**Descrição:** ${project.description ?? "Não fornecida"}
${siteContext}

**Instrução específica para este tipo de prompt:**
${typeConfig.instructions}

${QUALITY_REQUIREMENTS}

Gere o prompt COMPLETO, DETALHADO e PRONTO PARA USO em ${typeConfig.platform}.
O prompt deve ser escrito diretamente para uma IA que vai construir o sistema/site — como se você fosse o engenheiro sênior passando a especificação completa para o Lovable executar.
Adapte TODOS os exemplos, tecnologias, textos e dados ao contexto específico deste projeto (nicho: ${project.niche ?? "definir"}, público: ${project.audience ?? "definir"}).
Comece DIRETAMENTE com "## 1." — sem introduções, sem "Aqui está o prompt:", sem meta-comentários.`;

    // Increased to 8192 for enterprise-level prompts
    const content = await callAIWithFallback(systemPrompt, userPrompt, 8192, 0.6);

    const tokensEstimate = Math.round(content.length / 4);

    const { data: existingPrompts } = await supabase
      .from("prompts")
      .select("version")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .eq("type", prompt_type)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existingPrompts && existingPrompts.length > 0
      ? (existingPrompts[0].version + 1)
      : 1;

    const { data: savedPrompt, error: saveError } = await supabase
      .from("prompts")
      .insert({
        project_id,
        user_id: user.id,
        type: prompt_type,
        title: typeConfig.title,
        content,
        platform: typeConfig.platform,
        version: nextVersion,
        tokens_estimate: tokensEstimate,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify({ prompt: savedPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    console.error("generate-prompt error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
