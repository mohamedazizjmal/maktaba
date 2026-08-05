from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import uuid
import json
from app.db.database import get_db
from app.models.follow import Follow
from app.models.activity import Activity
from app.models.user import User
from app.models.book import Book
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/social", tags=["Social"])


@router.post("/follow/{user_id}")
def follow_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(user_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unfollowed", "following": False}

    follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": "Following", "following": True}


@router.get("/followers")
def get_followers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    followers = db.query(Follow).filter(
        Follow.following_id == current_user.id
    ).all()

    result = []
    for f in followers:
        user = db.query(User).filter(User.id == f.follower_id).first()
        if user:
            result.append({
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
                "created_at": f.created_at
            })
    return result


@router.get("/following")
def get_following(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    following = db.query(Follow).filter(
        Follow.follower_id == current_user.id
    ).all()

    result = []
    for f in following:
        user = db.query(User).filter(User.id == f.following_id).first()
        if user:
            result.append({
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
                "created_at": f.created_at
            })
    return result


@router.get("/feed")
def get_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne le feed d'activité des gens que tu suis."""
    following = db.query(Follow).filter(
        Follow.follower_id == current_user.id
    ).all()

    following_ids = [f.following_id for f in following]
    following_ids.append(current_user.id)

    activities = db.query(Activity).filter(
        Activity.user_id.in_(following_ids)
    ).order_by(Activity.created_at.desc()).limit(50).all()

    result = []
    for act in activities:
        user = db.query(User).filter(User.id == act.user_id).first()
        result.append({
            "id": str(act.id),
            "user": {
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
            } if user else None,
            "activity_type": act.activity_type,
            "book_title": act.book_title,
            "book_cover": act.book_cover,
            "book_id": str(act.book_id) if act.book_id else None,
            "extra_data": json.loads(act.extra_data) if act.extra_data else None,
            "created_at": act.created_at,
        })
    return result


@router.get("/users/search")
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recherche d'utilisateurs."""
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%")
    ).filter(User.id != current_user.id).limit(10).all()

    result = []
    for user in users:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user.id
        ).first() is not None

        result.append({
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "is_following": is_following
        })
    return result


def log_activity(
    db: Session,
    user_id: str,
    activity_type: str,
    book_id: str = None,
    book_title: str = None,
    book_cover: str = None,
    extra_data: dict = None
):
    """Fonction utilitaire pour logger une activité."""
    try:
        activity = Activity(
            user_id=uuid.UUID(str(user_id)),
            activity_type=activity_type,
            book_id=uuid.UUID(str(book_id)) if book_id else None,
            book_title=book_title,
            book_cover=book_cover,
            extra_data=json.dumps(extra_data) if extra_data else None
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        print(f"Activity log error: {e}")