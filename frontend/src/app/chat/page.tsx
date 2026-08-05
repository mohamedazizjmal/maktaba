'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const G = {
  purple: 'linear-gradient(135deg, #6366F1, #A855F7)',
  text: { background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const },
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Maktaba's AI 📚 Ask me anything about books — recommendations, themes, authors, or chat about a specific book!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [spoilerSafe, setSpoilerSafe] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login')
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await api.post('/chatbot/', {
        message: userMsg,
        conversation_history: messages,
        spoiler_safe: spoilerSafe
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again!' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    "Recommend me a mystery novel 🔍",
    "Best sci-fi books of all time 🚀",
    "What should I read after Dune? 📖",
    "Explain themes of 1984 🤔",
  ]

  return (
    <div style={{ height: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Back
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', ...G.text }}>Maktaba AI</div>
              <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Spoiler toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Spoiler-safe</span>
          <div
            onClick={() => setSpoilerSafe(!spoilerSafe)}
            style={{ width: '44px', height: '24px', background: spoilerSafe ? G.purple : 'rgba(255,255,255,0.1)', borderRadius: '50px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
          >
            <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: spoilerSafe ? '23px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>Try asking...</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-start' }}>

              {msg.role === 'assistant' && (
                <div style={{ width: '32px', height: '32px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                  🤖
                </div>
              )}

              <div style={{
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user' ? G.purple : 'rgba(255,255,255,0.05)',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                fontSize: '14px',
                lineHeight: '1.7',
                boxShadow: msg.role === 'user' ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>Maktaba AI</div>
                )}
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'white' }}>{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', background: G.purple, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🤖</div>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px 20px 20px 4px', padding: '14px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '8px', height: '8px', background: '#6366F1', borderRadius: '50%', animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about books..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 20px', color: 'white', fontSize: '15px', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? 'rgba(99,102,241,0.3)' : G.purple, border: 'none', borderRadius: '16px', padding: '14px 24px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', boxShadow: loading || !input.trim() ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.2s', flexShrink: 0 }}
          >
            Send →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}