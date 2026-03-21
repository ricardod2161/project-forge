
## Liberar acesso admin completo para o usuário

### O que fazer

Apenas uma ação: atualizar o campo `plan` na tabela `profiles` do usuário `paulo ricardo` (user_id: `ffc37d9e-247b-4893-a13c-361de252f395`) de `free` para `expert`.

Isso resolve tudo de uma vez:
- Remove o banner "Plano Free / Limite atingido" do topo
- Remove o bloqueio de 3 projetos (FreePlanBanner some porque `plan !== 'free'`)
- PlansPage mostra "Expert" como plano atual
- Nenhuma lógica de gate ou paywall em outros lugares (confirmado: não existe paywall em `NewProjectPage`, `ProjectDetailPage` ou demais páginas)

### SQL a executar (migração)

```sql
UPDATE public.profiles
SET plan = 'expert'
WHERE user_id = 'ffc37d9e-247b-4893-a13c-361de252f395';
```

### Opcional: badge "Admin" no AppHeader/AppSidebar

Como você é o dono/admin do sistema, podemos também exibir um badge visual `Admin` ou `Expert` no cabeçalho do app ao lado do seu nome para identificação rápida. Isso seria puramente cosmético — apenas lê o `plan` do perfil já atualizado.

### Arquivos alterados
- Apenas migração SQL — zero alteração de código

### Resultado imediato
- Banner de limite some
- Plano exibido como "Expert" em Settings e Plans
- Todos os recursos liberados sem nenhuma restrição de UI
