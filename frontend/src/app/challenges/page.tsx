'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  gold: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  green: 'linear-gradient(135deg, #10B981, #3B82F6)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function ChallengePage() {
  const router = useRouter()
  const [challenge, setChallenge] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [goal, setGoal] = useState(12)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const year = new Date().getFullYear()

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [challengeRes, leaderboardRes] = await Promise.all([
        api.get('/challenges/me'),
        api.get('/challenges/leaderboard')
      ])
      setChallenge(challengeRes.data)
      if (challengeRes.data) setGoal(challengeRes.data.goal)
      setLeaderboard(leaderboardRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const saveChallenge = async () => {
    setSaving(true)
    try {
      await api.post('/challenges/', { goal, year })
      fetchData()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <p style={{ color: '#6B7280' }}>Loading challenges...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <span style={{ fontSize: '18px', fontWeight: '700', ...G.text }}>Reading Challenge {year}</span>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* My Challenge Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '24px', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {challenge ? `Your ${year} Challenge` : `Start Your ${year} Challenge`}
              </h1>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
                {challenge ? `${challenge.books_read} of ${challenge.goal} books read` : 'Set a reading goal for this year'}
              </p>
            </div>
            {challenge?.completed && (
              <div style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', borderRadius: '50px', padding: '8px 20px', fontSize: '14px', fontWeight: '700' }}>
                🎉 Completed!
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {challenge && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Progress</span>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>{challenge.progress}%</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${challenge.progress}%`,
                  background: challenge.completed ? G.gold : G.purple,
                  height: '100%',
                  borderRadius: '50px',
                  transition: 'width 0.8s ease',
                  boxShadow: challenge.completed ? '0 0 20px rgba(245,158,11,0.5)' : '0 0 20px rgba(99,102,241,0.5)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ color: '#6B7280', fontSize: '12px' }}>{challenge.books_read} books read</span>
                <span style={{ color: '#6B7280', fontSize: '12px' }}>{Math.max(0, challenge.goal - challenge.books_read)} to go</span>
              </div>
            </div>
          )}

          {/* Set Goal */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
              {challenge ? 'Update your goal' : 'Set your reading goal'}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[5, 10, 12, 20, 24, 30, 50, 100].map(n => (
                  <button key={n} onClick={() => setGoal(n)} style={{
                    background: goal === n ? G.purple : 'rgba(255,255,255,0.06)',
                    border: goal === n ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                    boxShadow: goal === n ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                  }}>
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={goal}
                onChange={e => setGoal(Number(e.target.value))}
                min={1}
                style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: 'white', fontSize: '14px', outline: 'none', textAlign: 'center' }}
              />
              <button onClick={saveChallenge} disabled={saving} style={{ background: G.purple, border: 'none', borderRadius: '12px', padding: '10px 24px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                {saving ? 'Saving...' : challenge ? 'Update' : 'Start Challenge 🚀'}
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏆 <span style={{ ...G.text }}>Leaderboard {year}</span>
          </h2>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B5563' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
              <p>No challenges yet — be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leaderboard.map((entry, i) => (
                <div key={entry.user.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: i === 0 ? 'rgba(245,158,11,0.1)' : i === 1 ? 'rgba(156,163,175,0.08)' : i === 2 ? 'rgba(180,100,50,0.08)' : 'rgba(255,255,255,0.02)',
                  border: i === 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px', padding: '14px 16px'
                }}>
                  {/* Rank */}
                  <div style={{ fontSize: i < 3 ? '24px' : '16px', fontWeight: '700', minWidth: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: '40px', height: '40px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>
                    {entry.user.username?.[0]?.toUpperCase()}
                  </div>

                  {/* User info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{entry.user.full_name || entry.user.username}</span>
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        {entry.books_read}/{entry.goal} books
                        {entry.completed && <span style={{ marginLeft: '8px' }}>✅</span>}
                      </span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '50px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${entry.progress}%`,
                        background: entry.completed ? G.gold : i === 0 ? G.gold : G.purple,
                        height: '100%', borderRadius: '50px', transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>

                  {/* Progress % */}
                  <div style={{ fontSize: '14px', fontWeight: '700', minWidth: '45px', textAlign: 'right', background: entry.completed ? G.gold : G.purple, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {entry.progress}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}