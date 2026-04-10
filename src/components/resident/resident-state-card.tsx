import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResidentStateCardProps {
  message: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ResidentStateCard({
  message,
  title,
  description,
  action,
  className,
}: ResidentStateCardProps) {
  if (!title && !description && !action) {
    return (
      <Card className={cn("portal-card border-[var(--portal-outline)] shadow-none", className)}>
        <CardContent className="p-8 text-sm text-[var(--portal-muted)]">{message}</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("portal-card border-[var(--portal-outline)] shadow-none", className)}>
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : null}
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="portal-empty-state px-4 py-4 text-sm text-[var(--portal-muted)]">{message}</div>
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}

