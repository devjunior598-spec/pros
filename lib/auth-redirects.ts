const AUTH_DESTINATIONS = new Set(["/dashboard", "/provider-onboarding", "/reset-password"])

export function safeAuthDestination(value: string | null): string {
    return value && AUTH_DESTINATIONS.has(value) ? value : "/dashboard"
}
