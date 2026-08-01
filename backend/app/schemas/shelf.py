from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.shelf import ShelfType

class ShelfCreate(BaseModel):
    book_id: UUID
    shelf_type: ShelfType
    progress_pages: Optional[int] = 0
    notes: Optional[str] = None

class ShelfUpdate(BaseModel):
    shelf_type: Optional[ShelfType] = None
    progress_pages: Optional[int] = None
    notes: Optional[str] = None

class ShelfResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    shelf_type: ShelfType
    progress_pages: int
    notes: Optional[str]
    created_at: datetime
    book_title: Optional[str] = None
    book_cover: Optional[str] = None
    book_authors: Optional[list] = None

    class Config:
        from_attributes = True