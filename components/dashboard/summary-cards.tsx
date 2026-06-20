"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface SummaryCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: string
        isPositive: boolean
    }
    className?: string
    iconClassName?: string
}

export function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
    iconClassName
}: SummaryCardProps) {
    return (
        <Card className={cn("border-none shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md", iconClassName)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center gap-1 mt-1">
                        {trend && (
                            <span className={cn(
                                "text-xs font-bold",
                                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {trend.isPositive ? "+" : "-"}{trend.value}
                            </span>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
