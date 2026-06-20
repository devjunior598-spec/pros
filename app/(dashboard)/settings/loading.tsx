// Generic table-page skeleton reused by properties, tenants, payments, etc.
function TableSkeleton() {
    return (
        <div className="min-h-screen bg-[#0A0D1A] p-6 md:p-8 space-y-6">
            {/* Page title */}
            <div className="h-10 w-56 bg-white/5 rounded-2xl animate-pulse" />
            {/* Filter bar */}
            <div className="h-12 max-w-md bg-white/5 rounded-2xl animate-pulse" />
            {/* Table rows */}
            <div className="rounded-3xl bg-white/5 border border-white/5 overflow-hidden divide-y divide-white/5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="w-10 h-10 rounded-full bg-white/5 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/5 rounded-lg w-1/3" />
                            <div className="h-3 bg-white/5 rounded-lg w-1/4" />
                        </div>
                        <div className="h-6 w-20 bg-white/5 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TableSkeleton
