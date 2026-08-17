'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function BookPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string
  const { user } = useAuthStore()

  const [book, setBook] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [shelfType, setShelfType] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', contains_spoiler: false })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBook()
    fetchReviews()
    checkShelfStatus()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const res = await api.get(`/books/${bookId}`)
      setBook(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/book/${bookId}`)
      setReviews(res.data)
    } catch (err) { console.error(err) }
  }

  const checkShelfStatus = async () => {
    try {
      const res = await api.get('/shelves/')
      const shelf = res.data.find((s: any) => s.book_id === bookId)
      if (shelf) setShelfType(shelf.shelf_type)
    } catch (err) { console.error(err) }
  }

  const addToShelf = async (type: string) => {
    try {
      await api.post('/shelves/', { book_id: bookId, shelf_type: type, progress_pages: 0 })
      setShelfType(type)
      toast.success(`Added to ${type.replace(/_/g, ' ')}!`)
    } catch (err) { console.error(err) }
  }

  const submitReview = async () => {
    setSubmitting(true)
    try {
      await api.post('/reviews/', {
        book_id: bookId,
        rating: reviewForm.rating,
        content: reviewForm.content,
        contains_spoiler: reviewForm.contains_spoiler
      })
      setShowReviewForm(false)
      fetchReviews()
      fetchBook()
      toast.success('Review submitted!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error submitting review')
    } finally {
      setSubmitting(false)
    }
  }

  const Stars = ({ value, onChange }: { value: number, onChange?: (v: number) => void }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} onClick={() => onChange?.(star)}
          style={{ fontSize: '22px', cursor: onChange ? 'pointer' : 'default', color: star <= value ? '#F59E0B' : '#374151', transition: 'color 0.15s' }}>
          ★
        </span>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0B1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <p style={{ color: '#6B7280' }}>Loading book...</p>
      </div>
    </div>
  )

  if (!book) return (
    <div style={{ minHeight: '100vh', background: '#0D0B1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
        <p style={{ color: '#6B7280', marginBottom: '16px' }}>Book not found</p>
        <Link href="/home" style={{ color: '#818CF8', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0B1E', color: 'white', fontFamily: 'Inter, sans-serif', position: 'relative' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,11,30,0.95)', backdropFilter: 'blur(20px)' }}>
        <Link href="/home" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</span>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Book Header */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '48px', flexWrap: 'wrap' }}>

          {/* Cover */}
          <div style={{ flexShrink: 0 }}>
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title}
                style={{ width: '200px', height: '290px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.15)' }}
              />
            ) : (
              <div style={{ width: '200px', height: '290px', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                📚
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '18px', color: '#9CA3AF', marginBottom: '16px' }}>
              {book.authors?.join(', ') || 'Unknown author'}
            </p>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {book.publish_year && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '4px 14px', fontSize: '13px', color: '#9CA3AF' }}>
                  📅 {book.publish_year}
                </span>
              )}
              {book.page_count && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '4px 14px', fontSize: '13px', color: '#9CA3AF' }}>
                  📄 {book.page_count} pages
                </span>
              )}
              {book.language && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '4px 14px', fontSize: '13px', color: '#9CA3AF' }}>
                  🌍 {book.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Rating */}
            {book.average_rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Stars value={Math.round(book.average_rating)} />
                <span style={{ color: '#F59E0B', fontWeight: '700', fontSize: '18px' }}>{book.average_rating.toFixed(1)}</span>
                <span style={{ color: '#4B5563', fontSize: '14px' }}>({book.ratings_count} ratings)</span>
              </div>
            )}

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {book.genres.slice(0, 4).map((genre: string) => (
                  <span key={genre} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8', borderRadius: '50px', padding: '4px 14px', fontSize: '12px', fontWeight: '500' }}>
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Shelf buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                { type: 'want_to_read', label: '📖 Want to Read', activeColor: '#3B82F6' },
                { type: 'reading', label: '📚 Reading', activeColor: '#6366F1' },
                { type: 'read', label: '✅ Read', activeColor: '#10B981' },
              ].map(btn => (
                <button key={btn.type} onClick={() => addToShelf(btn.type)} style={{
                  background: shelfType === btn.type ? btn.activeColor : 'rgba(255,255,255,0.06)',
                  border: shelfType === btn.type ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50px', padding: '10px 20px', color: 'white',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: shelfType === btn.type ? `0 4px 20px ${btn.activeColor}50` : 'none',
                }}>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* AI Chat button */}
            <Link href={`/chat`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '50px', padding: '10px 20px', color: '#A855F7',
              textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s',
            }}>
              🤖 Ask AI about this book
            </Link>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'rgba(255,255,255,0.85)' }}>About this book</h2>
            <p style={{ color: '#9CA3AF', lineHeight: '1.8', fontSize: '15px' }}>{book.description}</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
              Reviews
              <span style={{ color: '#4B5563', fontWeight: '400', fontSize: '15px', marginLeft: '8px' }}>({reviews.length})</span>
            </h2>
            {user && (
              <button onClick={() => setShowReviewForm(!showReviewForm)} style={{
                background: G.purple, border: 'none', borderRadius: '50px',
                padding: '10px 20px', color: 'white', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}>
                ✍️ Write a review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#818CF8' }}>Your review</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>Rating</label>
                <Stars value={reviewForm.rating} onChange={v => setReviewForm({ ...reviewForm, rating: v })} />
              </div>
              <textarea
                value={reviewForm.content}
                onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                placeholder="What did you think of this book?"
                rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', resize: 'none', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" checked={reviewForm.contains_spoiler} onChange={e => setReviewForm({ ...reviewForm, contains_spoiler: e.target.checked })} />
                <label style={{ color: '#9CA3AF', fontSize: '13px' }}>Contains spoilers</label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={submitReview} disabled={submitting} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', fontWeight: '600', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button onClick={() => setShowReviewForm(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#4B5563', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>💬</p>
              <p>No reviews yet — be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map(review => (
                <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                        {review.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>@{review.username}</p>
                        <Stars value={review.rating} />
                      </div>
                    </div>
                    <span style={{ color: '#4B5563', fontSize: '12px' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.contains_spoiler && (
                    <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', borderRadius: '50px', padding: '2px 10px', fontSize: '11px', display: 'inline-block', marginBottom: '8px' }}>
                      ⚠️ Spoiler
                    </span>
                  )}
                  {review.content && (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.7', marginTop: '8px' }}>{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}