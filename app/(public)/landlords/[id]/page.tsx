'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Star,
  Building2,
  ShieldCheck,
  Calendar,
  Home,
  Bed,
  Bath,
  MapPin,
  Loader2,
  User,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { PublicPageShell } from '@/components/public-page-shell'

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

// ─── Star Display Component ───────────────────────────────────────────────────

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            sz,
            s <= Math.round(rating)
              ? 'fill-amber-400 text-amber-700'
              : 'fill-white/10 text-slate-900'
          )}
        />
      ))}
    </div>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────

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
        // 2. Fetch only active U.S. properties before exposing a public profile
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, price, bedrooms, bathrooms, city, state, images, status, type')
          .eq('country', 'United States')
          .eq('status', 'available')
          .eq('publication_status', 'published')
          .eq('landlord_id', landlordId)
          .order('created_at', { ascending: false })
          .limit(6)
        if (!propsData?.length) {
          setNotFoundFlag(true)
          return
        }
        setProfile(profileData as LandlordProfile)
        setProperties(propsData as Property[])

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

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PublicPageShell showBanner={false}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl pointer-events-none" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading profile...</p>
        </div>
      </PublicPageShell>
    )
  }

  // ── Not Found State ──────────────────────────────────────────────────────────
  if (notFoundFlag || !profile) {
    notFound()
  }

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const joinDate = profile.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Unknown'

  return (
    <PublicPageShell showBanner={false}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 pb-24">

        {/* ── Hero Row ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">


          </div>

          <div className="relative z-10 p-6 md:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-600/30 border border-slate-200">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-900">{initials}</span>
                  )}
                </div>
                {profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-blue-100 border-2 border-white flex items-center justify-center shadow-lg">
                    <ShieldCheck className="h-4 w-4 text-slate-900" />
                  </div>
                )}
              </div>

              {/* Name & meta */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 text-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Landlord
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-700" />
                    Member since {joinDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-blue-700" />
                    {profile.role ?? 'Landlord'}
                  </span>
                </div>

                {profile.bio && (
                  <p className="text-sm text-slate-700 leading-relaxed max-w-2xl line-clamp-2 mt-1">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* ── Stat pills ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
                <Home className="h-4 w-4 text-blue-700" />
                <div>
                  <div className="text-lg font-black text-slate-900 leading-none">{properties.length}</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">Properties</div>
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
                  <Star className="h-4 w-4 text-amber-700 fill-amber-400" />
                  <div>
                    <div className="text-lg font-black text-amber-700 leading-none">{avgRating.toFixed(1)}</div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">Avg Rating</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
                <Building2 className="h-4 w-4 text-violet-700" />
                <div>
                  <div className="text-lg font-black text-slate-900 leading-none">{reviews.length}</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Properties (2/3 width) */}
          <div className="lg:col-span-2 space-y-5">
            {properties.length > 0 && (
              <motion.section
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 text-xs font-semibold">
                    <Home className="h-3.5 w-3.5" />
                    Properties Listed
                  </span>
                  <span className="text-xs text-slate-700 font-medium">
                    {properties.length} listing{properties.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map((prop, i) => {
                    const thumb = prop.images?.[0]
                    return (
                      <motion.div
                        key={prop.id}
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}
                      >
                        <Link
                          href={`/listings/${prop.id}`}
                          className="group block rounded-2xl border border-slate-200 bg-white hover:bg-white hover:border-blue-500/30 transition-all duration-200 overflow-hidden"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-video w-full bg-white relative overflow-hidden">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-slate-900" />
                              </div>
                            )}
                            {/* Status badge */}
                            <span
                              className={cn(
                                'absolute top-2.5 right-2.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-lg border',
                                prop.status === 'available'
                                  ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 '
                                  : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 '
                              )}
                            >
                              {prop.status}
                            </span>
                            {/* Type badge */}
                            <span className="absolute top-2.5 left-2.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-slate-900 ">
                              {prop.type}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="p-4 space-y-2">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                              {prop.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-slate-700">
                              <MapPin className="h-3 w-3 text-red-400/70" />
                              <span>{prop.city}, {prop.state}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-3 text-xs text-slate-700">
                                <span className="flex items-center gap-1">
                                  <Bed className="h-3 w-3" />{prop.bedrooms}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" />{prop.bathrooms}
                                </span>
                              </div>
                              <span className="text-sm font-black text-blue-700">
                                ${prop.price?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Empty listings state */}
            {properties.length === 0 && (
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-slate-200 bg-white"
              >
                <Building2 className="h-10 w-10 text-slate-900" />
                <p className="text-sm text-slate-700 font-medium">No active listings from this landlord.</p>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Contact + Reviews (1/3 width) */}
          <div className="space-y-5">

            {/* Contact Card */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h2 className="text-sm font-black text-slate-900 mb-1 tracking-tight">
                Contact this Landlord
              </h2>
              <p className="text-xs text-slate-700 mb-4 leading-relaxed">
                Send a message directly to {profile.name.split(' ')[0]} about any of their listings.
              </p>

              <Link
                href="/messages"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-100 hover:bg-blue-100 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <LinkIcon className="h-4 w-4" />
                Send a Message
              </Link>

              {/* Divider */}
              <div className="border-t border-slate-200 mt-4 pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">KYC Status</span>
                  <span
                    className={cn(
                      'font-bold',
                      profile.is_verified ? 'text-emerald-700' : 'text-yellow-700'
                    )}
                  >
                    {profile.is_verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">Member Since</span>
                  <span className="text-slate-900 font-bold">{joinDate}</span>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Avg Rating</span>
                    <span className="text-amber-700 font-bold">
                      ★ {avgRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <motion.section
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-700" />
                    Recent Reviews
                  </span>
                </div>

                <div className="space-y-3">
                  {reviews.map((review, i) => {
                    const reviewer = review.profiles
                    const reviewerInitials = reviewer?.name
                      ? reviewer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : '?'

                    return (
                      <motion.div
                        key={review.id}
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + i * 0.07 }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
                      >
                        {/* Reviewer */}
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-50 to-violet-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {reviewer?.profile_image_url ? (
                              <img
                                src={reviewer.profile_image_url}
                                alt={reviewer.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-black text-slate-900">
                                {reviewerInitials}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {reviewer?.name || 'Anonymous'}
                            </p>
                            <p className="text-[10px] text-slate-700">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <StarDisplay rating={review.rating} />
                        </div>

                        {review.comment && (
                          <p className="text-xs text-slate-700 leading-relaxed pl-12">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Empty reviews state */}
            {reviews.length === 0 && (
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center space-y-2"
              >
                <Star className="h-8 w-8 text-slate-900 mx-auto" />
                <p className="text-xs text-slate-700 font-medium">No reviews yet.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
