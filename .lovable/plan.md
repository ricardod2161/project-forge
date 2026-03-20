
## Auditoria Completa — Arquiteto IA

### Diagnóstico identificado

Lendo todo o codebase, identifiquei os problemas reais:

**PROBLEMA PRINCIPAL — "não consigo logar":**
O Supabase por padrão exige confirmação de e-mail antes do login. Quando o usuário cadastra, recebe e-mail de confirmação mas o app não informa isso — apenas redireciona para `/app` como se tivesse dado certo. No login, o Supabase retorna `"Email not confirmed"` mas o código exibe mensagem genérica sem orientar o usuário.

**SOBRE "admin com acesso a tudo":**
Não existe sistema de roles no banco ainda. Para o usuário atual ter acesso total ao app (sem bloqueios), a solução correta é: desabilitar confirmação de e-mail no Supabase Auth (para desenvolvimento) + corrigir o fluxo de cadastro para tratar o estado de "e-mail não confirmado" + adicionar o perfil do usuário logado no header com nome real e logout funcional.

### O que será feito neste plano

**1. Corrigir autenticação (raiz do problema)**
- Configurar auto-confirm de e-mail no Supabase (para que login funcione imediatamente após cadastro)
- Corrigir `CadastroPage`: após cadastro bem-sucedido, redirecionar direto para `/app` (pois o auto-confirm estará ativo)
- Corrigir `LoginPage`: exibir mensagem de erro específica quando e-mail não confirmado
- Corrigir `AppHeader`: conectar nome real do usuário via `useAuth`, logout funcional via `signOut`

**2. Corrigir console warnings (ForwardRef)**
- `LandingPage` e outros componentes não precisam de forwardRef mas o warning aparece por causa de uso em `<Route element={...}>` — verificar e corrigir

**3. Conectar header ao usuário real**
- `AppHeader` exibe "Usuário" hardcoded — conectar ao `user.email` e `user.user_metadata.full_name`
- Botão "Sair" chamar `signOut()` e redirecionar para `/login`
- Toggle de tema funcionar corretamente (atualmente usa classe `.light` mas o CSS usa `.light` no seletor — está correto, porém não persiste em localStorage)

**4. Dashboard conectado ao usuário**
- Exibir nome do usuário na saudação
- Métricas carregarão dados reais do banco (projetos count) via React Query

### Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `src/pages/auth/CadastroPage.tsx` | Remover redirect com timeout; redirecionar direto para `/app` |
| `src/pages/auth/LoginPage.tsx` | Tratar erro "Email not confirmed" com mensagem clara |
| `src/components/AppHeader.tsx` | Conectar useAuth, nome real, logout funcional, theme persist |
| `src/pages/app/DashboardPage.tsx` | Saudação com nome do usuário real |
| Supabase Auth config | Habilitar auto-confirm via ferramenta cloud--configure_auth |

### O que NÃO será feito agora (fora do escopo desta iteração)
- Sistema de roles admin (não foi especificado na spec original — "admin" aqui significa ter acesso ao app funcionando normalmente como dono dos dados)
- Implementação das outras páginas (wizard, prompts, etc.) — essas são etapas 3-9 do roadmap
- Banco de dados completo (18 tabelas) — isso é a Etapa 3

### Ordem de execução
1. Configurar auto-confirm de e-mail (Supabase Auth)
2. Corrigir `CadastroPage` e `LoginPage`
3. Corrigir `AppHeader` com dados reais e logout
4. Conectar `DashboardPage` ao usuário
