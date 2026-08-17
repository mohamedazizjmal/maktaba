'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setIsDark(saved === 'dark')
  }, [])

  const toggle = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.style.setProperty(
      '--bg-main', newTheme ? '#0D0D1A' : '#F8F9FA'
    )
    document.documentElement.style.setProperty(
      '--text-main', newTheme ? '#FFFFFF' : '#1A1A2E'
    )
  }

  return (
    <button onClick={toggle} style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '50px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '16px'
    }}>
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}