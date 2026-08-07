'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function ClubsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'discover' | 'myclubs' | 'chat'>('discover')
  const [clubs, setClubs] = useState<any[]>([])
  const [myClubs, setMyClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', is_public: true })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchClubs()
    fetchMyClubs()
  }, [])

  const fetchClubs = async () => {
    try { const r = await api.get('/clubs/'); setClubs(r.data) } catch (e) { console.error(e) }
  }

  const fetchMyClubs = async () => {
    try { const r = await api.get('/clubs/me'); setMyClubs(r.data) } catch (e) { console.error(e) }
  }

  const fetchMessages = async (clubId: string) => {
    try { const r = await api.get(`/clubs/${clubId}/messages`); setMessages(r.data) } catch (e) { console.error(e) }
  }

  const joinClub = async (clubId: string) => {
    try {
      await api.post(`/clubs/${clubId}/join`)
      fetchClubs(); fetchMyClubs()
    } catch (e) { console.error(e) }
  }

  const createClub = async () => {
    if (!createForm.name.trim()) return
    setLoading(true)
    try {
      await api.post('/clubs/', createForm)
      setShowCreate(false)
      setCreateForm({ name: '', description: '', is_public: true })
      fetchClubs(); fetchMyClubs()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openChat = async (club: any) => {
    setSelectedClub(club)
    setActiveTab('chat')
    await fetchMessages(club.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClub) return
    try {
      const r = await api.post(`/clubs/${selectedClub.id}/messages`, { content: newMessage })
      setMessages(prev => [...prev, r.data])
      setNewMessage('')
    } catch (e) { console.error(e) }
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
    { key: 'discover', label: '🔍 Discover Clubs' },
    { key: 'myclubs', label: `📚 My Clubs (${myClubs.length})` },
    { key: 'chat', label: selectedClub ? `💬 ${selectedClub.name}` : '💬 Chat' },
  ]

  const ClubCard = ({ club }: { club: any }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{club.name}</h3>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>by @{club.owner?.username}</p>
        </div>
        <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', borderRadius: '50px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
          👥 {club.members_count}
        </span>
      </div>

      {club.description && (
        <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>{club.description}</p>
      )}

      {club.current_book && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
          {club.current_book.cover_url && (
            <img src={club.current_book.cover_url} style={{ width: '30px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
          )}
          <div>
            <p style={{ fontSize: '10px', color: '#6B7280', marginBottom: '2px' }}>Currently reading</p>
            <p style={{ fontSize: '13px', fontWeight: '500' }}>{club.current_book.title}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => joinClub(club.id)}
          style={{
            flex: 1, background: club.is_member ? 'rgba(255,255,255,0.06)' : G.purple,
            border: club.is_member ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRadius: '10px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            boxShadow: club.is_member ? 'none' : '0 4px 16px rgba(99,102,241,0.3)'
          }}
        >
          {club.is_member ? 'Leave' : 'Join Club'}
        </button>
        {club.is_member && (
          <button
            onClick={() => openChat(club)}
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '8px 16px', color: '#818CF8', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            💬 Chat
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Book Clubs</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: G.purple, border: 'none', borderRadius: '50px', padding: '8px 20px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
        >
          + Create Club
        </button>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Create Club Modal */}
        {showCreate && (
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', ...G.text }}>Create a Book Club</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>Club Name *</label>
              <input
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Sci-Fi Lovers, Mystery Readers..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>Description</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="What is this club about?"
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input type="checkbox" checked={createForm.is_public} onChange={e => setCreateForm({ ...createForm, is_public: e.target.checked })} />
              <label style={{ color: '#9CA3AF', fontSize: '13px' }}>Public club (visible to everyone)</label>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createClub} disabled={loading} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                {loading ? 'Creating...' : 'Create Club 🚀'}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === tab.key ? G.purple : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6B7280',
              boxShadow: activeTab === tab.key ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DISCOVER */}
        {activeTab === 'discover' && (
          <div>
            {clubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>📚</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No clubs yet</p>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>Be the first to create one!</p>
                <button onClick={() => setShowCreate(true)} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer', fontWeight: '600' }}>
                  Create First Club 🚀
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {clubs.map(club => <ClubCard key={club.id} club={club} />)}
              </div>
            )}
          </div>
        )}

        {/* MY CLUBS */}
        {activeTab === 'myclubs' && (
          <div>
            {myClubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>📚</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>You haven't joined any clubs yet</p>
                <button onClick={() => setActiveTab('discover')} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer', fontWeight: '600', marginTop: '8px' }}>
                  Discover Clubs →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {myClubs.map(club => <ClubCard key={club.id} club={club} />)}
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {activeTab === 'chat' && (
          <div>
            {!selectedClub ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#4B5563' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>💬</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Select a club to chat</p>
                <button onClick={() => setActiveTab('myclubs')} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', cursor: 'pointer', fontWeight: '600', marginTop: '8px' }}>
                  My Clubs →
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                {/* Chat Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    📚
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{selectedClub.name}</h3>
                    <p style={{ color: '#6B7280', fontSize: '12px' }}>{selectedClub.members_count} members</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ height: '400px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B5563' }}>
                      <p>No messages yet — start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '32px', height: '32px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                          {msg.user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>@{msg.user?.username}</span>
                            <span style={{ fontSize: '11px', color: '#4B5563' }}>{timeAgo(msg.created_at)}</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 14px' }}>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E5E7EB' }}>{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Write a message..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim()} style={{ background: newMessage.trim() ? G.purple : 'rgba(99,102,241,0.2)', border: 'none', borderRadius: '12px', padding: '12px 20px', color: 'white', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '14px' }}>
                    Send →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}