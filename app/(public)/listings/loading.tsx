// app/(public)/listings/loading.tsx
// Shown instantly by Next.js during navigation — zero JS needed
export default function ListingsLoading() {
    return (
        <div className="min-h-screen bg-[#0A0D1A] pt-32 pb-20 px-6 lg:px-8">
            {/* Hero skeleton */}
            <div className="max-w-7xl mx-auto text-center mb-16 space-y-4">
                <div className="h-16 w-2/3 mx-auto bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-6 w-1/2 mx-auto bg-white/5 rounded-xl animate-pulse" />
                <div className="h-14 max-w-3xl mx-auto bg-white/5 rounded-2xl animate-pulse mt-8" />
            </div>
            {/* Grid skeleton */}
            <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-3xl bg-white/5 border border-white/5 overflow-hidden animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="h-52 bg-white/5" />
                        <div className="p-5 space-y-3">
                            <div className="h-5 bg-white/5 rounded-lg w-3/4" />
                            <div className="h-4 bg-white/5 rounded-lg w-1/2" />
                            <div className="h-6 bg-white/5 rounded-lg w-1/3 mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
