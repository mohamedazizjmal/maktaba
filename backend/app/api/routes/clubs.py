from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
import uuid
from app.db.database import get_db
from app.models.club import Club, ClubMember, ClubMessage
from app.models.user import User
from app.models.book import Book
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/clubs", tags=["Clubs"])


class ClubCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class MessageCreate(BaseModel):
    content: str


def club_to_dict(club: Club, db: Session, current_user_id: str = None):
    owner = db.query(User).filter(User.id == club.owner_id).first()
    members_count = db.query(ClubMember).filter(ClubMember.club_id == club.id).count()
    current_book = db.query(Book).filter(Book.id == club.current_book_id).first() if club.current_book_id else None
    is_member = False
    if current_user_id:
        is_member = db.query(ClubMember).filter(
            ClubMember.club_id == club.id,
            ClubMember.user_id == uuid.UUID(current_user_id)
        ).first() is not None

    return {
        "id": str(club.id),
        "name": club.name,
        "description": club.description,
        "is_public": club.is_public,
        "owner": {"id": str(owner.id), "username": owner.username} if owner else None,
        "members_count": members_count,
        "current_book": {
            "id": str(current_book.id),
            "title": current_book.title,
            "cover_url": current_book.cover_url,
        } if current_book else None,
        "is_member": is_member,
        "created_at": club.created_at,
    }


@router.post("/")
def create_club(
    data: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = Club(
        name=data.name,
        description=data.description,
        owner_id=current_user.id,
        is_public=data.is_public
    )
    db.add(club)
    db.flush()

    member = ClubMember(club_id=club.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(club)

    return club_to_dict(club, db, str(current_user.id))


@router.get("/")
def get_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clubs = db.query(Club).filter(Club.is_public == True).all()
    return [club_to_dict(c, db, str(current_user.id)) for c in clubs]


@router.get("/me")
def get_my_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(ClubMember).filter(
        ClubMember.user_id == current_user.id
    ).all()
    clubs = []
    for m in memberships:
        club = db.query(Club).filter(Club.id == m.club_id).first()
        if club:
            clubs.append(club_to_dict(club, db, str(current_user.id)))
    return clubs


@router.post("/{club_id}/join")
def join_club(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    existing = db.query(ClubMember).filter(
        ClubMember.club_id == club_id,
        ClubMember.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Left club", "is_member": False}

    member = ClubMember(club_id=club_id, user_id=current_user.id)
    db.add(member)
    db.commit()
    return {"message": "Joined club", "is_member": True}


@router.get("/{club_id}")
def get_club(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club_to_dict(club, db, str(current_user.id))


@router.get("/{club_id}/messages")
def get_messages(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(ClubMessage).filter(
        ClubMessage.club_id == club_id
    ).order_by(ClubMessage.created_at.asc()).limit(100).all()

    result = []
    for msg in messages:
        user = db.query(User).filter(User.id == msg.user_id).first()
        result.append({
            "id": str(msg.id),
            "content": msg.content,
            "created_at": msg.created_at,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
            } if user else None
        })
    return result


@router.post("/{club_id}/messages")
def send_message(
    club_id: UUID,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_member = db.query(ClubMember).filter(
        ClubMember.club_id == club_id,
        ClubMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="You must be a member to send messages")

    msg = ClubMessage(
        club_id=club_id,
        user_id=current_user.id,
        content=data.content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": str(msg.id),
        "content": msg.content,
        "created_at": msg.created_at,
        "user": {
            "id": str(current_user.id),
            "username": current_user.username,
            "full_name": current_user.full_name,
        }
    }