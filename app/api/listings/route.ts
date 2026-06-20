/**
 * /api/listings/route.ts
 *
 * Dedicated cached listings endpoint for the public browse page.
 *
 * Scalability features:
 *  ① Pagination    – never returns more than PAGE_SIZE rows per request
 *  ② Slim select   – only fetches the 8 columns the PropertyCard actually needs
 *  ③ Cache-Control – CDN/proxy caches the response for 60s; stale-while-revalidate
 *                    for 5 min so users never wait on a cold cache
 *  ④ Rate limiting  – 60 req/min per IP (prevents scraping / runaway pollers)
 *  ⑤ Input sanity  – page & filter values are validated before hitting the DB
 */

import { NextResponse }               from "next/server"
import { createClient }               from "@supabase/supabase-js"
import { rateLimit, getClientIp }     from "@/lib/rate-limit"

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

// Columns the PropertyCard displays — nothing more, nothing less
const LISTING_COLUMNS = "id,title,city,area,price,type,status,images,created_at"

// Supabase server client (uses service role for read-only public data)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Allowed filter values (whitelist to prevent injection) ────────────────────
const ALLOWED_TYPES   = new Set(["Apartment","Studio","Duplex","House","Office"])
const PRICE_RE        = /^\d+-\d+$|^\d+$/   // "0-500000" or "10000000"

export async function GET(req: Request) {
    // ── Rate limit: 60 listing fetches / min per IP ───────────────────────────
    const ip = getClientIp(req)
    const { success, remaining, resetInMs } = await rateLimit(ip, { limit: 60, windowMs: 60_000 })
    if (!success) {
        return NextResponse.json(
            { error: "Too many requests" },
            {
                status: 429,
                headers: {
                    "Retry-After":          String(Math.ceil(resetInMs / 1000)),
                    "X-RateLimit-Limit":    "60",
                    "X-RateLimit-Remaining":"0",
                },
            }
        )
    }

    const { searchParams } = new URL(req.url)

    // ── Parse & validate query params ─────────────────────────────────────────
    const rawPage  = parseInt(searchParams.get("page")  ?? "1", 10)
    const page     = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

    const q        = searchParams.get("q")?.slice(0, 100) ?? ""      // max 100 chars
    const rawType  = searchParams.get("type") ?? ""
    const type     = ALLOWED_TYPES.has(rawType) ? rawType : ""

    const rawPrice = searchParams.get("price") ?? ""
    const price    = PRICE_RE.test(rawPrice) ? rawPrice : ""

    // ── Build Supabase query ──────────────────────────────────────────────────
    let query = supabase
        .from("properties")
        .select(LISTING_COLUMNS, { count: "exact" })
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)   // ← pagination

    if (q) {
        query = query.or(
            `city.ilike.%${q}%,area.ilike.%${q}%,title.ilike.%${q}%`
        )
    }
    if (type) {
        query = query.eq("type", type)
    }
    if (price) {
        const parts = price.split("-").map(Number)
        if (parts.length === 2) {
            query = query.gte("price", parts[0]).lte("price", parts[1])
        } else {
            query = query.gte("price", parts[0])
        }
    }

    const { data, error, count } = await query

    if (error) {
        console.error("[/api/listings] Supabase error:", error.message)
        return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
    }

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    return NextResponse.json(
        {
            properties: data ?? [],
            meta: {
                page,
                pageSize:   PAGE_SIZE,
                total:      count ?? 0,
                totalPages,
                hasMore:    page < totalPages,
            },
        },
        {
            headers: {
                // ─── CDN / proxy caching ───────────────────────────────────
                // Fresh for 60s, serve stale for up to 5 min while revalidating.
                // This means 2M users can be served from the cache with near-zero DB hits.
                "Cache-Control":        "public, s-maxage=60, stale-while-revalidate=300",
                "X-RateLimit-Remaining": String(remaining),
                "Vary":                 "Accept-Encoding",
            },
        }
    )
}
