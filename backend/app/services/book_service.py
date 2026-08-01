import httpx
from sqlalchemy.orm import Session
from app.models.book import Book
from app.schemas.book import OpenLibraryBook
from typing import List, Optional

OPEN_LIBRARY_URL = "https://openlibrary.org"

async def search_open_library(query: str, limit: int = 10) -> List[OpenLibraryBook]:
    """Recherche des livres sur Open Library API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{OPEN_LIBRARY_URL}/search.json",
            params={"q": query, "limit": limit, "fields": "key,title,author_name,cover_i,first_publish_year,isbn,subject"},
            timeout=10.0
        )
        data = response.json()

    books = []
    for doc in data.get("docs", []):
        cover_id = doc.get("cover_i")
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

        isbn_list = doc.get("isbn", [])
        isbn = isbn_list[0] if isbn_list else None

        ol_key = doc.get("key", "").replace("/works/", "")

        book = OpenLibraryBook(
            open_library_id=ol_key,
            title=doc.get("title", "Unknown"),
            authors=doc.get("author_name", []),
            cover_url=cover_url,
            publish_year=doc.get("first_publish_year"),
            isbn=isbn,
        )
        books.append(book)

    return books


async def get_book_details(ol_id: str) -> Optional[dict]:
    """Récupère les détails complets d'un livre depuis Open Library."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{OPEN_LIBRARY_URL}/works/{ol_id}.json",
            timeout=10.0
        )
        if response.status_code != 200:
            return None
        return response.json()


def save_book_to_db(db: Session, book_data: OpenLibraryBook) -> Book:
    """Sauvegarde un livre dans la base de données s'il n'existe pas déjà."""
    existing = db.query(Book).filter(
        Book.open_library_id == book_data.open_library_id
    ).first()

    if existing:
        return existing

    book = Book(
        open_library_id=book_data.open_library_id,
        title=book_data.title,
        authors=book_data.authors,
        cover_url=book_data.cover_url,
        publish_year=book_data.publish_year,
        isbn=book_data.isbn,
        description=book_data.description,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def get_books_from_db(db: Session, skip: int = 0, limit: int = 20) -> List[Book]:
    return db.query(Book).offset(skip).limit(limit).all()


def get_book_by_id(db: Session, book_id: str) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()


def search_books_in_db(db: Session, query: str) -> List[Book]:
    return db.query(Book).filter(
        Book.title.ilike(f"%{query}%")
    ).limit(20).all()
        