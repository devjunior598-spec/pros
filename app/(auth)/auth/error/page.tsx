import Link from "next/link"

export default function AuthLinkErrorPage() {
    return <div className="space-y-4 rounded-xl border bg-white p-6 text-slate-900">
        <h1 className="text-2xl font-semibold">This email link could not be completed</h1>
        <p>The link may have expired, already been used, or been opened in a different browser. Your account has not been deleted.</p>
        <p>For a signup confirmation, try signing in. If your email still needs confirmation, request another link from the sign-in page.</p>
        <div className="flex flex-col gap-3"><Link className="font-semibold text-blue-600 underline" href="/login">Go to sign in</Link><Link className="font-semibold text-blue-600 underline" href="/forgot-password">Request a new password reset link</Link></div>
    </div>
}
