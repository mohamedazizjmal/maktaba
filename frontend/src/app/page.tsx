'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-6xl font-bold mb-4">
          مكتبة <span className="text-blue-500">Maktaba</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          Your AI-powered reading companion. Discover books, track your reading, 
          and get personalized recommendations.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Get Started
          </Link>
          <Link 
            href="/login"
            className="border border-gray-600 hover:border-gray-400 text-gray-300 px-8 py-3 rounded-lg font-medium transition"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl">
          {[
            { icon: '📚', title: 'Track Reading', desc: 'Organize your books into shelves and track your progress' },
            { icon: '🤖', title: 'AI Recommendations', desc: 'Get personalized book suggestions powered by AI' },
            { icon: '💬', title: 'Book Chatbot', desc: 'Ask questions about any book and get instant answers' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}