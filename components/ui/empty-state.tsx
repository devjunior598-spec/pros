import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center sm:p-12",
        className
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-20 sm:w-20">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl">{title}</h3>
      <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground sm:text-base">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}
