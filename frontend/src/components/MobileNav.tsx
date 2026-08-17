'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  const links = [
    { href: '/home', label: 'Home', icon: '🏠' },
    { href: '/dashboard', label: 'Library', icon: '📚' },
    { href: '/chat', label: 'AI', icon: '🤖' },
    { href: '/social', label: 'Social', icon: '👥' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <style>{`
        .mobile-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
          body {
            padding-bottom: 70px;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
      <div className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(13,13,26,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0 20px',
        zIndex: 1000,
      }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            textDecoration: 'none', padding: '8px 16px', borderRadius: '12px',
            background: isActive(link.href) ? 'rgba(99,102,241,0.2)' : 'transparent',
            transition: 'all 0.2s', minWidth: '60px',
          }}>
            <span style={{ fontSize: '22px' }}>{link.icon}</span>
            <span style={{
              fontSize: '10px',
              color: isActive(link.href) ? '#818CF8' : '#6B7280',
              fontWeight: isActive(link.href) ? '600' : '400'
            }}>
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}