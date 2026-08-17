'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import BookSkeleton from '@/components/BookSkeleton'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function HomePage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [shelves, setShelves] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [bookSections, setBookSections] = useState<{ title: string, books: any[] }[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchAll()
  }, [])

  const fetchBookSections = async () => {
    const categories = [
      { title: '🔥 Trending', query: 'bestseller 2024' },
      { title: '🚀 Science Fiction', query: 'science fiction' },
      { title: '🔍 Mystery & Thriller', query: 'mystery thriller' },
      { title: '💭 Philosophy', query: 'philosophy stoicism' },
      { title: '📈 Self Development', query: 'self help productivity' },
      { title: '🧙 Fantasy', query: 'fantasy epic' },
      { title: '💑 Romance', query: 'romance novel' },
      { title: '📜 History', query: 'history biography' },
    ]

    const sections = await Promise.all(
      categories.map(async (cat) => {
        try {
          const res = await api.get(`/books/search?q=${cat.query}&limit=10`)
          return { title: cat.title, books: res.data }
        } catch (e) {
          return { title: cat.title, books: [] }
        }
      })
    )
    setBookSections(sections.filter(s => s.books.length > 0))
  }

  const fetchAll = async () => {
    try {
      const [profileRes, shelvesRes, recsRes, notifRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/shelves/'),
        api.get('/recommendations/'),
        api.get('/notifications/unread-count'),
      ])
      setProfile(profileRes.data)
      setShelves(shelvesRes.data)
      setRecommendations(recsRes.data.recommendations || [])
      setUnreadCount(notifRes.data.count)
      await fetchBookSections()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const searchBooks = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await api.get(`/books/search?q=${search}`)
      setSearchResults(res.data)
    } catch (e) { console.error(e) }
    finally { setSearching(false) }
  }

  const openBook = async (book: any) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      router.push(`/book/${saved.data.id}`)
    } catch (e) { console.error(e) }
  }

  const addToShelf = async (book: any, shelf_type: string) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      await api.post('/shelves/', { book_id: saved.data.id, shelf_type, progress_pages: 0 })
      fetchAll()
      toast.success(`Added to ${shelf_type.replace(/_/g, ' ')}!`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error adding book')
    }
  }

  const fetchNotifications = async () => {
    try { const r = await api.get('/notifications/'); setNotifications(r.data) } catch (e) { console.error(e) }
  }

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); setUnreadCount(0); fetchNotifications() } catch (e) { console.error(e) }
  }

  const BookCard = ({ book }: { book: any }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s', flexShrink: 0, width: '148px' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div onClick={() => openBook(book)} style={{ cursor: 'pointer' }}>
        {book.cover_url
          ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>📚</div>
        }
      </div>
      <div style={{ padding: '12px' }}>
        <h3 onClick={() => openBook(book)} style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.4', color: 'white', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {book.title}
        </h3>
        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>{book.authors?.join(', ')}</p>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { label: '📖', type: 'want_to_read' },
            { label: '📚', type: 'reading' },
            { label: '✅', type: 'read' },
          ].map(btn => (
            <button key={btn.type} onClick={() => addToShelf(book, btn.type)}
              title={btn.type.replace(/_/g, ' ')}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <p style={{ color: '#6B7280' }}>Loading your library...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📚</span>
            <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Maktaba</span>
          </div>
          <div className="desktop-links" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { href: '/home', label: '🏠 Home', active: true },
              { href: '/dashboard', label: '📚 Library', active: false },
              { href: '/social', label: '👥 Social', active: false },
              { href: '/clubs', label: '💬 Clubs', active: false },
              { href: '/challenges', label: '🏆 Challenge', active: false },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ padding: '8px 14px', borderRadius: '8px', color: link.active ? 'white' : '#6B7280', textDecoration: 'none', fontSize: '13px', fontWeight: '500', background: link.active ? G.purple : 'transparent' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); markAllRead() }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '16px', position: 'relative' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #EF4444, #F59E0B)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', top: '48px', right: 0, width: '300px', background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Notifications</h3>
                {notifications.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No notifications</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                        <p style={{ fontSize: '13px', color: '#E5E7EB', marginBottom: '2px' }}>{n.message}</p>
                        <p style={{ fontSize: '11px', color: '#4B5563' }}>{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/chat" style={{ background: G.purple, padding: '8px 16px', borderRadius: '50px', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            🤖 AI Chat
          </Link>
          <Link href="/profile" style={{ width: '36px', height: '36px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', textDecoration: 'none', color: 'white' }}>
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </Link>
          <button onClick={() => { logout(); router.push('/') }} style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome Hero */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '24px', padding: '40px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span style={G.text}>{profile?.full_name?.split(' ')[0] || profile?.username} 👋</span>
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '24px' }}>
            You have {shelves.filter(s => s.shelf_type === 'reading').length} book{shelves.filter(s => s.shelf_type === 'reading').length !== 1 ? 's' : ''} in progress.
            {shelves.filter(s => s.shelf_type === 'want_to_read').length > 0 && ` ${shelves.filter(s => s.shelf_type === 'want_to_read').length} waiting on your shelf.`}
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Reading', count: shelves.filter(s => s.shelf_type === 'reading').length, color: '#6366F1', icon: '📖' },
              { label: 'Read', count: shelves.filter(s => s.shelf_type === 'read').length, color: '#10B981', icon: '✅' },
              { label: 'Want to Read', count: shelves.filter(s => s.shelf_type === 'want_to_read').length, color: '#3B82F6', icon: '🔖' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchBooks()}
              placeholder="🔍 Search any book, author, or genre..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 24px', color: 'white', fontSize: '16px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button onClick={searchBooks} disabled={searching} style={{ background: G.purple, border: 'none', borderRadius: '16px', padding: '16px 32px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', flexShrink: 0 }}>
              {searching ? '...' : 'Search'}
            </button>
          </div>

          {/* Genre Tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Self-Help', 'History', 'Biography'].map(tag => (
              <button key={tag} onClick={() => { setSearch(tag); setTimeout(searchBooks, 100) }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', padding: '6px 16px', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Search Results</h2>
                <button onClick={() => setSearchResults([])} style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '13px' }}>
                  Clear ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {searchResults.map(book => <BookCard key={book.open_library_id} book={book} />)}
              </div>
            </div>
          )}
        </div>

        {/* Currently Reading */}
        {shelves.filter(s => s.shelf_type === 'reading').length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>📖 Currently Reading</h2>
              <Link href="/dashboard" style={{ color: '#818CF8', textDecoration: 'none', fontSize: '14px' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {shelves.filter(s => s.shelf_type === 'reading').map(shelf => (
                <Link key={shelf.id} href={`/book/${shelf.book_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '160px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {shelf.book_cover
                      ? <img src={shelf.book_cover} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '200px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
                    }
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: 'white', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{shelf.book_title}</p>
                      <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{shelf.book_authors?.join(', ')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              🤖 <span style={G.text}>Recommended for You</span>
            </h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {recommendations.map(book => (
                <div key={book.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, width: '160px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {book.cover_url
                    ? <img src={book.cover_url} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
                  }
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'white', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{book.title}</p>
                    <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{book.authors?.join(', ')}</p>
                    {book.average_rating > 0 && <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>★ {book.average_rating.toFixed(1)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Sections */}
        {bookSections.map(section => (
         <div key={section.title} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{section.title}</h2>
         </div>
         <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {section.books.length === 0
           ? Array(6).fill(0).map((_, i) => <BookSkeleton key={i} />)
           : section.books.map(book => <BookCard key={book.open_library_id} book={book} />)
          }
         </div>
        </div>
))}

        {/* Want to Read */}
        {shelves.filter(s => s.shelf_type === 'want_to_read').length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>🔖 Your Reading List</h2>
              <Link href="/dashboard" style={{ color: '#818CF8', textDecoration: 'none', fontSize: '14px' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {shelves.filter(s => s.shelf_type === 'want_to_read').map(shelf => (
                <Link key={shelf.id} href={`/book/${shelf.book_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '160px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(59,130,246,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {shelf.book_cover
                      ? <img src={shelf.book_cover} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '200px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
                    }
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: 'white', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{shelf.book_title}</p>
                      <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{shelf.book_authors?.join(', ')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}