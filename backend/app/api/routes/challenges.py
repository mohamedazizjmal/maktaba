from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.models.challenge import Challenge
from app.models.shelf import Shelf, ShelfType
from app.models.user import User
from app.core.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/challenges", tags=["Challenges"])


class ChallengeCreate(BaseModel):
    goal: int
    year: Optional[int] = None


@router.post("/")
def create_challenge(
    data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    year = data.year or datetime.now().year

    existing = db.query(Challenge).filter(
        Challenge.user_id == current_user.id,
        Challenge.year == year
    ).first()

    if existing:
        existing.goal = data.goal
        db.commit()
        db.refresh(existing)
        return existing

    challenge = Challenge(
        user_id=current_user.id,
        year=year,
        goal=data.goal
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.get("/me")
def get_my_challenge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    year = datetime.now().year
    challenge = db.query(Challenge).filter(
        Challenge.user_id == current_user.id,
        Challenge.year == year
    ).first()

    if not challenge:
        return None

    # Compte les livres lus cette année
    books_read = db.query(Shelf).filter(
        Shelf.user_id == current_user.id,
        Shelf.shelf_type == ShelfType.read
    ).count()

    progress = min(100, int((books_read / challenge.goal) * 100)) if challenge.goal > 0 else 0

    return {
        "id": str(challenge.id),
        "goal": challenge.goal,
        "year": challenge.year,
        "books_read": books_read,
        "progress": progress,
        "completed": books_read >= challenge.goal
    }


@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    year = datetime.now().year
    challenges = db.query(Challenge).filter(
        Challenge.year == year
    ).all()

    leaderboard = []
    for challenge in challenges:
        user = db.query(User).filter(User.id == challenge.user_id).first()
        if not user:
            continue

        books_read = db.query(Shelf).filter(
            Shelf.user_id == challenge.user_id,
            Shelf.shelf_type == ShelfType.read
        ).count()

        progress = min(100, int((books_read / challenge.goal) * 100)) if challenge.goal > 0 else 0

        leaderboard.append({
            "user": {
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
            },
            "goal": challenge.goal,
            "books_read": books_read,
            "progress": progress,
            "completed": books_read >= challenge.goal,
            "year": year
        })

    leaderboard.sort(key=lambda x: (x['books_read'], x['progress']), reverse=True)

    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1

    return leaderboard