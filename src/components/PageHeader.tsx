import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Reusable page-level header used across all app pages.
 * Provides consistent title hierarchy, optional badge and action slot.
 */
const PageHeader = ({ title, subtitle, badge, children, className }: PageHeaderProps) => (
  <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
    <div className="min-w-0">
      <div className="flex items-center gap-2.5 flex-wrap">
        <h1 className="font-display font-bold text-lg text-foreground leading-tight truncate">{title}</h1>
        {badge !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-muted text-muted-foreground border border-border">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
      )}
    </div>
    {children && (
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{children}</div>
    )}
  </div>
);

export default PageHeader;
