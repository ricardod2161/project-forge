import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, BarChart3, BookTemplate, CheckCircle, Star, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const features = [
  { icon: Zap, title: "Gerador de Prompts", desc: "10 tipos de prompts prontos para usar em qualquer plataforma de IA." },
  { icon: BarChart3, title: "Score de Qualidade", desc: "Avaliação em 7 dimensões com gráfico radar e recomendações." },
  { icon: BookTemplate, title: "Templates por Nicho", desc: "Mais de 20 nichos pré-estruturados prontos para customizar." },
  { icon: CheckCircle, title: "Revisão Automática", desc: "A IA identifica lacunas, riscos e inconsistências no projeto." },
  { icon: Sparkles, title: "Arquitetura Completa", desc: "Módulos, telas, banco de dados e regras de negócio gerados automaticamente." },
  { icon: Star, title: "Exportação Multiplataforma", desc: "Lovable, Bubble, Bolt ou documentação técnica — você escolhe." },
];

const plans = [
  { name: "Free", price: "R$ 0", features: ["3 projetos ativos", "10 prompts/mês", "Templates básicos", "Score de qualidade"] },
  { name: "Pro", price: "R$ 47/mês", popular: true, features: ["Projetos ilimitados", "Prompts ilimitados", "Todos os templates", "Revisão automática por IA", "Exportação completa"] },
  { name: "Expert", price: "R$ 147/mês", features: ["Tudo do Pro", "Multi-usuário (5 membros)", "White-label do output", "Onboarding personalizado", "SLA de suporte"] },
];

const howItWorks = [
  { step: "01", title: "Descreva sua ideia", desc: "Escreva livremente sobre o sistema que quer construir. A IA refina e expande automaticamente." },
  { step: "02", title: "IA arquiteta o projeto", desc: "Módulos, telas, banco de dados e regras de negócio são gerados com base no seu nicho e complexidade." },
  { step: "03", title: "Exporte e construa", desc: "Prompts prontos para Lovable, Bubble ou Bolt. Copie e construa seu sistema em horas." },
];

const faqs = [
  { q: "O que é o Arquiteto IA?", a: "É uma plataforma que usa inteligência artificial para transformar ideias de software em arquitetura completa: módulos, telas, banco de dados, regras de negócio e prompts prontos para desenvolvimento." },
  { q: "Preciso saber programar para usar?", a: "Não. O Arquiteto IA é projetado para fundadores, product managers e empreendedores que querem estruturar sistemas sem conhecimento técnico profundo." },
  { q: "Os prompts funcionam com qual plataforma?", a: "Os prompts são otimizados para Lovable, mas também funcionam com Bolt, Bubble, Cursor, GPT-4, Claude e qualquer ferramenta que aceite instruções de texto." },
  { q: "Posso exportar a documentação?", a: "Sim. No plano Pro e Expert você pode exportar toda a arquitetura em texto estruturado, Markdown ou JSON para usar em qualquer ferramenta." },
  { q: "Como funciona o Score de Qualidade?", a: "A IA avalia o projeto em 7 dimensões (Escopo, Estrutura, Técnico, Completude, Viabilidade, Monetização e Maturidade) e retorna um score de 0 a 100 com recomendações de melhoria." },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface/50 transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
};

const LandingPage = () => {

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Arquiteto <span className="text-gradient">IA</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow transition-all duration-200"
              )}
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Grade de pontos animada */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-radial-primary" />

        <div className="relative container max-w-4xl mx-auto text-center px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8",
              "bg-primary/10 border border-primary/20 text-primary"
            )}>
              <Sparkles className="w-3 h-3" />
              Plataforma de Arquitetura de Software com IA
            </span>
          </motion.div>

          <motion.h1
            className="font-display font-bold text-2xl md:text-3xl leading-tight mb-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            De ideia a sistema completo.{" "}
            <span className="text-gradient">Em minutos.</span>
          </motion.h1>

          <motion.p
            className="text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            O Arquiteto IA transforma qualquer conceito em arquitetura profissional, documentação técnica, prompts prontos e estrutura completa para desenvolvimento com IA.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/cadastro"
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-100"
              )}
            >
              Criar meu primeiro projeto — grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#funcionalidades"
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium",
                "border border-border text-foreground",
                "hover:border-primary/50 hover:bg-surface transition-all duration-200"
              )}
            >
              Ver funcionalidades
            </a>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-xl md:text-2xl mb-4">
              Como funciona em <span className="text-gradient">3 passos</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {howItWorks.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }} viewport={{ once: true }}
                className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-glow">
                  <span className="font-display font-bold text-primary text-lg">{step.step}</span>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute left-full top-7 w-8 h-px bg-border -translate-x-4" />
                )}
                <h3 className="font-display font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-xl md:text-2xl mb-4">
              Tudo que você precisa para{" "}
              <span className="text-gradient">arquitetar software</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa com IA especializada em cada etapa do processo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className={cn(
                  "p-6 rounded-xl border border-border glass-card",
                  "hover:border-primary/30 hover:shadow-glow transition-all duration-300 group"
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 px-6 bg-surface/30">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-xl md:text-2xl mb-4">
              Planos simples e <span className="text-gradient">transparentes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={cn(
                  "p-6 rounded-xl border",
                  plan.popular
                    ? "border-primary/50 shadow-glow bg-card"
                    : "border-border bg-card"
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                {plan.popular && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                    <Star className="w-2.5 h-2.5" /> Mais popular
                  </span>
                )}
                <h3 className="font-display font-bold text-sm mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-foreground mb-5">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/cadastro"
                  className={cn(
                    "block text-center py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    plan.popular
                      ? "bg-gradient-primary text-primary-foreground hover:shadow-glow"
                      : "border border-border hover:border-primary/40 hover:bg-surface"
                  )}
                >
                  Começar agora
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-xl md:text-2xl mb-4">
              Pronto para ter uma equipe sênior{" "}
              <span className="text-gradient">trabalhando por você?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Comece gratuitamente. Nenhum cartão de crédito necessário.
            </p>
            <Link
              to="/cadastro"
              className={cn(
                "inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
              )}
            >
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xs">Arquiteto IA</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Arquiteto IA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
