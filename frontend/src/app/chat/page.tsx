'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Maktaba's AI assistant 📚 Ask me anything about books — recommendations, themes, authors, or chat about a specific book in your library!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [spoilerSafe, setSpoilerSafe] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await api.post('/chatbot/', {
        message: userMessage,
        conversation_history: history,
        spoiler_safe: spoilerSafe
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-blue-500">🤖 Book AI Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Spoiler-safe</span>
          <button
            onClick={() => setSpoilerSafe(!spoilerSafe)}
            className={`w-10 h-6 rounded-full transition ${spoilerSafe ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${spoilerSafe ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-900 border border-gray-800 text-gray-100 rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <span className="text-xs text-gray-500 block mb-1">🤖 Maktaba AI</span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <span className="text-xs text-gray-500 block mb-1">🤖 Maktaba AI</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4 max-w-3xl mx-auto w-full">
          <div className="flex gap-2 flex-wrap">
            {[
              "Recommend me a mystery novel",
              "Who is the best sci-fi author?",
              "What should I read after Dune?",
              "Explain the themes of 1984",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-xs bg-gray-900 border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-full transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about books..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-3 rounded-xl font-medium transition text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}