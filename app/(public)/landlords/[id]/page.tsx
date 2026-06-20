'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Star, Building2, ShieldCheck, Calendar, Home, Bed, Bath, MapPin, Loader2, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface LandlordProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  is_verified?: boolean
  profile_image_url?: string
  created_at: string
  role?: string
}

interface Property {
  id: string
  title: string
  price: number
  bedrooms: number
  bathrooms: number
  city: string
  state: string
  images: string[]
  status: string
  type: string
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: { name: string; profile_image_url?: string } | null
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(sz, s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700')}
        />
      ))}
    </div>
  )
}

export default function LandlordPublicProfilePage() {
  const params = useParams()
  const landlordId = params?.id as string

  const [profile, setProfile] = useState<LandlordProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => {
    if (!landlordId) return

    const fetchAll = async () => {
      setLoading(true)
      try {
        // 1. Fetch landlord profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', landlordId)
          .maybeSingle()

        if (profileError) throw profileError
        if (!profileData) {
          setNotFoundFlag(true)
          return
        }
        setProfile(profileData as LandlordProfile)

        // 2. Fetch their properties
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, price, bedrooms, bathrooms, city, state, images, status, type')
          .eq('landlord_id', landlordId)
          .order('created_at', { ascending: false })
          .limit(6)
        setProperties((propsData || []) as Property[])

        // 3. Fetch property IDs for reviews
        const propIds = (propsData || []).map((p: any) => p.id)

        if (propIds.length > 0) {
          // 4. Fetch reviews across all properties
          const { data: reviewsData } = await supabase
            .from('property_reviews')
            .select(`
              id, rating, comment, created_at,
              profiles:reviewer_id ( name, profile_image_url )
            `)
            .in('property_id', propIds)
            .order('created_at', { ascending: false })
            .limit(5)

          const typedReviews = (reviewsData || []) as unknown as Review[]
          setReviews(typedReviews)

          // 5. Compute avg rating
          if (typedReviews.length > 0) {
            const avg = typedReviews.reduce((s, r) => s + r.rating, 0) / typedReviews.length
            setAvgRating(avg)
          }
        }
      } catch (err) {
        console.error('Error fetching landlord profile:', err)
        setNotFoundFlag(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [landlordId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (notFoundFlag || !profile) {
    notFound()
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const joinDate = profile.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Unknown'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Banner */}
      <div className="relative h-52 md:h-72 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container max-w-5xl mx-auto px-4">
        {/* Profile Card overlapping the banner */}
        <div className="-mt-20 relative z-10 mb-8">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800/70 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-2xl border-4 border-slate-800 bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-400">{initials}</span>
                )}
              </div>

              {/* Name & meta */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.is_verified && (
                    <span title="Identity Verified">
                      <ShieldCheck className="h-5 w-5 text-blue-400" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Member since {joinDate}</span>
                </div>
                {profile.bio && (
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xl line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 sm:gap-8 text-center flex-shrink-0">
                <div>
                  <div className="text-2xl font-black text-white">{properties.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Listings
                  </div>
                </div>
                {reviews.length > 0 && (
                  <div>
                    <div className="text-2xl font-black text-amber-400">{avgRating.toFixed(1)}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      Avg Rating
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-black">
                    {profile.is_verified ? (
                      <span className="text-emerald-400">Verified</span>
                    ) : (
                      <span className="text-yellow-500">Pending</span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    KYC Status
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-400 mb-4">
              Properties Listed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((prop) => {
                const thumb = prop.images?.[0]
                return (
                  <Link
                    key={prop.id}
                    href={`/listings/${prop.id}`}
                    className="group bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-blue-600/50 transition-all hover:shadow-lg hover:shadow-blue-900/20"
                  >
                    <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-slate-700" />
                        </div>
                      )}
                      <Badge
                        className={cn(
                          'absolute top-2 right-2 text-[9px] uppercase font-bold px-2 py-0.5 rounded-lg',
                          prop.status === 'available'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        )}
                      >
                        {prop.status}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {prop.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span>{prop.city}, {prop.state}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />{prop.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />{prop.bathrooms}
                          </span>
                        </div>
                        <div className="text-sm font-black text-blue-400">
                          ₦{prop.price?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <section className="mb-16">
            <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-400 mb-4">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => {
                const reviewer = review.profiles
                const initials = reviewer?.name
                  ? reviewer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '?'
                return (
                  <div
                    key={review.id}
                    className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {reviewer?.profile_image_url ? (
                          <img
                            src={reviewer.profile_image_url}
                            alt={reviewer.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-slate-400">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">
                          {reviewer?.name || 'Anonymous'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-400 leading-relaxed pl-12">
                        {review.comment}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {properties.length === 0 && reviews.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-semibold">No active listings found for this landlord.</p>
          </div>
        )}
      </div>
    </div>
  )
}
