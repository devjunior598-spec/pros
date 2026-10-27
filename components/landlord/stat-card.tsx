import * as React from "react"
import Link from "next/link"
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
  href?: string
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
  href,
}: StatCardProps) {
  const content = (
    <Card className={cn(
      "group overflow-hidden rounded-3xl border border-border bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-lg",
      href && "cursor-pointer hover:border-primary/40",
      className
    )}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={cn("rounded-2xl bg-primary/10 p-2.5 text-primary transition group-hover:scale-105 group-hover:bg-primary group-hover:text-white", iconClassName)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-semibold tracking-[-0.035em] text-foreground">{value}</div>
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

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
