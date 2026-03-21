import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

/**
 * Reusable empty state component — replaces ~8 inline implementations.
 * Supports icon, title, description, primary CTA and optional secondary CTA.
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) => {
  const ActionEl = ({ a, variant }: { a: EmptyStateAction; variant: "primary" | "secondary" }) => {
    const classes = cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
      variant === "primary"
        ? "bg-gradient-primary text-primary-foreground hover:shadow-glow"
        : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
    );
    if (a.to) return <Link to={a.to} className={classes}>{a.label}</Link>;
    return <button onClick={a.onClick} className={classes}>{a.label}</button>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border",
        compact ? "py-10 px-6" : "py-20 px-8",
        className
      )}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 shadow-glow">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      )}
      <p className="font-display font-semibold text-xs text-foreground mb-1.5 max-w-xs">{title}</p>
      {description && (
        <p className="text-2xs text-muted-foreground mb-6 max-w-xs leading-relaxed">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {action && <ActionEl a={action} variant="primary" />}
          {secondaryAction && <ActionEl a={secondaryAction} variant="secondary" />}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
