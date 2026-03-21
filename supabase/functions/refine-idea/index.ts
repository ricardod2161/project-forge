import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithFallback } from "../_shared/ai-providers.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea } = await req.json();
    if (!idea || idea.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Ideia muito curta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um product manager e arquiteto de software sênior com 20 anos de experiência.
Sua tarefa é refinar e expandir descrições de ideias de software, tornando-as mais claras, completas e tecnicamente precisas.
Regras:
- Preserve a essência original da ideia do usuário
- Adicione detalhes técnicos relevantes que o usuário não mencionou
- Identifique o tipo de sistema implícito (SaaS, App, ERP, etc.)
- Sugira funcionalidades essenciais que obviamente seriam necessárias
- Seja específico sobre fluxos de usuário e casos de uso
- Escreva em português brasileiro, tom profissional mas acessível
- Máximo 300 palavras — seja denso e informativo, não verboso`;

    const userPrompt = `Refine e expanda esta ideia de software:

"${idea}"

Retorne APENAS a ideia refinada, sem introduções como "Ideia refinada:" ou explicações sobre o que você fez. Escreva diretamente o texto melhorado.`;

    const refined = await callAIWithFallback(systemPrompt, userPrompt, 600, 0.7, "llama-3.1-8b-instant");

    return new Response(JSON.stringify({ refined }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    console.error("refine-idea error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns segundos e tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
