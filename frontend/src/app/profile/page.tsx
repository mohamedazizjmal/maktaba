'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  green: 'linear-gradient(135deg, #10B981, #3B82F6)',
  orange: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  pink: 'linear-gradient(135deg, #A855F7, #EC4899)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function ProfilePage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [shelves, setShelves] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
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

  const totalBooks = shelves.length
  const readBooks = shelves.filter(s => s.shelf_type === 'read').length
  const readingBooks = shelves.filter(s => s.shelf_type === 'reading').length
  const wantToReadBooks = shelves.filter(s => s.shelf_type === 'want_to_read').length
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <p style={{ color: '#6B7280' }}>Loading your profile...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ fontSize: '24px' }}>📚</span>
          <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Maktaba</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <button onClick={() => { logout(); router.push('/') }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: G.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', flexShrink: 0, boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{profile?.full_name || profile?.username}</h1>
            <p style={{ color: '#818CF8', fontSize: '14px', marginBottom: '4px' }}>@{profile?.username}</p>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>{profile?.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Books', value: totalBooks, gradient: G.purple, icon: '📚' },
            { label: 'Books Read', value: readBooks, gradient: G.green, icon: '✅' },
            { label: 'Reading Now', value: readingBooks, gradient: G.blue, icon: '📖' },
            { label: 'Want to Read', value: wantToReadBooks, gradient: G.pink, icon: '🔖' },
            { label: 'Reviews', value: reviews.length, gradient: G.orange, icon: '⭐' },
            { label: 'Avg Rating', value: avgRating, gradient: G.orange, icon: '🏆' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reading Progress */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Reading Progress</h2>
          {totalBooks === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '14px' }}>No books yet — start adding books!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Read', count: readBooks, color: '#10B981' },
                { label: 'Reading', count: readingBooks, color: '#6366F1' },
                { label: 'Want to Read', count: wantToReadBooks, color: '#A855F7' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{item.label}</span>
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{item.count}</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '50px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalBooks > 0 ? (item.count / totalBooks) * 100 : 0}%`, background: item.color, height: '100%', borderRadius: '50px', transition: 'width 0.6s ease', boxShadow: `0 0 10px ${item.color}60` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Recent Reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '14px' }}>No reviews yet!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.slice(0, 3).map(review => (
                <div key={review.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{review.book_title}</h3>
                    <div style={{ display: 'flex' }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '14px', color: s <= review.rating ? '#F59E0B' : '#374151' }}>★</span>)}
                    </div>
                  </div>
                  {review.content && <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.5' }}>{review.content}</p>}
                </div>
              ))}
              {reviews.length > 3 && (
                <Link href="/dashboard" style={{ color: '#818CF8', fontSize: '14px', textDecoration: 'none' }}>
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