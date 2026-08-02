from app.models.book import Book
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.book import BookResponse, OpenLibraryBook
from app.services.book_service import (
    search_open_library,
    save_book_to_db,
    get_books_from_db,
    get_book_by_id,
    search_books_in_db,
    get_book_details
)

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("/search", response_model=List[OpenLibraryBook])
async def search_books(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """Recherche des livres sur Open Library."""
    results = await search_open_library(q, limit)
    if not results:
        raise HTTPException(status_code=404, detail="No books found")
    return results


@router.post("/save", response_model=BookResponse)
async def save_book(
    ol_id: str = Query(..., description="Open Library ID"),
    db: Session = Depends(get_db)
):
    details = await get_book_details(ol_id)
    if not details:
        raise HTTPException(status_code=404, detail="Book not found on Open Library")

    description = details.get("description")
    if isinstance(description, dict):
        description = description.get("value")

    # Récupère les auteurs
    authors = []
    for author_entry in details.get("authors", []):
        author_key = author_entry.get("author", {}).get("key", "")
        if author_key:
            try:
                async with __import__('httpx').AsyncClient() as client:
                    res = await client.get(
                        f"https://openlibrary.org{author_key}.json",
                        timeout=5.0
                    )
                    author_data = res.json()
                    authors.append(author_data.get("name", ""))
            except:
                pass

    # Récupère la couverture
    covers = details.get("covers", [])
    cover_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else None

    book_data = OpenLibraryBook(
        open_library_id=ol_id,
        title=details.get("title", "Unknown"),
        authors=authors,
        description=description,
        cover_url=cover_url,
    )

    book = save_book_to_db(db, book_data)

    # Met à jour si le livre existait déjà
    if not book.authors and authors:
        book.authors = authors
    if not book.cover_url and cover_url:
        book.cover_url = cover_url
    if not book.description and description:
        book.description = description
    db.commit()

    return book


@router.get("/", response_model=List[BookResponse])
def get_books(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Retourne tous les livres sauvegardés dans notre base."""
    return get_books_from_db(db, skip, limit)


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, db: Session = Depends(get_db)):
    """Retourne un livre par son ID."""
    book = get_book_by_id(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/refresh-all")
async def refresh_all_books(db: Session = Depends(get_db)):
    """Met à jour tous les livres avec les données complètes d'Open Library."""
    books = db.query(Book).filter(Book.open_library_id != None).all()
    updated = 0
    
    for book in books:
        try:
            details = await get_book_details(book.open_library_id)
            if not details:
                continue

            # Description
            description = details.get("description")
            if isinstance(description, dict):
                description = description.get("value")
            if description and not book.description:
                book.description = description

            # Couverture
            covers = details.get("covers", [])
            if covers and not book.cover_url:
                book.cover_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg"

            # Auteurs
            if not book.authors:
                authors = []
                for author_entry in details.get("authors", []):
                    author_key = author_entry.get("author", {}).get("key", "")
                    if author_key:
                        try:
                            async with __import__('httpx').AsyncClient() as client:
                                res = await client.get(
                                    f"https://openlibrary.org{author_key}.json",
                                    timeout=5.0
                                )
                                author_data = res.json()
                                authors.append(author_data.get("name", ""))
                        except:
                            pass
                if authors:
                    book.authors = authors

            db.commit()
            updated += 1
        except:
            continue

    return {"message": f"Updated {updated} books"}