from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ReviewCreate(BaseModel):
    book_id: UUID
    rating: float = Field(..., ge=1, le=5)
    content: Optional[str] = None
    contains_spoiler: bool = False

class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=5)
    content: Optional[str] = None
    contains_spoiler: Optional[bool] = None

class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    rating: float
    content: Optional[str]
    contains_spoiler: bool
    created_at: datetime
    username: Optional[str] = None
    book_title: Optional[str] = None

    class Config:
        from_attributes = True