'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Star, User } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer_id: string
  profiles: {
    name: string
    profile_image_url?: string
  } | null
}

interface PropertyReviewsProps {
  propertyId: string
  currentUserId?: string
}

function StarDisplay({
  rating,
  size = 'sm',
}: {
  rating: number
  size?: 'sm' | 'lg'
}) {
  const iconClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconClass,
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-700 text-slate-700'
          )}
        />
      ))}
    </div>
  )
}

function StarSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-700 text-slate-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-700" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 bg-slate-700 rounded" />
              <div className="h-2.5 w-20 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded mb-1.5" />
          <div className="h-2.5 w-3/4 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}

export function PropertyReviews({ propertyId, currentUserId }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('property_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_id,
          profiles:reviewer_id (
            name,
            profile_image_url
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const typedData = (data || []) as unknown as Review[]
      setReviews(typedData)

      if (currentUserId) {
        setHasReviewed(typedData.some((r) => r.reviewer_id === currentUserId))
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, currentUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    if (rating === 0) {
      setSubmitError('Please select a star rating.')
      return
    }
    setSubmitError('')
    setSubmitting(true)

    try {
      const { error } = await supabase.from('property_reviews').insert({
        property_id: propertyId,
        reviewer_id: currentUserId,
        rating,
        comment: comment.trim(),
      })

      if (error) throw error

      setRating(0)
      setComment('')
      setShowForm(false)
      await fetchReviews()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Reviews &amp; Ratings
          </h3>
          {!loading && (
            <div className="flex items-center gap-3 mt-2">
              {reviews.length > 0 ? (
                <>
                  <StarDisplay rating={averageRating} size="lg" />
                  <div className="text-2xl font-black text-amber-400">
                    {averageRating.toFixed(1)}
                  </div>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  No reviews yet — be the first!
                </span>
              )}
            </div>
          )}
        </div>

        {currentUserId && !hasReviewed && !showForm && !loading && (
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
          >
            <Star className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Write Review Form */}
      {showForm && currentUserId && (
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
            Your Review
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rating
              </label>
              <StarSelector value={rating} onChange={setRating} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="review-comment"
                className="text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Comment
              </label>
              <textarea
                id="review-comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this property..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
              />
            </div>

            {submitError && (
              <p className="text-xs font-semibold text-red-400">{submitError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setRating(0)
                  setComment('')
                  setSubmitError('')
                }}
                className="rounded-xl text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <ReviewSkeleton />
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-500 text-sm font-medium">
          No reviews for this property yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const reviewer = review.profiles
            const initials = reviewer?.name
              ? reviewer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?'

            return (
              <div
                key={review.id}
                className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full flex-shrink-0 overflow-hidden border border-slate-800 bg-slate-800 flex items-center justify-center">
                    {reviewer?.profile_image_url ? (
                      <img
                        src={reviewer.profile_image_url}
                        alt={reviewer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-slate-400">
                        {initials}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 leading-none truncate">
                      {reviewer?.name || 'Anonymous'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
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
      )}
    </div>
  )
}
