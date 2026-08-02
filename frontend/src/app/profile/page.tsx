'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [shelves, setShelves] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData()
  }, [])

const fetchData = async () => {
  try {
    const [shelvesRes, reviewsRes, profileRes] = await Promise.all([
      api.get('/shelves/'),
      api.get('/reviews/me'),
      api.get('/auth/me')
    ])
    setShelves(shelvesRes.data)
    setReviews(reviewsRes.data)
    setProfile(profileRes.data)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Stats
  const [profile, setProfile] = useState<any>(null)
  const totalBooks = shelves.length
  const readBooks = shelves.filter(s => s.shelf_type === 'read').length
  const readingBooks = shelves.filter(s => s.shelf_type === 'reading').length
  const wantToReadBooks = shelves.filter(s => s.shelf_type === 'want_to_read').length
  const totalReviews = reviews.length
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-blue-500">مكتبة Maktaba</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
          Logout
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
  {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'}
</div>
<div>
  <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h1>
  <p className="text-gray-400">@{profile?.username}</p>
  <p className="text-gray-500 text-sm">{profile?.email}</p>
</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Books', value: totalBooks, icon: '📚' },
            { label: 'Books Read', value: readBooks, icon: '✅' },
            { label: 'Reading Now', value: readingBooks, icon: '📖' },
            { label: 'Want to Read', value: wantToReadBooks, icon: '🔖' },
            { label: 'Reviews', value: totalReviews, icon: '⭐' },
            { label: 'Avg Rating', value: avgRating, icon: '🏆' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reading Progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Reading Progress</h2>
          {totalBooks === 0 ? (
            <p className="text-gray-500 text-sm">No books yet — start adding books!</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Read', count: readBooks, color: 'bg-green-500' },
                { label: 'Reading', count: readingBooks, color: 'bg-blue-500' },
                { label: 'Want to Read', count: wantToReadBooks, color: 'bg-gray-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: totalBooks > 0 ? `${(item.count / totalBooks) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{review.book_title}</h3>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-gray-400 text-xs line-clamp-2">{review.content}</p>
                  )}
                </div>
              ))}
              {reviews.length > 3 && (
                <Link href="/dashboard" className="text-blue-400 text-sm hover:underline">
                  View all {reviews.length} reviews →
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}