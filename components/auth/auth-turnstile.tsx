"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import Script from "next/script"
import { createCaptchaTokenStore } from "@/lib/auth-verification"

type TurnstileApi = {
    render: (container: HTMLElement, options: {
        sitekey: string
        theme: "light"
        callback: (token: string) => void
        "expired-callback": () => void
        "error-callback": () => void
        "timeout-callback": () => void
        "refresh-expired": "auto"
        "refresh-timeout": "auto"
    }) => string
    reset: (widgetId?: string) => void
    remove: (widgetId: string) => void
}

declare global {
    interface Window {
        turnstile?: TurnstileApi
    }
}

export type AuthTurnstileHandle = {
    consumeToken: () => string
    reset: () => void
}

type AuthTurnstileProps = {
    onTokenChange: (token: string) => void
    onErrorChange?: (message: string | null) => void
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
export const turnstileEnabled = Boolean(turnstileSiteKey)

export const AuthTurnstile = forwardRef<AuthTurnstileHandle, AuthTurnstileProps>(function AuthTurnstile(
    { onTokenChange, onErrorChange },
    ref
) {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const tokenStore = useRef(createCaptchaTokenStore())

    const setSecurityError = (message: string | null) => {
        setError(message)
        onErrorChange?.(message)
    }

    useEffect(() => {
        if (!turnstileSiteKey || !ready || !window.turnstile || !containerRef.current || widgetIdRef.current) return

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: turnstileSiteKey,
            theme: "light",
            "refresh-expired": "auto",
            "refresh-timeout": "auto",
            callback: (token) => {
                if (!tokenStore.current.set(token)) return
                onTokenChange(token)
                setSecurityError(null)
            },
            "expired-callback": () => {
                tokenStore.current.clear()
                onTokenChange("")
                setSecurityError("Security verification expired. Please check the box again.")
            },
            "timeout-callback": () => {
                tokenStore.current.clear()
                onTokenChange("")
                setSecurityError("Security verification timed out. Please try the checkbox again.")
            },
            "error-callback": () => {
                tokenStore.current.clear()
                onTokenChange("")
                setSecurityError("Security verification could not load. Please refresh and try again.")
            },
        })

        return () => {
            tokenStore.current.clear()
            onTokenChange("")
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }
        }
    }, [ready, onTokenChange, onErrorChange])

    const reset = () => {
        tokenStore.current.clear()
        onTokenChange("")
        setSecurityError(null)
        if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
    }

    useImperativeHandle(ref, () => ({
        consumeToken() {
            const token = tokenStore.current.consume()
            onTokenChange("")
            if (!token) {
                reset()
                setSecurityError("Please complete a fresh security verification, then submit again.")
            }
            return token
        },
        reset,
    }), [onTokenChange, onErrorChange])

    if (!turnstileSiteKey) return null

    return (
        <div className="space-y-2">
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onReady={() => setReady(true)}
                onError={() => setSecurityError("Security verification could not load. Please refresh and try again.")}
            />
            <div className="flex min-h-[70px] items-center justify-center rounded-lg border border-border bg-secondary/20 p-2">
                <div ref={containerRef} />
            </div>
            {error && <div className="space-y-1" role="alert">
                <p className="text-xs font-medium text-red-600">{error}</p>
                <button type="button" onClick={reset} className="text-xs font-semibold text-blue-600 underline">Retry verification</button>
            </div>}
        </div>
    )
})
