import React from 'react';
import { cn } from "../../lib/utils";

const statusStyles = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-accent/10 text-accent border-accent/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status]
      )}
    >
      {children}
    </span>
  );
}

