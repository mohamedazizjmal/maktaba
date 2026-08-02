'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [shelves, setShelves] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'discover' | 'library' | 'reviews' | 'foryou'>('discover')
  const [myReviews, setMyReviews] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [reviewForm, setReviewForm] = useState({
    book_id: '',
    book_title: '',
    rating: 5,
    content: '',
    contains_spoiler: false
  })
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchShelves()
    fetchMyReviews()
    fetchRecommendations()
  }, [])

  const fetchShelves = async () => {
    try {
      const res = await api.get('/shelves/')
      setShelves(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyReviews = async () => {
    try {
      const res = await api.get('/reviews/me')
      setMyReviews(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations/')
      setRecommendations(res.data.recommendations)
    } catch (err) {
      console.error(err)
    }
  }

  const searchBooks = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await api.get(`/books/search?q=${search}`)
      setResults(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToShelf = async (book: any, shelf_type: string) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      await api.post('/shelves/', {
        book_id: saved.data.id,
        shelf_type,
        progress_pages: 0
      })
      fetchShelves()
      fetchRecommendations()
      alert(`Added to ${shelf_type.replace('_', ' ')} !`)
    } catch (err) {
      console.error(err)
    }
  }

  const openReviewForm = (shelf: any) => {
    setReviewForm({
      book_id: shelf.book_id,
      book_title: shelf.book_title,
      rating: 5,
      content: '',
      contains_spoiler: false
    })
    setShowReviewForm(true)
    setActiveTab('reviews')
  }

  const submitReview = async () => {
    try {
      await api.post('/reviews/', {
        book_id: reviewForm.book_id,
        rating: reviewForm.rating,
        content: reviewForm.content,
        contains_spoiler: reviewForm.contains_spoiler
      })
      setShowReviewForm(false)
      fetchMyReviews()
      alert('Review submitted !')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error submitting review')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      fetchMyReviews()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-500">مكتبة Maktaba</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Hello, {user?.full_name || user?.username || 'Reader'} 👋
          </span>
          <Link
            href="/chat"
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            🤖 AI Chat
          </Link>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
            Logout
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-6">
          {[
            { key: 'discover', label: '🔍 Discover' },
            { key: 'library', label: '📚 My Library' },
            { key: 'reviews', label: '⭐ My Reviews' },
            { key: 'foryou', label: '🤖 For You' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Discover Books</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
                placeholder="Search any book..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={searchBooks}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((book) => (
                  <div key={book.open_library_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    {book.cover_url && (
                      <img src={book.cover_url} alt={book.title} className="w-20 h-28 object-cover rounded-lg mb-3" />
                    )}
                    <Link href={`/book/${book.open_library_id}`}>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 hover:text-blue-400 transition cursor-pointer">{book.title}</h3>
                    </Link>
                    <p className="text-gray-400 text-xs mb-3">{book.authors?.join(', ')}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => addToShelf(book, 'want_to_read')} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition">📖 Want to read</button>
                      <button onClick={() => addToShelf(book, 'reading')} className="text-xs bg-blue-900 hover:bg-blue-800 px-2 py-1 rounded transition">📚 Reading</button>
                      <button onClick={() => addToShelf(book, 'read')} className="text-xs bg-green-900 hover:bg-green-800 px-2 py-1 rounded transition">✅ Read</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIBRARY TAB */}
        {activeTab === 'library' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">My Library</h2>
            {shelves.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">📚</p>
                <p>Your library is empty — search for books and add them!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['want_to_read', 'reading', 'read'].map((type) => (
                  <div key={type} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 text-gray-300">
                      {type === 'want_to_read' ? '📖 Want to Read' : type === 'reading' ? '📚 Reading' : '✅ Read'}
                      <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                        {shelves.filter(s => s.shelf_type === type).length}
                      </span>
                    </h3>
                    {shelves.filter(s => s.shelf_type === type).map((shelf) => (
                      <div key={shelf.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        {shelf.book_cover && (
                          <img src={shelf.book_cover} alt="" className="w-8 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <Link href={`/book/${shelf.book_id}`} className="text-sm text-white hover:text-blue-400 transition">
                            {shelf.book_title || 'Unknown book'}
                          </Link>
                          <p className="text-xs text-gray-500">{shelf.book_authors?.join(', ')}</p>
                        </div>
                        {type === 'read' && (
                          <button
                            onClick={() => openReviewForm(shelf)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 transition"
                          >
                            ★ Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Reviews</h2>

            {showReviewForm && (
              <div className="bg-gray-900 border border-blue-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4 text-blue-400">
                  Write a review for <span className="text-white">{reviewForm.book_title}</span>
                </h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Rating</label>
                  <StarRating
                    value={reviewForm.rating}
                    onChange={(v) => setReviewForm({ ...reviewForm, rating: v })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Your review</label>
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
                  <button onClick={submitReview} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-medium transition">
                    Submit Review
                  </button>
                  <button onClick={() => setShowReviewForm(false)} className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {myReviews.length === 0 && !showReviewForm ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">⭐</p>
                <p>No reviews yet — go to My Library and review a book you've read!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews.map((review) => (
                  <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{review.book_title}</h3>
                        <StarRating value={review.rating} />
                      </div>
                      <button onClick={() => deleteReview(review.id)} className="text-xs text-red-400 hover:text-red-300 transition">
                        Delete
                      </button>
                    </div>
                    {review.contains_spoiler && (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full mb-2 inline-block">
                        ⚠️ Spoiler
                      </span>
                    )}
                    {review.content && (
                      <p className="text-gray-300 text-sm mt-2">{review.content}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-3">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOR YOU TAB */}
        {activeTab === 'foryou' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">For You</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Personalized recommendations based on your reading history
            </p>

            {recommendations.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">🤖</p>
                <p>Add more books to your shelves to get personalized recommendations!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex gap-3">
                      {rec.cover_url ? (
                        <img src={rec.cover_url} alt={rec.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📚</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{rec.title}</h3>
                        <p className="text-gray-400 text-xs mb-2">{rec.authors?.join(', ')}</p>
                        {rec.average_rating > 0 && (
                          <p className="text-yellow-400 text-xs mb-2">★ {rec.average_rating.toFixed(1)}</p>
                        )}
                        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                          {rec.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}