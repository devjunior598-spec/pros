"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        checked?: boolean
        onCheckedChange?: (checked: boolean) => void
    }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked || false)

    React.useEffect(() => {
        if (checked !== undefined) {
            setInternalChecked(checked)
        }
    }, [checked])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const newState = !internalChecked
        if (checked === undefined) {
            setInternalChecked(newState)
        }
        onCheckedChange?.(newState)
        props.onClick?.(e)
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={internalChecked}
            data-state={internalChecked ? "checked" : "unchecked"}
            ref={ref}
            className={cn(
                "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                internalChecked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-800",
                className
            )}
            onClick={handleClick}
            {...props}
        >
            <span
                data-state={internalChecked ? "checked" : "unchecked"}
                className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                    internalChecked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    )
})
Switch.displayName = "Switch"

export { Switch }
