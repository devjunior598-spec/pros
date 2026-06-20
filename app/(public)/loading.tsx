// app/(public)/loading.tsx
// Shown during initial navigation to the landing page
export default function PublicLoading() {
    return (
        <div className="min-h-screen bg-[#0A0D1A] flex flex-col">
            {/* Nav skeleton */}
            <div className="h-16 border-b border-white/5 flex items-center px-8 gap-4">
                <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse" />
                <div className="flex-1" />
                <div className="h-8 w-20 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 w-20 bg-white/5 rounded-xl animate-pulse" />
            </div>
            {/* Hero skeleton */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 pt-20 pb-32 px-6">
                <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
                <div className="h-20 w-3/4 max-w-3xl bg-white/5 rounded-3xl animate-pulse" />
                <div className="h-6 w-1/2 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-16 w-full max-w-2xl bg-white/5 rounded-2xl animate-pulse mt-4" />
                <div className="flex gap-3 mt-4">
                    <div className="h-12 w-36 bg-indigo-500/20 rounded-2xl animate-pulse" />
                    <div className="h-12 w-36 bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
            {/* Cards skeleton */}
            <div className="max-w-7xl mx-auto w-full px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-3xl bg-white/5 border border-white/5 overflow-hidden animate-pulse h-72"
                        style={{ animationDelay: `${i * 80}ms` }} />
                ))}
            </div>
        </div>
    )
}
