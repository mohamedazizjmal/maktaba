from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    open_library_id = Column(String, unique=True, nullable=True, index=True)
    isbn = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False, index=True)
    authors = Column(ARRAY(String), nullable=True)
    description = Column(Text, nullable=True)
    cover_url = Column(String, nullable=True)
    genres = Column(ARRAY(String), nullable=True)
    publish_year = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    language = Column(String, default="en")
    average_rating = Column(Float, default=0.0)
    ratings_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())