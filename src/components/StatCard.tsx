import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  trend?: string;        // e.g. "+12%" or "-5%"
  trendLabel?: string;   // e.g. "vs. último mês"
  description?: string;
  delay?: number;
  highlight?: boolean;
  className?: string;
}

/**
 * Premium metric/stat card for dashboards.
 * Supports trend indicators, loading skeleton, icon and optional highlight border.
 */
const StatCard = ({
  label,
  value,
  icon: Icon,
  loading = false,
  trend,
  trendLabel,
  description,
  delay = 0,
  highlight = false,
  className,
}: StatCardProps) => {
  const trendValue = trend ? parseFloat(trend) : null;
  const isPositive = trendValue !== null && trendValue > 0;
  const isNegative = trendValue !== null && trendValue < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive
    ? "text-success"
    : isNegative
    ? "text-destructive"
    : "text-muted-foreground";

  return (
    <motion.div
      className={cn(
        "relative p-5 rounded-xl border bg-card overflow-hidden",
        "hover:border-primary/25 hover:shadow-card-hover transition-all duration-200 group",
        highlight ? "border-primary/30 shadow-glow" : "border-border",
        className
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-radial-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
            highlight ? "bg-primary/20" : "bg-primary/10",
            "group-hover:bg-primary/20"
          )}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ) : (
          <>
            <motion.p
              className="font-display font-bold text-2xl text-foreground leading-none mb-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.15 }}
            >
              {value}
            </motion.p>

            {(trend || description) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {trend && (
                  <span className={cn("flex items-center gap-0.5 text-2xs font-semibold", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {trend}
                  </span>
                )}
                {trendLabel && (
                  <span className="text-2xs text-muted-foreground">{trendLabel}</span>
                )}
                {description && !trend && (
                  <span className="text-2xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
