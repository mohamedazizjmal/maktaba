'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function BookPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string
  const { user } = useAuthStore()

  const [book, setBook] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [shelfType, setShelfType] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: '',
    contains_spoiler: false
  })
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
    } catch (err) {
      console.error(err)
    }
  }

  const checkShelfStatus = async () => {
    try {
      const res = await api.get('/shelves/')
      const shelf = res.data.find((s: any) => s.book_id === bookId)
      if (shelf) setShelfType(shelf.shelf_type)
    } catch (err) {
      console.error(err)
    }
  }

  const addToShelf = async (type: string) => {
    try {
      await api.post('/shelves/', {
        book_id: bookId,
        shelf_type: type,
        progress_pages: 0
      })
      setShelfType(type)
    } catch (err) {
      console.error(err)
    }
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error submitting review')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ value, onChange }: { value: number, onChange?: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange && onChange(star)}
          className={`text-2xl transition ${star <= value ? 'text-yellow-400' : 'text-gray-600'} ${onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📚</p>
          <p className="text-gray-400">Book not found</p>
          <Link href="/dashboard" className="text-blue-400 hover:underline mt-4 block">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-blue-500">مكتبة Maktaba</h1>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Book Header */}
        <div className="flex gap-8 mb-10">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-36 h-52 object-cover rounded-xl flex-shrink-0 shadow-lg"
            />
          ) : (
            <div className="w-36 h-52 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-5xl">📚</span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-gray-400 text-lg mb-3">
              {book.authors?.join(', ') || 'Unknown author'}
            </p>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {book.publish_year && (
                <span className="text-sm text-gray-500">📅 {book.publish_year}</span>
              )}
              {book.page_count && (
                <span className="text-sm text-gray-500">📄 {book.page_count} pages</span>
              )}
              {book.language && (
                <span className="text-sm text-gray-500">🌍 {book.language.toUpperCase()}</span>
              )}
            </div>

            {book.average_rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating value={Math.round(book.average_rating)} />
                <span className="text-yellow-400 font-semibold">{book.average_rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({book.ratings_count} ratings)</span>
              </div>
            )}

            {book.genres && book.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {book.genres.slice(0, 4).map((genre: string) => (
                  <span key={genre} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Shelf buttons */}
            <div className="flex gap-2 flex-wrap">
              {['want_to_read', 'reading', 'read'].map((type) => (
                <button
                  key={type}
                  onClick={() => addToShelf(type)}
                  className={`text-sm px-4 py-2 rounded-lg transition ${
                    shelfType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {type === 'want_to_read' ? '📖 Want to Read'
                    : type === 'reading' ? '📚 Reading'
                    : '✅ Read'}
                </button>
              ))}
              <Link
                href={`/chat?book=${bookId}`}
                className="text-sm px-4 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-300 transition"
              >
                🤖 Ask AI about this book
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-3">About this book</h2>
            <p className="text-gray-300 leading-relaxed">{book.description}</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Reviews
              <span className="ml-2 text-sm text-gray-500 font-normal">({reviews.length})</span>
            </h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
              >
                ✍️ Write a review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-gray-900 border border-blue-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 text-blue-400">Your review</h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Rating</label>
                <StarRating
                  value={reviewForm.rating}
                  onChange={(v) => setReviewForm({ ...reviewForm, rating: v })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Review</label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="What did you think of this book?"
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="spoiler"
                  checked={reviewForm.contains_spoiler}
                  onChange={(e) => setReviewForm({ ...reviewForm, contains_spoiler: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="spoiler" className="text-sm text-gray-400">Contains spoilers</label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-3xl mb-3">💬</p>
              <p>No reviews yet — be the first to review this book!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {review.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium text-sm">{review.username}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StarRating value={review.rating} />
                  {review.contains_spoiler && (
                    <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full my-2 inline-block">
                      ⚠️ Spoiler
                    </span>
                  )}
                  {review.content && (
                    <p className="text-gray-300 text-sm mt-2">{review.content}</p>
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