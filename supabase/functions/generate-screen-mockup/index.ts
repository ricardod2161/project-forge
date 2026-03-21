import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Niche context injection ─────────────────────────────────────────────────────
function getNicheContext(niche: string): string {
  const n = niche.toLowerCase();
  if (n.includes("clínica") || n.includes("clinica") || n.includes("saúde") || n.includes("saude") || n.includes("médic") || n.includes("medic") || n.includes("hospital") || n.includes("health"))
    return "Patient records with name, CPF, CRM, appointment calendar, medical staff profiles, consultation history, prescription forms, insurance fields, SOAP notes, vital signs charts";
  if (n.includes("ecommerce") || n.includes("e-commerce") || n.includes("loja") || n.includes("varejo") || n.includes("store") || n.includes("shop"))
    return "Product catalog grid with photos, prices in BRL, cart summary, checkout steps, order tracking, SKU codes, inventory levels, customer reviews with stars, flash sale countdown timers";
  if (n.includes("financ") || n.includes("banco") || n.includes("pagamento") || n.includes("invest") || n.includes("contabil"))
    return "Balance cards with BRL values, line/bar charts with historical data, transaction list with dates and categories, portfolio pie chart, income vs expense comparison, bank account selector";
  if (n.includes("educa") || n.includes("curso") || n.includes("aula") || n.includes("school") || n.includes("learn") || n.includes("ensino"))
    return "Course card grid with thumbnails and progress bars, video player with timeline, lesson list with check marks, quiz interface with multiple choice, certificate badges, student progress charts";
  if (n.includes("imob") || n.includes("imóvel") || n.includes("imovel") || n.includes("aluguel") || n.includes("real estate"))
    return "Property cards with photos, price, address, sqm, bedrooms, map view with pins, filter sidebar with price range slider, virtual tour button, agent contact card";
  if (n.includes("restaur") || n.includes("food") || n.includes("delivery") || n.includes("cardápio") || n.includes("cardapio"))
    return "Menu categories with dish photos and prices, cart drawer, item customization modal, order status tracker with steps, delivery time estimate, rating stars, promo code input";
  if (n.includes("rh") || n.includes("recursos humanos") || n.includes("hr") || n.includes("recrutamento") || n.includes("people"))
    return "Employee directory with avatar grid, org chart, vacation calendar, payroll summary cards, performance review form with ratings, recruitment pipeline kanban, time tracking table";
  if (n.includes("logística") || n.includes("logistica") || n.includes("transpor") || n.includes("frota") || n.includes("entrega"))
    return "Route map with vehicle pins, shipment status cards, driver list with avatar and status badge, delivery timeline, package tracking code, fleet metrics dashboard";
  if (n.includes("agro") || n.includes("fazend") || n.includes("rural") || n.includes("farm"))
    return "Field map with crop zones, harvest progress bars, weather widget, pesticide application calendar, production yield charts, equipment maintenance schedule";
  if (n.includes("jurídic") || n.includes("juridic") || n.includes("advog") || n.includes("law") || n.includes("legal"))
    return "Case management list with status badges, document repository with file icons, deadline calendar, client profile with case history, billing hours tracker, court date alerts";
  return "Dashboard metrics with KPI cards, data table with sorting and filters, user management list, notification center, activity feed, settings form with toggles";
}

// ── Visual anchors per project type ────────────────────────────────────────────
function getStyleAnchors(type: string, niche: string): string {
  const t = (type + niche).toLowerCase();
  if (t.includes("saas") || t.includes("b2b") || t.includes("plataforma") || t.includes("platform"))
    return "Linear.app, Vercel Dashboard, Notion, Retool — clean SaaS with excellent typography and generous whitespace";
  if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("app"))
    return "Instagram, Uber, Nubank, iFood — polished native mobile apps with smooth gradients and clear tap targets";
  if (t.includes("ecommerce") || t.includes("loja") || t.includes("store"))
    return "Shopify, VTEX, Mercado Livre — modern e-commerce with clear product hierarchy and conversion-optimized layouts";
  if (t.includes("admin") || t.includes("backoffice") || t.includes("erp") || t.includes("crm"))
    return "Metabase, Grafana, HubSpot — data-dense admin panels with tight spacing and information-rich grids";
  if (t.includes("fintech") || t.includes("financ") || t.includes("banco"))
    return "Nubank, Inter, XP Investimentos — polished fintech with trust-building colors and clear numeric hierarchy";
  return "Figma, Linear, Vercel — professional software products with crisp typography and thoughtful component design";
}

// ── Component hints per screen type ────────────────────────────────────────────
function getComponentHints(screenName: string, isMobile: boolean): string {
  const name = screenName.toLowerCase();
  if (name.includes("login") || name.includes("auth") || name.includes("cadastro") || name.includes("acesso") || name.includes("sign"))
    return "centered card with logo at top, email input field with label, password field with show/hide toggle, primary CTA button, 'Forgot password' link below, divider with 'or', social login buttons (Google/GitHub), footer link to signup";
  if (name.includes("dashboard") || name.includes("painel") || name.includes("início") || name.includes("home") || name.includes("overview"))
    return isMobile
      ? "top greeting with user avatar, 2-column KPI cards row with numbers and trend arrows, scrollable recent activity list with avatar and action text, floating action button, bottom tab navigation"
      : "4 KPI stat cards in a row with icon, value and percentage change, large primary chart below (line or bar), recent activity table with avatar, date, description and status badge, quick action buttons in header";
  if (name.includes("perfil") || name.includes("configuração") || name.includes("settings") || name.includes("conta") || name.includes("profile"))
    return "profile header with large avatar circle, editable name and bio fields, section dividers with labels, toggle switches for notifications, plan badge, save button with loading state, danger zone section at bottom with red delete button";
  if (name.includes("lista") || name.includes("list") || name.includes("gerencia") || name.includes("items") || name.includes("registros"))
    return "search bar with filter icon, filter chips row (All, Active, Archived), sortable data table with checkbox column, avatar, name, date, status badge and action kebab menu, pagination controls with page numbers, row count indicator";
  if (name.includes("detalhe") || name.includes("detail") || name.includes("ver ") || name.includes("show") || name.includes("visualizar"))
    return "breadcrumb navigation at top, hero section with large title, metadata chips row, tab bar (Overview, Activity, Settings), content sections in cards, action button group in top right, sidebar with related information panel";
  if (name.includes("formulário") || name.includes("form") || name.includes("criar") || name.includes("novo") || name.includes("editar") || name.includes("cadastrar"))
    return "multi-section form with section headers, labeled input fields with helper text, select dropdowns, date pickers, file upload area with dashed border, form validation error messages in red, sticky footer with Cancel and Save buttons";
  if (name.includes("relatório") || name.includes("report") || name.includes("análise") || name.includes("analytic") || name.includes("métricas"))
    return "date range picker in header, summary stats row, primary line chart with tooltip, secondary bar chart, data breakdown table with sortable columns, export CSV/PDF button, filter sidebar panel";
  if (name.includes("notificação") || name.includes("notification") || name.includes("alertas") || name.includes("inbox"))
    return "segmented filter tabs (All, Unread, Mentions), notification items with left colored dot indicator, sender avatar, message preview, relative timestamp, mark-all-read button, empty state illustration when no notifications";
  if (name.includes("onboarding") || name.includes("boas-vindas") || name.includes("welcome") || name.includes("setup"))
    return "top step progress bar with numbered dots, large illustration or icon for current step, bold step title, description paragraph, back/next navigation buttons, skip option in corner";
  if (name.includes("calendar") || name.includes("calendário") || name.includes("agenda") || name.includes("schedule"))
    return "month/week/day view toggle, calendar grid with event blocks in different colors, today highlighted, event creation button, event detail popup on click, mini month navigator sidebar";
  if (name.includes("chat") || name.includes("mensage") || name.includes("message") || name.includes("conversa"))
    return "left sidebar with conversation list and search, main chat area with message bubbles (left/right), timestamp labels, typing indicator, attachment and emoji buttons in input, send button";
  return isMobile
    ? "sticky header with back arrow and title, scrollable main content with cards, pull-to-refresh indicator, floating action button at bottom right"
    : "left sidebar with navigation items and active state highlighting, main content area with cards and data sections, breadcrumb in top bar, user dropdown in header right";
}

function getNavHints(isMobile: boolean, platform: string): string {
  if (isMobile || platform.toLowerCase().includes("mobile") || platform.toLowerCase().includes("ios") || platform.toLowerCase().includes("android"))
    return "bottom tab bar with 4-5 icons and labels, top status bar with time and battery, back arrow in header, floating action button";
  return "fixed left sidebar (240px wide) with logo at top, grouped nav items with icons and labels, active item highlighted with primary color, top header bar with breadcrumbs, search icon and user avatar dropdown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      project_id,
      screen_name,
      screen_description,
      platform_type,
    } = await req.json() as {
      project_id: string;
      screen_name: string;
      screen_description: string;
      platform_type?: string;
    };

    if (!project_id || !screen_name) {
      return new Response(JSON.stringify({ error: "project_id e screen_name são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full project context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, type, niche, platform, audience, features, integrations, monetization, description")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    // Determine platform
    const effectivePlatform = platform_type ?? project.platform ?? "Web";
    const isMobile = ["mobile", "ios", "android", "react native", "flutter"].some(k => effectivePlatform.toLowerCase().includes(k));
    const resolution = isMobile ? "390×844px portrait (iPhone 15 Pro)" : "1440×900px widescreen (MacBook Pro)";
    const canvasSize = isMobile ? "390×844" : "1440×900";
    const aspectNote = isMobile ? "PORTRAIT orientation, tall mobile screen" : "LANDSCAPE widescreen desktop, 16:9 ratio";

    // Context enrichment
    const features = (project.features ?? []).slice(0, 8).join(", ") || "core application features";
    const integrations = (project.integrations ?? []).slice(0, 5).join(", ") || "none";
    const nicheContext = getNicheContext(project.niche ?? "");
    const styleAnchors = getStyleAnchors(`${project.type ?? ""} ${project.niche ?? ""}`, project.niche ?? "");
    const componentHints = getComponentHints(screen_name, isMobile);
    const navHints = getNavHints(isMobile, effectivePlatform);

    // ── ULTRA-REALISTIC HIERARCHICAL PROMPT ──────────────────────────────────────
    const imagePrompt = `CRITICAL INSTRUCTION: You must generate a PHOTOREALISTIC, HIGH-FIDELITY SCREENSHOT of a real, production-ready software application. This image must look EXACTLY like an actual screenshot captured from a live, deployed software product running on a real device.

THIS IS NOT:
- Not a wireframe
- Not a sketch or hand-drawn illustration  
- Not a low-fidelity mockup
- Not abstract art or concept art
- Not a flat icon set

THIS IS:
✓ A REAL SCREENSHOT of a fully rendered, pixel-perfect UI
✓ Every element fully rendered with actual colors, shadows, real typography
✓ Data populated with realistic, domain-specific content (no Lorem ipsum, no placeholder text)
✓ Looks exactly like what an end user would see when using the real app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application: "${project.title}"
Type: ${project.type ?? "SaaS Application"}
Industry / Niche: ${project.niche ?? "Technology"}
Target Audience: ${project.audience ?? "Professional users"}
Platform: ${effectivePlatform} — ${resolution} — ${aspectNote}
Core Features: ${features}
Integrations: ${integrations}
${project.description ? `Description: ${project.description}` : ""}

DOMAIN-SPECIFIC UI DATA TO INCLUDE:
${nicheContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN SPECIFICATION: "${screen_name}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${screen_description ? `Detailed description:\n${screen_description}\n` : `This is the ${screen_name} screen for ${project.title}.`}

MANDATORY UI COMPONENTS FOR THIS SCREEN:
${componentHints}

NAVIGATION PATTERN:
${navHints}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PIXEL-LEVEL RENDERING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANVAS: Render at exactly ${canvasSize}px — fill the ENTIRE canvas with NO blank areas, NO cropping, NO white padding

COLOR SYSTEM — Dark Professional Theme:
- Main backgrounds: #0d1117, #0f1117, #161b22, #1c2128 (deep charcoal/navy)
- Card surfaces: #21262d, #1e2430, #252d3d (slightly lighter cards)
- Primary accent: #4F8EF7 (electric blue) for CTAs, active states, links
- Secondary accent: #7B5CF0 (violet/indigo) for highlights, badges, charts
- Success: #22c55e (green) — Active, Complete, Online status
- Warning: #f59e0b (amber) — Pending, Review status
- Destructive: #ef4444 (red) — Error, Delete, Critical alerts
- Text primary: #e6edf3 (bright white/near-white)
- Text secondary: #8b949e (muted gray)
- Borders: #30363d (subtle separators)

TYPOGRAPHY — must be SHARP and READABLE:
- Page title: 20-24px, weight 700, color #e6edf3
- Section headers: 14-16px, weight 600
- Body text: 13-14px, weight 400, color #8b949e
- Labels and badges: 11-12px, weight 500
- Font family: clean sans-serif (Inter, SF Pro, or similar)
- ALL text must be crisp, anti-aliased, and readable — NO blurry text

UI COMPONENT RENDERING STANDARDS:
- Buttons: rounded corners (6-8px), proper padding, drop shadow, hover states visible
- Input fields: visible border (#30363d), focus ring in primary color, 8px border radius
- Cards: subtle border (#30363d), card background (#21262d), box-shadow for depth
- Icons: crisp, recognizable, 16-20px, aligned to baseline — use real icon shapes
- Badges/chips: pill shape, proper padding, colored backgrounds with matching text
- Tables: alternating row backgrounds, sticky header, clear column spacing
- Charts: colored fills, grid lines, axis labels, legend, tooltips if hovered
- Avatars: circular, 32-40px, initials or profile photo style
- Checkboxes/Toggles: fully rendered with active/inactive states
- Dropdowns: visible with chevron icon
- Progress bars: colored fill on gray track

SPACING GRID:
- Consistent 8px grid throughout
- Sidebar: 240px width (desktop)
- Card padding: 16-20px
- Section gaps: 16-24px

${isMobile ? `MOBILE STATUS BAR (top):
- Show iOS-style status bar: time (9:41) left, signal/wifi/battery icons right
- Safe area respected — content starts below status bar` : `DESKTOP WINDOW CHROME:
- Show browser-style top bar OR application chrome
- Titlebar with app name, window controls (minimize/maximize/close)`}

DATA QUALITY — REALISTIC CONTENT:
- Use domain-specific placeholder data relevant to ${project.niche ?? "the application domain"}
- Include realistic names, dates in dd/mm/yyyy format, Brazilian phone numbers if applicable
- Numbers should look realistic (not round numbers like 1000 or 100%)
- Status badges should show a mix of states (some active, some pending)
- Tables should show 4-6 rows of varied data
- Timestamps: "há 2 horas", "ontem", "12/03/2025"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visual quality level: ${styleAnchors}
The image must match the visual fidelity and professionalism of these references exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEGATIVE PROMPT — DO NOT INCLUDE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NO wireframe lines or sketchy outlines
NO hand-drawn or brushstroke elements
NO cartoon or illustration style
NO abstract shapes or geometric art
NO grey placeholder boxes
NO "Lorem ipsum" or placeholder text
NO empty/blank content areas (fill everything with realistic data)
NO white or light backgrounds (must be dark theme)
NO low-resolution or blurry rendering
NO stock photo collages
NO 3D perspective distortion (keep it flat-screen realistic)
NO text that says "placeholder", "image here", "coming soon"`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text().catch(() => "");
      console.error("AI Gateway error:", aiResponse.status, errText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract image from response — try multiple shapes
    const imageUrl =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      aiData.choices?.[0]?.message?.content?.find?.((c: { type: string }) => c.type === "image_url")?.image_url?.url ||
      null;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("Nenhuma imagem foi gerada pelo modelo");
    }

    // Parse base64 data
    let imageFormat = "png";
    let base64Data = imageUrl;

    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (base64Match) {
      imageFormat = base64Match[1];
      base64Data = base64Match[2];
    }

    // Decode base64 to bytes
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Storage using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sanitized = screen_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const filePath = `${user.id}/${project_id}/${sanitized}-${Date.now()}.${imageFormat}`;

    const { error: uploadError } = await serviceClient.storage
      .from("screen-mockups")
      .upload(filePath, bytes.buffer, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Fallback: return base64 directly (temporary)
      const fallbackUrl = base64Match ? imageUrl : `data:image/${imageFormat};base64,${base64Data}`;
      return new Response(
        JSON.stringify({ image_url: fallbackUrl, storage_path: null, persisted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = serviceClient.storage
      .from("screen-mockups")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        image_url: publicUrlData.publicUrl,
        storage_path: filePath,
        persisted: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-screen-mockup error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
