import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingState({
  title = "Loading",
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {title}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 border border-dashed p-6 text-center",
        className,
      )}
    >
      <Inbox className="size-8 text-muted-foreground" />
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 border border-destructive/30 p-6 text-center",
        className,
      )}
    >
      <AlertCircle className="size-8 text-destructive" />
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
