"use client"

import { useEffect } from "react"

export function GlobalErrorSuppressor() {
    useEffect(() => {
        if (typeof window === 'undefined') return

        /**
         * Returns true for errors that should be silently swallowed:
         *  1. Supabase IndexedDB lock race — "Lock broken / steal / AbortError"
         *  2. Supabase token-refresh network failure — "Failed to fetch"
         *     when the call stack comes from _refreshAccessToken / _callRefreshToken
         */
        const isSuppressed = (msg: any): boolean => {
            const suppressedPatterns = [
                // Lock-race errors (IndexedDB mutex)
                /signal is aborted/i,
                /aborterror/i,
                /fetch is aborted/i,
                /aborted without reason/i,
                /the operation was aborted/i,
                /operation was aborted/i,
                /was released because another request stole it/i,
                /isacquiretimeout/i,
                /lock broken/i,
                // Token-refresh network errors
                // Supabase throws a plain TypeError("Failed to fetch") when
                // _refreshAccessToken can't reach the auth endpoint. We match
                // strictly on the string so we don't swallow unrelated fetch errors.
                /^failed to fetch$/i,
            ]

            const toString = (val: any): string => {
                if (typeof val === 'string') return val
                if (!val) return ''
                if (typeof val.message === 'string') return val.message
                if (val.name === 'AbortError') return 'AbortError'
                try { return JSON.stringify(val) } catch { return '' }
            }

            const text = toString(msg)
            if (suppressedPatterns.some(re => re.test(text))) return true

            // Also check nested .error property
            if (msg && typeof msg === 'object' && msg.error) {
                return isSuppressed(msg.error)
            }

            return false
        }

        // 1. Suppress console.error
        const originalError = console.error
        console.error = (...args) => {
            if (args.some(arg => isSuppressed(arg))) return
            originalError.apply(console, args)
        }

        // 2. Suppress unhandledrejection
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (isSuppressed(event.reason)) {
                event.preventDefault()
            }
        }
        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        // 3. Suppress window.onerror (Next.js error overlay)
        const originalOnError = window.onerror
        window.onerror = (message, source, lineno, colno, error) => {
            if (isSuppressed(message) || (error && isSuppressed(error))) {
                return true // Prevents default handler (and overlay)
            }
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error)
            }
            return false
        }

        return () => {
            console.error = originalError
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
            window.onerror = originalOnError
        }
    }, [])

    return null
}
