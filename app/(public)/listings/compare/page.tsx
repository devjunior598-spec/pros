"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, ArrowLeft, LayoutList, ShieldCheck, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"

interface CompareProperty {
  id: string
  title: string
  city: string
  state: string
  price: number
  type: string
  bedrooms: number | null
  bathrooms: number | null
  square_footage: number | null
  amenities: string[]
  images: string[]
  status: string
  is_verified?: boolean
}

// All unique amenities across compared properties
function collectAllAmenities(properties: CompareProperty[]): string[] {
  const set = new Set<string>()
  properties.forEach((p) => (p.amenities || []).forEach((a) => set.add(a)))
  return Array.from(set).sort()
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<CompareProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idsParam = searchParams.get("ids")
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  useEffect(() => {
    if (ids.length === 0) return
    let mounted = true

    const fetchProperties = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: dbError } = await supabase
          .from("properties")
          .select("id, title, city, state, price, type, bedrooms, bathrooms, square_footage, amenities, images, status")
          .in("id", ids)

        if (dbError) throw dbError
        if (mounted) {
          // Preserve the order from the URL
          const ordered = ids
            .map((id) => (data || []).find((p: any) => p.id === id))
            .filter(Boolean) as CompareProperty[]
          setProperties(ordered)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load properties.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchProperties()
    return () => mounted = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam])

  const allAmenities = collectAllAmenities(properties)
  const colCount = properties.length

  // ── Empty / No IDs state ──────────────────────────────────────────────────
  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 gap-6 text-center font-sans">
        <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-2">
          <LayoutList className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Compare Properties</h1>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
          Add properties to compare by opening their listing pages and selecting{" "}
          <strong className="text-slate-200">Compare</strong>. You can compare up to{" "}
          <strong className="text-slate-200">3 properties</strong> side by side.
        </p>
        <p className="text-slate-500 text-xs">
          Or navigate here manually:{" "}
          <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            /listings/compare?ids=uuid1,uuid2,uuid3
          </code>
        </p>
        <Link href="/listings">
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold h-11 px-6 text-sm mt-2">
            <Home className="mr-2 h-4 w-4" /> Browse Listings
          </Button>
        </Link>
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-400 text-sm font-semibold">Loading comparison...</p>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 font-sans">
        <p className="text-red-400 text-sm font-semibold">{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
          Go Back
        </Button>
      </div>
    )
  }

  // ── Compare table ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-16">

      {/* Page Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-800 dark:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4 text-slate-400" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Compare Properties
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing {colCount} propert{colCount === 1 ? "y" : "ies"} side by side
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="container mx-auto px-4 pt-8 overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <colgroup>
            {/* Label column */}
            <col style={{ width: "200px", minWidth: "160px" }} />
            {/* Property columns */}
            {properties.map((p) => (
              <col key={p.id} style={{ minWidth: "240px" }} />
            ))}
          </colgroup>

          <tbody>

            {/* ── Row: Property Image ── */}
            <tr>
              <td className="sticky left-0 z-10 bg-slate-950 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 align-top pt-6">
                Photo
              </td>
              {properties.map((p) => (
                <td key={p.id} className="px-4 py-4 align-top">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                    {p.images && p.images.length > 0 ? (
                      <Image
                        src={p.images[0]}
                        alt={p.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-700">
                        <Home className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            <Divider colCount={colCount} />

            {/* ── Row: Title ── */}
            <CompareRow
              label="Title"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="font-bold text-white text-sm leading-snug">
                  {p.title}
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Location ── */}
            <CompareRow
              label="Location"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="text-slate-300 text-sm">
                  {p.city}
                  {p.state ? `, ${p.state}` : ""}
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Annual Rent ── */}
            <CompareRow
              label="Annual Rent"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="text-blue-400 font-extrabold text-xl">
                  ₦{p.price?.toLocaleString()}
                  <span className="text-slate-500 text-xs font-normal ml-1">/yr</span>
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Property Type ── */}
            <CompareRow
              label="Type"
              colCount={colCount}
              cells={properties.map((p) => (
                <Badge
                  key={p.id}
                  className="bg-slate-800 border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wide"
                >
                  {p.type}
                </Badge>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Bedrooms ── */}
            <CompareRow
              label="Bedrooms"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="text-slate-200 font-semibold text-sm">
                  {p.bedrooms ?? "–"}
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Bathrooms ── */}
            <CompareRow
              label="Bathrooms"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="text-slate-200 font-semibold text-sm">
                  {p.bathrooms ?? "–"}
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Square Footage ── */}
            <CompareRow
              label="Square Footage"
              colCount={colCount}
              cells={properties.map((p) => (
                <p key={p.id} className="text-slate-200 font-semibold text-sm">
                  {p.square_footage ? `${p.square_footage.toLocaleString()} sqft` : "–"}
                </p>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: Amenities ── */}
            {allAmenities.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={colCount + 1}
                    className="sticky left-0 z-10 bg-slate-950 px-4 pt-5 pb-2 text-[10px] font-black uppercase tracking-widest text-blue-500"
                  >
                    Amenities
                  </td>
                </tr>
                {allAmenities.map((amenity) => (
                  <tr key={amenity} className="border-b border-slate-800/50">
                    <td className="sticky left-0 z-10 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 align-middle">
                      {amenity}
                    </td>
                    {properties.map((p) => (
                      <td key={p.id} className="px-4 py-2.5 text-center align-middle">
                        {(p.amenities || []).includes(amenity) ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-slate-600 mx-auto">
                            <X className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <Divider colCount={colCount} />
              </>
            )}

            {/* ── Row: Status / Availability ── */}
            <CompareRow
              label="Availability"
              colCount={colCount}
              cells={properties.map((p) => (
                <Badge
                  key={p.id}
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                    p.status === "available"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {p.status}
                </Badge>
              ))}
            />

            <Divider colCount={colCount} />

            {/* ── Row: CTA ── */}
            <tr>
              <td className="sticky left-0 z-10 bg-slate-950 px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 align-middle" />
              {properties.map((p) => (
                <td key={p.id} className="px-4 py-5 align-middle">
                  <Link href={`/listings/${p.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-bold h-10 text-sm">
                      View Property
                    </Button>
                  </Link>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function CompareRow({
  label,
  cells,
  colCount,
}: {
  label: string
  cells: React.ReactNode[]
  colCount: number
}) {
  return (
    <tr className="border-b border-slate-800/50">
      <td className="sticky left-0 z-10 bg-slate-950 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 align-middle whitespace-nowrap">
        {label}
      </td>
      {cells.map((cell, i) => (
        <td key={i} className="px-4 py-4 align-middle">
          {cell}
        </td>
      ))}
    </tr>
  )
}

function Divider({ colCount }: { colCount: number }) {
  return (
    <tr>
      <td colSpan={colCount + 1} className="h-px bg-slate-800/40 p-0" />
    </tr>
  )
}

// ── Page export with Suspense ─────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}
