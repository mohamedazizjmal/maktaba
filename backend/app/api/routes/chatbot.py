from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.chatbot_service import chat_with_book, general_book_chat

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    book_id: Optional[str] = None
    conversation_history: List[ChatMessage] = []
    spoiler_safe: bool = True


@router.post("/")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Envoie un message au chatbot."""
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.conversation_history
    ]

    if request.book_id:
        response = await chat_with_book(
            book_id=request.book_id,
            message=request.message,
            conversation_history=history,
            db=db,
            spoiler_safe=request.spoiler_safe
        )
    else:
        response = await general_book_chat(
            message=request.message,
            conversation_history=history
        )

    return {
        "response": response,
        "book_id": request.book_id
    }