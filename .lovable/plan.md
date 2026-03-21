
## Aba "Páginas" com mockups visuais (como a aba Telas dos sistemas)

### Diagnóstico

A aba **"Telas"** dos sistemas (modo `system`) já tem a experiência completa:
1. Gera documentação via IA (`generate-ai-content` com `content_type: "screens"`)
2. Faz parse da documentação para extrair nomes de telas
3. Renderiza cards de mockup para cada tela com botão "Gerar Mockup"
4. Usa `ScreensWithMockups` + `ScreensTabWrapper` para tudo isso

A aba **"Páginas"** dos sites (modo `website`) hoje usa apenas `AIContentTabWrapper` → renderiza só markdown de texto, sem mockups visuais.

### Solução

Criar um `PagesTabWrapper` para sites, análogo ao `ScreensTabWrapper` dos sistemas, mas adaptado para sites:

**1. Reutilizar `ScreensWithMockups`** — o componente já é genérico o suficiente. Basta passar:
- `content_type: "site_pages"` na geração de texto
- `platform_type: "Web"` no `generate-screen-mockup`
- Um parser de seções de site (baseado nos padrões do conteúdo `site_pages`)

**2. Adaptar o parser de telas para sites** — o conteúdo gerado por `site_pages` usa cabeçalhos como:
```
## Página: Home / ## 1. Home / ## Seção: Hero / ## Página Principal
```
O `parseScreens` existente já cobre alguns padrões com `## Página: X`. Precisa garantir que também cubra `## 1. Home`, `## Seção: Hero`, etc.

**3. Criar `PagesTabWrapper`** em `ProjectDetailPage.tsx`, análogo ao `ScreensTabWrapper`:
```tsx
const PagesTabWrapper = ({
  projectId,
  persistedContent,
  onContentGenerated,
  projectMetadata,
  onUpdateMetadata,
}: ...) => {
  // Mesma lógica de ScreensTabWrapper mas com:
  // - content_type: "site_pages"
  // - titulo e descrição adaptados para sites
  // - plataforma: "Web" (sempre desktop)
};
```

**4. Substituir no render** — linha 1540:
```tsx
// Antes:
{activeTab === "pages" && isWebsite && <AIContentTabWrapper ... contentType="site_pages" .../>}

// Depois:
{activeTab === "pages" && isWebsite && <PagesTabWrapper
  projectId={project.id}
  persistedContent={aiContentCache["site_pages"] ?? null}
  onContentGenerated={handleContentGenerated}
  projectMetadata={(project.metadata as Record<string, unknown>) ?? {}}
  onUpdateMetadata={(patch) => updateProject.mutate({ metadata: patch as never, _silent: true } as never)}
/>}
```

**5. Textos em português no `ScreensWithMockups`** — o componente já está em PT-BR exceto alguns detalhes. Verificar que os textos "Telas" → "Páginas" e "Tela" → "Seção" aparecem corretos. Para isso, vamos adicionar props opcionais:
```tsx
interface ScreensWithMockupsProps {
  // ...existing...
  sectionLabel?: string;       // "tela" ou "seção/página"
  emptyTitle?: string;         // override do título do empty state
  emptyDescription?: string;   // override da descrição
}
```

### Arquivo alterado

Apenas **`src/pages/app/ProjectDetailPage.tsx`** — adicionar `PagesTabWrapper` (≈50 linhas) e substituir o render da aba `pages` na linha 1540.

Opcionalmente, pequeno ajuste em `src/components/ScreensWithMockups.tsx` para aceitar `sectionLabel` prop e trocar "tela(s)" → "seção/seções" quando for modo site.

### Resultado visual

A aba "Páginas" ficará igual à aba "Telas" dos sistemas:
```
┌─────────────────────────────────────────────────────┐
│ 🤖 Gerado por IA  [5 seções] [2/5 mockups]  [Copiar][Regenerar] │
├─────────────────────────────────────────────────────┤
│ Documentação das páginas (markdown)                  │
├─────────────────────────────────────────────────────┤
│ 🖼 Mockups Visuais                    [Gerar Todos (3)] │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ │  Hero    │  │  Sobre   │  │  Serv.   │           │
│ │ [imagem] │  │ [Gerar]  │  │ [Gerar]  │           │
│ └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

Cada card: imagem gerada pela IA do visual da seção/página, com lightbox, download e regenerar.
