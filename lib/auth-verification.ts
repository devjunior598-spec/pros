export function createCaptchaTokenStore(now = Date.now) {
    let token = ""
    let issuedAt = 0
    let lastConsumed = ""

    const clear = () => {
        token = ""
        issuedAt = 0
    }

    return {
        set(value: string) {
            token = value === lastConsumed ? "" : value
            issuedAt = now()
            return Boolean(token)
        },
        clear,
        consume() {
            const value = now() - issuedAt < 280_000 ? token : ""
            clear()
            if (value) lastConsumed = value
            return value
        },
    }
}

export function getAuthErrorMessage(error: unknown): string {
    const message = error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "An unexpected error occurred."
    if (/captcha|timeout-or-duplicate/i.test(message)) {
        return 'Security verification expired or was already used. Please check "Verify you are human" again, then try once more.'
    }
    return message
}
