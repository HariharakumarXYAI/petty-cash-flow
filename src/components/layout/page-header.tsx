import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  /** Either a route string or a custom click handler (for unsaved-changes guards). */
  backHref?: string;
  onBack?: () => void;
  backLabel: string;
  title: string;
  subtitle?: ReactNode;
}

export function PageHeader({ backHref, onBack, backLabel, title, subtitle }: PageHeaderProps) {
  const backInner = (
    <>
      <ArrowLeft className="h-3.5 w-3.5" />
      {backLabel}
    </>
  );

  return (
    <div className="space-y-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {backInner}
        </button>
      ) : backHref ? (
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {backInner}
        </Link>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
