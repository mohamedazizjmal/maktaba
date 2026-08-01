from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.database import get_db
from app.models.shelf import Shelf, ShelfType
from app.models.book import Book
from app.models.user import User
from app.schemas.shelf import ShelfCreate, ShelfUpdate, ShelfResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/shelves", tags=["Shelves"])


@router.post("/", response_model=ShelfResponse)
def add_to_shelf(
    shelf_data: ShelfCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Shelf).filter(
        Shelf.user_id == current_user.id,
        Shelf.book_id == shelf_data.book_id
    ).first()

    if existing:
        existing.shelf_type = shelf_data.shelf_type
        existing.progress_pages = shelf_data.progress_pages or 0
        existing.notes = shelf_data.notes
        db.commit()
        db.refresh(existing)
        shelf = existing
    else:
        shelf = Shelf(
            user_id=current_user.id,
            book_id=shelf_data.book_id,
            shelf_type=shelf_data.shelf_type,
            progress_pages=shelf_data.progress_pages or 0,
            notes=shelf_data.notes
        )
        db.add(shelf)
        db.commit()
        db.refresh(shelf)

    book = db.query(Book).filter(Book.id == shelf.book_id).first()
    return {
        "id": shelf.id,
        "user_id": shelf.user_id,
        "book_id": shelf.book_id,
        "shelf_type": shelf.shelf_type,
        "progress_pages": shelf.progress_pages,
        "notes": shelf.notes,
        "created_at": shelf.created_at,
        "book_title": book.title if book else None,
        "book_cover": book.cover_url if book else None,
        "book_authors": book.authors if book else None,
    }


@router.get("/", response_model=List[ShelfResponse])
def get_my_shelves(
    shelf_type: ShelfType = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Shelf).filter(Shelf.user_id == current_user.id)
    if shelf_type:
        query = query.filter(Shelf.shelf_type == shelf_type)
    shelves = query.all()

    result = []
    for shelf in shelves:
        book = db.query(Book).filter(Book.id == shelf.book_id).first()
        result.append({
            "id": shelf.id,
            "user_id": shelf.user_id,
            "book_id": shelf.book_id,
            "shelf_type": shelf.shelf_type,
            "progress_pages": shelf.progress_pages,
            "notes": shelf.notes,
            "created_at": shelf.created_at,
            "book_title": book.title if book else None,
            "book_cover": book.cover_url if book else None,
            "book_authors": book.authors if book else None,
        })
    return result


@router.patch("/{shelf_id}", response_model=ShelfResponse)
def update_shelf(
    shelf_id: UUID,
    shelf_data: ShelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.user_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    if shelf_data.shelf_type is not None:
        shelf.shelf_type = shelf_data.shelf_type
    if shelf_data.progress_pages is not None:
        shelf.progress_pages = shelf_data.progress_pages
    if shelf_data.notes is not None:
        shelf.notes = shelf_data.notes

    db.commit()
    db.refresh(shelf)

    book = db.query(Book).filter(Book.id == shelf.book_id).first()
    return {
        "id": shelf.id,
        "user_id": shelf.user_id,
        "book_id": shelf.book_id,
        "shelf_type": shelf.shelf_type,
        "progress_pages": shelf.progress_pages,
        "notes": shelf.notes,
        "created_at": shelf.created_at,
        "book_title": book.title if book else None,
        "book_cover": book.cover_url if book else None,
        "book_authors": book.authors if book else None,
    }


@router.delete("/{shelf_id}")
def remove_from_shelf(
    shelf_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.user_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    db.delete(shelf)
    db.commit()
    return {"message": "Book removed from shelf"}