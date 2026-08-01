'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export default function Dashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [shelves, setShelves] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchShelves()
  }, [])

  const fetchShelves = async () => {
    try {
      const res = await api.get('/shelves/')
      setShelves(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const searchBooks = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await api.get(`/books/search?q=${search}`)
      setResults(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToShelf = async (book: any, shelf_type: string) => {
    try {
      const saved = await api.post(`/books/save?ol_id=${book.open_library_id}`)
      await api.post('/shelves/', {
        book_id: saved.data.id,
        shelf_type,
        progress_pages: 0
      })
      fetchShelves()
      alert(`Added to ${shelf_type.replace('_', ' ')} !`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-500">مكتبة Maktaba</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Hello, {user?.full_name || user?.username || 'Reader'} 👋
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Discover Books</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
              placeholder="Search any book..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={searchBooks}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((book) => (
                <div key={book.open_library_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  {book.cover_url && (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-gray-400 text-xs mb-3">{book.authors?.join(', ')}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => addToShelf(book, 'want_to_read')}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition"
                    >
                      📖 Want to read
                    </button>
                    <button
                      onClick={() => addToShelf(book, 'reading')}
                      className="text-xs bg-blue-900 hover:bg-blue-800 px-2 py-1 rounded transition"
                    >
                      📚 Reading
                    </button>
                    <button
                      onClick={() => addToShelf(book, 'read')}
                      className="text-xs bg-green-900 hover:bg-green-800 px-2 py-1 rounded transition"
                    >
                      ✅ Read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Library */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My Library</h2>
          {shelves.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📚</p>
              <p>Your library is empty — search for books and add them!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['want_to_read', 'reading', 'read'].map((type) => (
                <div key={type} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 text-gray-300">
                    {type === 'want_to_read' ? '📖 Want to Read'
                      : type === 'reading' ? '📚 Reading'
                      : '✅ Read'}
                    <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                      {shelves.filter(s => s.shelf_type === type).length}
                    </span>
                  </h3>
                  {shelves.filter(s => s.shelf_type === type).map((shelf) => (
                    <div key={shelf.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                      {shelf.book_cover && (
                        <img
                          src={shelf.book_cover}
                          alt=""
                          className="w-8 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="text-sm text-white">{shelf.book_title || 'Unknown book'}</p>
                        <p className="text-xs text-gray-500">{shelf.book_authors?.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}