import * as React from "react"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconClassName?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  trend,
  trendValue,
  className,
  delay: _delay,
}: StatCardProps) {
  return (
    <Card className={cn(
      "border border-border bg-white shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={cn("p-2 rounded-lg bg-primary/10 text-primary", iconClassName)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        <div className="flex items-center text-xs mt-1">
          {trend && trend !== "neutral" && (
            <span className={cn(
              "flex items-center font-medium mr-2",
              trend === "up" ? "text-prms-emerald" : "text-red-500"
            )}>
              {trend === "up" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {trendValue}
            </span>
          )}
          {description && <span className="text-muted-foreground">{description}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
