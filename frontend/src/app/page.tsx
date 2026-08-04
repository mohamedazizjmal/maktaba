'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#0D0D1A', color: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>📚</span>
          <span style={{ fontSize: '20px', fontWeight: '700', background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Maktaba
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Sign In</Link>
          <Link href="/register" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', padding: '10px 24px', borderRadius: '50px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative' }}>
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '50px', padding: '8px 20px', fontSize: '13px', color: '#A78BFA', marginBottom: '32px' }}>
          <span style={{ width: '8px', height: '8px', background: '#4ADE80', borderRadius: '50%', display: 'inline-block' }} />
          AI-Powered Reading Platform
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: '800', lineHeight: '1.05', marginBottom: '24px', letterSpacing: '-2px' }}>
          Read Smarter,<br />
          <span style={{ background: 'linear-gradient(135deg, #818CF8, #C084FC, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Not Harder
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: '20px', color: '#9CA3AF', maxWidth: '560px', margin: '0 auto 48px', lineHeight: '1.7' }}>
          Discover your next favorite book with AI recommendations, track your reading journey, and chat with AI about any book.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #6366F1, #A855F7)',
            padding: '16px 36px',
            borderRadius: '50px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>
            Start Reading Free →
          </Link>
          <Link href="/login" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '16px 36px',
            borderRadius: '50px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500',
          }}>
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '64px' }}>
          {[
            { value: '20M+', label: 'Books available' },
            { value: 'AI', label: 'Powered by Llama' },
            { value: '100%', label: 'Free forever' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </div>
              <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '40px', fontWeight: '700', marginBottom: '16px' }}>
          Everything you need to{' '}
          <span style={{ background: 'linear-gradient(135deg, #818CF8, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            love reading
          </span>
        </h2>
        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '60px', fontSize: '16px' }}>
          The modern reading platform with AI superpowers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🤖', title: 'AI Recommendations', desc: 'Personalized book suggestions based on your taste.', color: '#6366F1' },
            { icon: '💬', title: 'Book Chatbot', desc: 'Chat with AI about any book. Spoiler-free mode included.', color: '#A855F7' },
            { icon: '📊', title: 'Reading Analytics', desc: 'Beautiful stats and insights about your reading habits.', color: '#EC4899' },
            { icon: '⭐', title: 'Reviews & Ratings', desc: 'Write reviews and discover what others think.', color: '#F59E0B' },
            { icon: '📚', title: 'Smart Library', desc: 'Organize books into shelves. Track your progress.', color: '#10B981' },
            { icon: '🔍', title: 'Powerful Search', desc: 'Search 20M+ books instantly. Find your next read.', color: '#3B82F6' },
          ].map((f) => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${f.color}30`,
              borderRadius: '20px',
              padding: '28px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>{f.title}</h3>
              <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '32px',
          padding: '60px 40px',
        }}>
          <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
            Ready to transform<br />your reading?
          </h2>
          <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '16px' }}>
            Join Maktaba today — completely free.
          </p>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #6366F1, #A855F7)',
            padding: '16px 40px',
            borderRadius: '50px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            display: 'inline-block',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>
            Create Free Account →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#4B5563', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ background: 'linear-gradient(135deg, #818CF8, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '600' }}>Maktaba</span>
        {' '}— Built with ❤️ using Next.js, FastAPI & AI
      </footer>
    </main>
  )
}