'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function SocialPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'following'>('feed')
  const [feed, setFeed] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchFeed()
    fetchFollowing()
  }, [])

  const fetchFeed = async () => {
    try {
      const res = await api.get('/social/feed')
      setFeed(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchFollowing = async () => {
    try {
      const res = await api.get('/social/following')
      setFollowing(res.data)
    } catch (e) { console.error(e) }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await api.get(`/social/users/search?q=${searchQuery}`)
      setSearchResults(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleFollow = async (userId: string) => {
    try {
      await api.post(`/social/follow/${userId}`)
      searchUsers()
      fetchFollowing()
      fetchFeed()
    } catch (e) { console.error(e) }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'added_to_shelf': return '📚'
      case 'wrote_review': return '⭐'
      case 'started_reading': return '📖'
      case 'finished_reading': return '✅'
      default: return '📌'
    }
  }

  const getActivityText = (activity: any) => {
    switch (activity.activity_type) {
      case 'added_to_shelf': return `added "${activity.book_title}" to their library`
      case 'wrote_review': return `reviewed "${activity.book_title}"`
      case 'started_reading': return `started reading "${activity.book_title}"`
      case 'finished_reading': return `finished reading "${activity.book_title}"`
      default: return `did something with "${activity.book_title}"`
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const tabs = [
    { key: 'feed', label: '📰 Feed' },
    { key: 'discover', label: '🔍 Find Readers' },
    { key: 'following', label: `👥 Following (${following.length})` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Social</span>
        </div>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === tab.key ? G.purple : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6B7280',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* FEED */}
        {activeTab === 'feed' && (
          <div>
            {feed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>📰</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Your feed is empty</p>
                <p style={{ fontSize: '14px' }}>Follow other readers to see their activity!</p>
                <button onClick={() => setActiveTab('discover')} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer', marginTop: '16px', fontWeight: '600' }}>
                  Find Readers →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {feed.map(activity => (
                  <div key={activity.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    {/* Avatar */}
                    <div style={{ width: '40px', height: '40px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>
                      {activity.user?.username?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>@{activity.user?.username}</span>
                        <span style={{ fontSize: '20px' }}>{getActivityIcon(activity.activity_type)}</span>
                        <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{getActivityText(activity)}</span>
                      </div>

                      {activity.book_cover && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px', marginTop: '8px' }}>
                          <img src={activity.book_cover} style={{ width: '30px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
                          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{activity.book_title}</span>
                        </div>
                      )}

                      <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '8px' }}>{timeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DISCOVER */}
        {activeTab === 'discover' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUsers()}
                placeholder="Search by username..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 20px', color: 'white', fontSize: '15px', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={searchUsers} disabled={loading} style={{ background: G.purple, border: 'none', borderRadius: '14px', padding: '14px 24px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
                {loading ? '...' : 'Search'}
              </button>
            </div>

            {searchResults.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <p>Search for readers by username</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(user => (
                <div key={user.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{user.full_name || user.username}</p>
                    <p style={{ color: '#6B7280', fontSize: '13px' }}>@{user.username}</p>
                  </div>
                  <button
                    onClick={() => toggleFollow(user.id)}
                    style={{
                      background: user.is_following ? 'rgba(255,255,255,0.06)' : G.purple,
                      border: user.is_following ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      borderRadius: '50px', padding: '8px 20px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      boxShadow: user.is_following ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
                    }}
                  >
                    {user.is_following ? 'Following ✓' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOLLOWING */}
        {activeTab === 'following' && (
          <div>
            {following.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>👥</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Not following anyone yet</p>
                <button onClick={() => setActiveTab('discover')} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer', marginTop: '8px', fontWeight: '600' }}>
                  Find Readers →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {following.map(user => (
                  <div key={user.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}>
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{user.full_name || user.username}</p>
                      <p style={{ color: '#6B7280', fontSize: '13px' }}>@{user.username}</p>
                    </div>
                    <button
                      onClick={() => toggleFollow(user.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '50px', padding: '8px 20px', color: '#EF4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Unfollow
                    </button>
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