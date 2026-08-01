from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.recommendation_service import (
    get_content_based_recommendations,
    get_collaborative_recommendations,
    get_popular_books
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne des recommandations hybrides pour l'utilisateur."""

    # Content-based
    content_recs = get_content_based_recommendations(
        db, str(current_user.id), limit=4
    )

    # Collaborative
    collab_recs = get_collaborative_recommendations(
        db, str(current_user.id), limit=4
    )

    # Merge et déduplique
    seen_ids = set()
    merged = []

    for rec in content_recs + collab_recs:
        if rec["id"] not in seen_ids:
            seen_ids.add(rec["id"])
            merged.append(rec)

    return {
        "recommendations": merged[:8],
        "content_based": content_recs,
        "collaborative": collab_recs,
    }


@router.get("/popular")
def get_popular(
    db: Session = Depends(get_db)
):
    """Retourne les livres populaires — pas besoin d'être connecté."""
    return get_popular_books(db, limit=8)