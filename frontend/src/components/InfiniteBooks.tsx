'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '@/lib/api'
import BookSkeleton from './BookSkeleton'
import toast from 'react-hot-toast'

interface Book {
  open_library_id: string
  title: string
  authors: string[]
  cover_url: string | null
  publish_year: number | null
}

interface Props {
  initialQuery: string
}

export default function InfiniteBooks({ initialQuery }: Props) {
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchBooks = useCallback(async (pageNum: number) => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await api.get(`/books/search?q=${initialQuery}&limit=10`)
      const newBooks = res.data
      if (newBooks.length === 0) {
        setHasMore(false)
      } else {
        setBooks(prev => [...prev, ...newBooks])
        setPage(prev => prev + 1)
      }
    } catch (e) {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }, [initialQuery, loading, hasMore])

  useEffect(() => {
    fetchBooks(1)
  }, [initialQuery])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchBooks(page)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [fetchBooks, hasMore, loading, page])

  const addToShelf = async (book: Book, shelf_type: string) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      await api.post('/shelves/', { book_id: saved.data.id, shelf_type, progress_pages: 0 })
      toast.success(`Added to ${shelf_type.replace(/_/g, ' ')}!`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error')
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {books.map((book, i) => (
          <div key={`${book.open_library_id}-${i}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            {book.cover_url
              ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '200px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📚</div>
            }
            <div style={{ padding: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'white', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {book.title}
              </h3>
              <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>{book.authors?.join(', ')}</p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { label: '📖', type: 'want_to_read' },
                  { label: '📚', type: 'reading' },
                  { label: '✅', type: 'read' },
                ].map(btn => (
                  <button key={btn.type} onClick={() => addToShelf(book, btn.type)}
                    title={btn.type.replace(/_/g, ' ')}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {loading && Array(4).fill(0).map((_, i) => <BookSkeleton key={i} />)}
      </div>

      <div ref={loadMoreRef} style={{ height: '20px', marginTop: '20px' }} />

      {!hasMore && books.length > 0 && (
        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: '14px', marginTop: '20px' }}>
          No more books to load
        </p>
      )}
    </div>
  )
}