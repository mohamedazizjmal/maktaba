from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
    """Retourne des recommandations hybrides — sémantiques + collaboratives."""

    # Sémantique (sentence-transformers)
    semantic_recs = get_content_based_recommendations(
        db, str(current_user.id), limit=6
    )

    # Collaboratif
    collab_recs = get_collaborative_recommendations(
        db, str(current_user.id), limit=4
    )

    # Merge et déduplique
    seen_ids = set()
    merged = []

    # Sémantique en priorité
    for rec in semantic_recs:
        if rec["id"] not in seen_ids:
            seen_ids.add(rec["id"])
            rec["source"] = "semantic"
            merged.append(rec)

    # Collaboratif en complément
    for rec in collab_recs:
        if rec["id"] not in seen_ids:
            seen_ids.add(rec["id"])
            rec["source"] = "collaborative"
            merged.append(rec)

    return {
        "recommendations": merged[:10],
        "semantic": semantic_recs,
        "collaborative": collab_recs,
        "total": len(merged)
    }


@router.get("/popular")
def get_popular(db: Session = Depends(get_db)):
    """Retourne les livres populaires — pas besoin d'être connecté."""
    return get_popular_books(db, limit=10)


@router.get("/similar/{book_id}")
def get_similar_books(
    book_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trouve des livres similaires à un livre donné."""
    from app.models.book import Book
    import uuid
    from app.services.recommendation_service import (
        book_to_text, get_embeddings, cosine_similarity_vectors, _get_reason
    )
    import numpy as np

    try:
        target_book = db.query(Book).filter(
            Book.id == uuid.UUID(book_id)
        ).first()

        if not target_book:
            return {"similar": []}

        all_books = db.query(Book).filter(Book.id != target_book.id).all()
        if not all_books:
            return {"similar": []}

        target_text = book_to_text(target_book)
        target_emb = get_embeddings([target_text])[0]

        candidate_texts = [book_to_text(b) for b in all_books]
        candidate_embs = get_embeddings(candidate_texts)

        scored = []
        for book, emb in zip(all_books, candidate_embs):
            sim = cosine_similarity_vectors(target_emb, emb)
            if book.average_rating > 0:
                sim = sim * 0.85 + (book.average_rating / 5.0) * 0.15
            scored.append((book, sim))

        scored.sort(key=lambda x: x[1], reverse=True)

        result = []
        for book, score in scored[:6]:
            result.append({
                "id": str(book.id),
                "title": book.title,
                "authors": book.authors or [],
                "cover_url": book.cover_url,
                "average_rating": book.average_rating,
                "similarity_score": round(score, 4),
                "reason": _get_reason(book, [target_book])
            })

        return {"similar": result}

    except Exception as e:
        print(f"Similar books error: {e}")
        return {"similar": []}