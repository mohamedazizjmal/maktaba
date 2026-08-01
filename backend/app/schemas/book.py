from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class BookBase(BaseModel):
    title: str
    authors: Optional[List[str]] = []
    description: Optional[str] = None
    cover_url: Optional[str] = None
    genres: Optional[List[str]] = []
    publish_year: Optional[int] = None
    page_count: Optional[int] = None
    language: Optional[str] = "en"
    isbn: Optional[str] = None
    open_library_id: Optional[str] = None

class BookResponse(BaseModel):
    id: UUID
    title: str
    authors: Optional[List[str]] = []
    description: Optional[str] = None
    cover_url: Optional[str] = None
    genres: Optional[List[str]] = []
    publish_year: Optional[int] = None
    page_count: Optional[int] = None
    language: Optional[str] = None
    average_rating: float = 0.0
    ratings_count: int = 0
    open_library_id: Optional[str] = None

    class Config:
        from_attributes = True

class OpenLibraryBook(BaseModel):
    open_library_id: str
    title: str
    authors: List[str] = []
    cover_url: Optional[str] = None
    publish_year: Optional[int] = None
    isbn: Optional[str] = None
    description: Optional[str] = None