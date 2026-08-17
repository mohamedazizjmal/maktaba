'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import InfiniteBooks from '@/components/InfiniteBooks'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  green: 'linear-gradient(135deg, #10B981, #3B82F6)',
  orange: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

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
  const [reviewForm, setReviewForm] = useState({ book_id: '', book_title: '', rating: 5, content: '', contains_spoiler: false })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchShelves()
    fetchMyReviews()
    fetchRecommendations()
    fetchUnreadCount()
  }, [])

  const fetchShelves = async () => {
    try { const r = await api.get('/shelves/'); setShelves(r.data) } catch (e) { console.error(e) }
  }
  const fetchMyReviews = async () => {
    try { const r = await api.get('/reviews/me'); setMyReviews(r.data) } catch (e) { console.error(e) }
  }
  const fetchRecommendations = async () => {
    try { const r = await api.get('/recommendations/'); setRecommendations(r.data.recommendations) } catch (e) { console.error(e) }
  }
  const fetchUnreadCount = async () => {
    try { const r = await api.get('/notifications/unread-count'); setUnreadCount(r.data.count) } catch (e) { console.error(e) }
  }
  const fetchNotifications = async () => {
    try { const r = await api.get('/notifications/'); setNotifications(r.data) } catch (e) { console.error(e) }
  }
  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); setUnreadCount(0); fetchNotifications() } catch (e) { console.error(e) }
  }

  const searchBooks = async () => {
    if (!search.trim()) return
    setLoading(true)
    try { const r = await api.get(`/books/search?q=${search}`); setResults(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const addToShelf = async (book: any, shelf_type: string) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      await api.post('/shelves/', { book_id: saved.data.id, shelf_type, progress_pages: 0 })
      fetchShelves(); fetchRecommendations()
      toast.success(`Added to ${shelf_type.replace(/_/g, ' ')}!`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error adding book')
    }
  }

  const openBook = async (book: any) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      router.push(`/book/${saved.data.id}`)
    } catch (e) { console.error(e) }
  }

  const openReviewForm = (shelf: any) => {
    setReviewForm({ book_id: shelf.book_id, book_title: shelf.book_title, rating: 5, content: '', contains_spoiler: false })
    setShowReviewForm(true); setActiveTab('reviews')
  }

  const submitReview = async () => {
    try {
      await api.post('/reviews/', { book_id: reviewForm.book_id, rating: reviewForm.rating, content: reviewForm.content, contains_spoiler: reviewForm.contains_spoiler })
      setShowReviewForm(false); fetchMyReviews()
      toast.success('Review submitted!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error submitting review')
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/reviews/${id}`); fetchMyReviews(); toast.success('Review deleted') } catch (e) { console.error(e) }
  }

  const handleLogout = () => { logout(); router.push('/') }

  const Stars = ({ value, onChange }: { value: number, onChange?: (v: number) => void }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange?.(s)} style={{ fontSize: '22px', cursor: onChange ? 'pointer' : 'default', color: s <= value ? '#F59E0B' : '#374151' }}>★</span>
      ))}
    </div>
  )

  const tabs = [
    { key: 'discover', label: '🔍 Discover', color: '#6366F1' },
    { key: 'library', label: '📚 Library', color: '#A855F7' },
    { key: 'reviews', label: '⭐ Reviews', color: '#EC4899' },
    { key: 'foryou', label: '🤖 For You', color: '#10B981' },
  ]

  const shelfStats = [
    { label: 'Want to Read', count: shelves.filter(s => s.shelf_type === 'want_to_read').length, gradient: G.blue, icon: '📖' },
    { label: 'Reading', count: shelves.filter(s => s.shelf_type === 'reading').length, gradient: G.purple, icon: '📚' },
    { label: 'Read', count: shelves.filter(s => s.shelf_type === 'read').length, gradient: G.green, icon: '✅' },
    { label: 'Reviews', count: myReviews.length, gradient: G.orange, icon: '⭐' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>📚</span>
            <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Maktaba</span>
          </Link>
        </div>
        <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Hey, {user?.full_name || user?.username} 👋</span>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); markAllRead() }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: '16px', position: 'relative' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #EF4444, #F59E0B)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', top: '48px', right: 0, width: '320px', background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Notifications</h3>
                {notifications.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No notifications yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                        <p style={{ fontSize: '13px', color: '#E5E7EB', marginBottom: '4px' }}>{n.message}</p>
                        <p style={{ fontSize: '11px', color: '#4B5563' }}>{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/chat" style={{ background: G.purple, padding: '8px 18px', borderRadius: '50px', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>🤖 AI Chat</Link>
          <Link href="/social" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px' }}>👥 Social</Link>
          <Link href="/clubs" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px' }}>📚 Clubs</Link>
          <Link href="/challenges" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px' }}>🏆 Challenge</Link>
          <Link href="/profile" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px' }}>👤 Profile</Link>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {shelfStats.map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '32px', fontWeight: '800', background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.count}</div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === tab.key ? tab.color : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6B7280',
              boxShadow: activeTab === tab.key ? `0 4px 20px ${tab.color}50` : 'none',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DISCOVER */}
        {activeTab === 'discover' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchBooks()}
                placeholder="Search any book..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', color: 'white', fontSize: '15px', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={searchBooks} disabled={loading} style={{ background: G.purple, border: 'none', borderRadius: '14px', padding: '14px 28px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                {loading ? '...' : 'Search'}
              </button>
            </div>

            {results.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {results.map(book => (
                  <div key={book.open_library_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {book.cover_url
                      ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} />
                      : <div style={{ width: '100%', height: '160px', background: 'rgba(99,102,241,0.2)', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
                    }
                    <h3 onClick={() => openBook(book)} style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', cursor: 'pointer', color: 'white', lineHeight: '1.4' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#818CF8')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'white')}
                    >{book.title}</h3>
                    <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>{book.authors?.join(', ')}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { label: '📖 Want to read', type: 'want_to_read', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
                        { label: '📚 Reading', type: 'reading', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' },
                        { label: '✅ Read', type: 'read', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
                      ].map(btn => (
                        <button key={btn.type} onClick={() => addToShelf(book, btn.type)} style={{ background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: '8px', padding: '6px', color: 'white', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading && search.trim() === '' ? (
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#9CA3AF' }}>
                  Discover more books
                </h3>
                <InfiniteBooks initialQuery="bestseller fiction" />
              </div>
            ) : null}

            {!loading && search.trim() !== '' && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '16px' }}>No books found for "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* LIBRARY */}
        {activeTab === 'library' && (
          <div>
            {shelves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>📚</div>
                <p>Your library is empty — discover and add books!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {[
                  { type: 'want_to_read', label: '📖 Want to Read', color: '#3B82F6' },
                  { type: 'reading', label: '📚 Reading', color: '#6366F1' },
                  { type: 'read', label: '✅ Read', color: '#10B981' },
                ].map(({ type, label, color }) => (
                  <div key={type} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`, borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color }}>{label}</h3>
                      <span style={{ background: `${color}20`, color, borderRadius: '50px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>
                        {shelves.filter(s => s.shelf_type === type).length}
                      </span>
                    </div>
                    {shelves.filter(s => s.shelf_type === type).map(shelf => (
                      <div key={shelf.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {shelf.book_cover
                          ? <img src={shelf.book_cover} style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                          : <div style={{ width: '36px', height: '50px', background: `${color}20`, borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📚</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/book/${shelf.book_id}`} style={{ fontSize: '13px', color: 'white', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                            {shelf.book_title || 'Unknown'}
                          </Link>
                          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{shelf.book_authors?.join(', ')}</p>
                        </div>
                        {type === 'read' && (
                          <button onClick={() => openReviewForm(shelf)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '4px 8px', color: '#F59E0B', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                            ★ Rate
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

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div>
            {showReviewForm && (
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#818CF8' }}>
                  Review: <span style={{ color: 'white' }}>{reviewForm.book_title}</span>
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>Rating</label>
                  <Stars value={reviewForm.rating} onChange={v => setReviewForm({ ...reviewForm, rating: v })} />
                </div>
                <textarea value={reviewForm.content} onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="What did you think of this book?" rows={4}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', resize: 'none', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input type="checkbox" checked={reviewForm.contains_spoiler} onChange={e => setReviewForm({ ...reviewForm, contains_spoiler: e.target.checked })} />
                  <label style={{ color: '#9CA3AF', fontSize: '13px' }}>Contains spoilers</label>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={submitReview} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Submit</button>
                  <button onClick={() => setShowReviewForm(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {myReviews.length === 0 && !showReviewForm ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>⭐</div>
                <p>No reviews yet — rate books from your library!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myReviews.map(review => (
                  <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontWeight: '600', marginBottom: '6px' }}>{review.book_title}</h3>
                        <Stars value={review.rating} />
                      </div>
                      <button onClick={() => deleteReview(review.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#EF4444', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                    </div>
                    {review.contains_spoiler && (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', borderRadius: '50px', padding: '2px 10px', fontSize: '11px', display: 'inline-block', marginBottom: '8px' }}>⚠️ Spoiler</span>
                    )}
                    {review.content && <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>{review.content}</p>}
                    <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '12px' }}>{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOR YOU */}
        {activeTab === 'foryou' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>For You</h2>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>Personalized recommendations based on your reading history</p>
            </div>
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>🤖</div>
                <p>Add more books to get personalized recommendations!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {recommendations.map(rec => (
                  <div key={rec.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '16px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {rec.cover_url
                        ? <img src={rec.cover_url} style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                        : <div style={{ width: '60px', height: '85px', background: 'rgba(99,102,241,0.2)', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📚</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.4' }}>{rec.title}</h3>
                        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>{rec.authors?.join(', ')}</p>
                        {rec.average_rating > 0 && <p style={{ fontSize: '12px', color: '#F59E0B' }}>★ {rec.average_rating.toFixed(1)}</p>}
                        <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', borderRadius: '50px', padding: '2px 8px', fontSize: '10px', display: 'inline-block', marginTop: '6px' }}>
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