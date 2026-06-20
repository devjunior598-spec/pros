"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageSquare, Settings, X, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastNotification {
    id: string
    title: string
    description: string
    type: 'message' | 'maintenance' | 'system'
    link?: string
}

interface NotificationToastProps {
    notification: ToastNotification
    onClose: (id: string) => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => onClose(notification.id), 300)
        }, 5000)

        return () => clearTimeout(timer)
    }, [notification.id, onClose])

    const getIcon = () => {
        switch (notification.type) {
            case 'message': return <MessageSquare className="h-4 w-4" />
            case 'maintenance': return <Settings className="h-4 w-4" />
            default: return <Bell className="h-4 w-4" />
        }
    }

    return (
        <Alert
            className={cn(
                "transition-all duration-300 transform w-80 shadow-lg border-primary/20",
                isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
        >
            <div className="flex gap-3">
                <div className="mt-1 text-primary">
                    {getIcon()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <AlertTitle className="text-sm font-semibold truncate">
                        {notification.title}
                    </AlertTitle>
                    <AlertDescription className="text-xs line-clamp-2">
                        {notification.description}
                    </AlertDescription>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false)
                        setTimeout(() => onClose(notification.id), 300)
                    }}
                    className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </Alert>
    )
}
