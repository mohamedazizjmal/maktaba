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
    ol_id: str = Query(..., description="Open Library ID (ex: OL45883W)"),
    db: Session = Depends(get_db)
):
    """Sauvegarde un livre depuis Open Library dans notre base de données."""
    details = await get_book_details(ol_id)
    if not details:
        raise HTTPException(status_code=404, detail="Book not found on Open Library")

    description = details.get("description")
    if isinstance(description, dict):
        description = description.get("value")

    from app.schemas.book import OpenLibraryBook
    book_data = OpenLibraryBook(
        open_library_id=ol_id,
        title=details.get("title", "Unknown"),
        authors=[],
        description=description,
    )

    book = save_book_to_db(db, book_data)
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