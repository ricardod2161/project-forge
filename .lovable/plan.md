
## Elevar a Inteligência da IA — Prompts de Nível Enterprise

### O problema identificado

O prompt de exemplo que você enviou tem qualidade **muito superior** ao que a IA está gerando hoje. A diferença está em 3 pontos:

**1. `generate-prompt/index.ts` — system prompt genérico demais**
O system prompt atual pede "7 seções estruturadas" mas não ensina a IA o *nível de detalhe* esperado. O exemplo tem:
- Estratégia de renderização por rota (SSG/ISR/SSR com justificativa)
- Design system com CSS variables reais (`--color-accent: #3B82F6`)
- Schema Prisma completo com enums, relações e campos
- API routes com corpo, validação Zod, ações e códigos de resposta
- Checklist verificável com itens concretos (não genéricos)

**2. `instructions` de cada tipo — muito curtas (1 linha)**
Exemplo atual do tipo `master`: _"Crie um prompt mestre completo para o Lovable que descreve todo o sistema..."_ — 1 frase. O exemplo real tem 12 seções densas.

**3. `userPrompt` — não injeta exemplos de nível**
A IA não sabe que precisa incluir especificações como "SSG para `/home`, ISR revalidate:3600 para `/cases/[slug]`" ou CSS variables hex reais.

---

### O que será alterado: apenas `supabase/functions/generate-prompt/index.ts`

**A. System prompt elevado** — ensiná-la com exemplos do formato exato:

Para sistemas: incluir exemplos de como escrever estratégia de renderização, design system com CSS variables, schema de banco, api routes com zod
Para sites: incluir exemplos de como escrever design system com CSS variables, estrutura de rotas com estratégias (SSG/ISR), copywriting por seção com H1/CTAs reais

**B. Instructions de cada tipo** — expandir de 1 linha para parágrafos densos com subitens específicos:

| Tipo | Instrução atual | Nova instrução |
|---|---|---|
| `master` | 1 frase | 10+ bullets: stack, renderização por rota, design tokens, schema, rules, auth, env vars, checklist |
| `frontend` | 1 frase | Componentes por página, design system tokens, responsividade, estados (loading/empty/error), acessibilidade |
| `backend` | 1 frase | Edge functions com validação Zod, RLS policies por tabela, webhooks, autenticação JWT |
| `database` | 1 frase | Schema com SQL completo, índices com justificativa, RLS, triggers, ERD |
| `mvp` | 1 frase | Scope reduzido com critérios de corte, time-to-market, funcionalidades core vs descartadas |
| `site_master` | 1 frase | Stack + rotas + rendering strategy + design tokens CSS + componentes + SEO + checklist |
| `site_design` | 1 frase | CSS variables com valores HEX reais, tipografia Google Fonts com pesos, escala tipográfica com classes Tailwind, microinterações |
| (demais) | similares | expansão proporcional |

**C. `userPrompt` elevado** — adicionar instruções de qualidade mínima:

```
O prompt deve OBRIGATORIAMENTE incluir:
- Especificação de rendering strategy por rota (SSG/ISR/SSR) com justificativa
- Design system com CSS variables reais (valores HEX específicos, não genéricos)  
- Schema de banco com SQL completo (tipos, constraints, defaults, RLS)
- API Routes com validação, corpo esperado e códigos de resposta
- Checklist verificável de entrega (20+ itens concretos, não genéricos)
- Variáveis de ambiente necessárias com comentário de onde obter
- Exemplos de dados realistas (não "Lorem ipsum" ou "exemplo_generico")
```

**D. `maxTokens` de 4096 → 8192** — prompts de nível enterprise precisam de mais tokens. O modelo Groq 70B suporta até 32K de output, então aumentar para 8192 sem custo adicional.

---

### Arquivo alterado

Apenas `supabase/functions/generate-prompt/index.ts` — sem tocar em UI, banco ou outras funções.

### Resultado esperado

Prompts gerados que incluam:
- Rendering strategy por rota (como no exemplo)
- CSS variables com HEX reais adaptadas ao nicho
- Schema Prisma/SQL com campos reais do projeto
- API routes completas com validação Zod
- Checklist verificável de 20+ itens
- Mínimo efetivo de 1.500 palavras (hoje gera ~900 médio)
