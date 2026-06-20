// app/(dashboard)/dashboard/loading.tsx
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#0A0D1A] p-6 md:p-8 space-y-6">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-3xl bg-white/5 border border-white/5 p-6 animate-pulse h-32"
                        style={{ animationDelay: `${i * 80}ms` }} />
                ))}
            </div>
            {/* Main bento grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-3xl bg-white/5 border border-white/5 h-64 animate-pulse" />
                <div className="rounded-3xl bg-white/5 border border-white/5 h-64 animate-pulse" style={{ animationDelay: "120ms" }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/5 border border-white/5 h-48 animate-pulse" style={{ animationDelay: "160ms" }} />
                <div className="rounded-3xl bg-white/5 border border-white/5 h-48 animate-pulse" style={{ animationDelay: "200ms" }} />
            </div>
        </div>
    )
}
