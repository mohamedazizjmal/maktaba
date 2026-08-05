from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)
    # Types: added_to_shelf, wrote_review, started_reading, finished_reading
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=True)
    book_title = Column(String, nullable=True)
    book_cover = Column(String, nullable=True)
    extra_data = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())