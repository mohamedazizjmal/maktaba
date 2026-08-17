'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0D0B1E',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Spotlight top right */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-100px',
        width: '700px', height: '700px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(99,102,241,0.2) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '80px', right: '80px',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 64px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/logo.png" alt="Maktaba" width={36} height={36} style={{ borderRadius: '8px' }} />
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Maktaba</span>
        </div>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          {[
            { label: 'Home', href: '#' },
            { label: 'Features', href: '#features' },
            { label: 'About', href: '#about' },
            { label: 'Contact', href: '#contact' },
          ].map((item, i) => (
            <a key={item.label} href={item.href} style={{
              color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none', fontSize: '15px',
              fontWeight: i === 0 ? '500' : '400',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = i === 0 ? 'white' : 'rgba(255,255,255,0.5)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link href="/register" style={{
          background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
          color: 'white', padding: '10px 24px', borderRadius: '50px',
          fontSize: '14px', fontWeight: '600', textDecoration: 'none',
          boxShadow: '0 0 20px rgba(168,85,247,0.4)',
        }}>
          Try for free
        </Link>
      </nav>

      {/* Hero */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '82vh', textAlign: 'center',
        padding: '60px 24px 0',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '50px', padding: '6px 18px', fontSize: '13px',
          color: 'rgba(255,255,255,0.65)', marginBottom: '36px',
        }}>
          <span style={{ width: '6px', height: '6px', background: '#A855F7', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Now with Llama 3.3 — the smartest book AI ever
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 86px)',
          fontWeight: '800', lineHeight: '1.08',
          marginBottom: '24px', letterSpacing: '-2px',
          maxWidth: '900px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.88)' }}>Smarter Reading,</span>
          <br />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>Powered by Advanced AI</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '17px', color: 'rgba(255,255,255,0.42)',
          maxWidth: '540px', lineHeight: '1.75', marginBottom: '48px',
        }}>
          Where <span style={{ color: 'rgba(255,255,255,0.75)' }}>Artificial Intelligence</span> meets your reading journey.
          Discover books, track progress, chat with AI about any story.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            color: 'white', padding: '14px 36px', borderRadius: '50px',
            fontSize: '15px', fontWeight: '600', textDecoration: 'none',
            boxShadow: '0 0 32px rgba(168,85,247,0.45)',
          }}>
            Start reading free
          </Link>
          <Link href="/login" style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.75)',
            padding: '14px 36px', borderRadius: '50px',
            fontSize: '15px', fontWeight: '500', textDecoration: 'none',
          }}>
            Sign In →
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '56px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: '20M+', label: 'Books available' },
            { value: 'Llama 3.3', label: 'AI model' },
            { value: '100%', label: 'Free forever' },
            { value: 'Phase 3', label: 'Social features' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" style={{ position: 'relative', zIndex: 10, maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: '12px' }}>
            Everything you need to love reading
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Maktaba combines the best of Goodreads with cutting-edge AI — completely free.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {[
            { icon: '🤖', title: 'AI Recommendations', desc: 'Personalized book suggestions based on your reading history. The more you read, the smarter it gets.', tag: 'Powered by ML' },
            { icon: '💬', title: 'Book Chatbot', desc: 'Ask anything about any book. Spoiler-safe mode included. Powered by Llama 3.3 70B via Groq.', tag: 'RAG Pipeline' },
            { icon: '📊', title: 'Reading Analytics', desc: 'Track your reading velocity, genre breakdown, year-in-books summary and much more.', tag: 'Data Insights' },
            { icon: '⭐', title: 'Reviews & Ratings', desc: 'Write rich reviews with spoiler tags. Rate books with 5 stars. See what the community thinks.', tag: 'Community' },
            { icon: '📚', title: 'Smart Library', desc: 'Organize books into Want to Read, Reading, and Read shelves. Track your progress page by page.', tag: 'Goodreads++' },
            { icon: '👥', title: 'Social & Clubs', desc: 'Follow readers, see their activity feed, join book clubs with group chat and reading challenges.', tag: 'Phase 3' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(168,85,247,0.08)'
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(168,85,247,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>{f.icon}</span>
                <span style={{
                  background: 'rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.9)',
                  borderRadius: '50px', padding: '3px 10px', fontSize: '11px', fontWeight: '600'
                }}>
                  {f.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'rgba(255,255,255,0.85)' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '14px', lineHeight: '1.65' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About / How it works */}
      <div id="about" style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '34px', fontWeight: '700', color: 'rgba(255,255,255,0.82)', marginBottom: '16px' }}>
          Built for book lovers, by a book lover
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '15px', lineHeight: '1.8', maxWidth: '620px', margin: '0 auto 40px' }}>
          Maktaba was built as a data science engineering project — combining FastAPI, Next.js, PostgreSQL, and AI to create what Goodreads should have been in 2025.
          Free. Fast. Intelligent.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'FastAPI Backend', color: '#10B981' },
            { label: 'Next.js Frontend', color: '#6366F1' },
            { label: 'Supabase DB', color: '#3B82F6' },
            { label: 'Groq AI', color: '#A855F7' },
            { label: 'Open Library', color: '#F59E0B' },
          ].map(tech => (
            <span key={tech.label} style={{
              background: `${tech.color}15`,
              border: `1px solid ${tech.color}40`,
              color: tech.color,
              borderRadius: '50px', padding: '6px 16px',
              fontSize: '13px', fontWeight: '500'
            }}>
              {tech.label}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div id="contact" style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '20px 24px 100px' }}>
        <div style={{
          background: 'rgba(168,85,247,0.05)',
          border: '1px solid rgba(168,85,247,0.18)',
          borderRadius: '32px', padding: '64px 40px',
          maxWidth: '600px', margin: '0 auto',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '250px', height: '250px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <Image src="/logo.png" alt="Maktaba" width={56} height={56} style={{ borderRadius: '12px', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: '12px' }}>
            Ready to read smarter?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', marginBottom: '36px', fontSize: '15px', lineHeight: '1.7' }}>
            Join Maktaba today. No credit card required.<br />Completely free, forever.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: 'white', padding: '14px 36px', borderRadius: '50px',
              fontSize: '15px', fontWeight: '600', textDecoration: 'none',
              boxShadow: '0 0 30px rgba(168,85,247,0.4)',
            }}>
              Create Free Account →
            </Link>
            <Link href="/login" style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.65)',
              padding: '14px 36px', borderRadius: '50px',
              fontSize: '15px', fontWeight: '500', textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '24px 24px 32px',
        color: 'rgba(255,255,255,0.22)', fontSize: '13px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      }}>
        <Image src="/logo.png" alt="Maktaba" width={18} height={18} style={{ borderRadius: '4px', opacity: 0.5 }} />
        <span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>Maktaba</span>
          {' '}© 2025 — AI-powered reading platform. Built with ❤️ using Next.js, FastAPI & Groq.
        </span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  )
}