import numpy as np
from sqlalchemy.orm import Session
from app.models.book import Book
from app.models.shelf import Shelf
from app.models.review import Review
from typing import List

def get_content_based_recommendations(
    db: Session,
    user_id: str,
    limit: int = 6
) -> List[dict]:
    """Recommandation basée sur les genres et auteurs."""
    user_shelves = db.query(Shelf).filter(
        Shelf.user_id == user_id
    ).all()

    if not user_shelves:
        return get_popular_books(db, limit)

    user_book_ids = [str(s.book_id) for s in user_shelves]

    # Récupère les livres de l'utilisateur
    import uuid
    user_books = []
    for bid in user_book_ids:
        try:
            book = db.query(Book).filter(Book.id == uuid.UUID(bid)).first()
            if book:
                user_books.append(book)
        except:
            continue

    if not user_books:
        return get_popular_books(db, limit)

    # Collecte les auteurs et genres préférés
    favorite_authors = set()
    favorite_genres = set()
    for book in user_books:
        for author in (book.authors or []):
            favorite_authors.add(author)
        for genre in (book.genres or []):
            favorite_genres.add(genre)

    # Cherche des livres similaires
    all_books = db.query(Book).all()
    scored = []
    for book in all_books:
        if str(book.id) in user_book_ids:
            continue
        score = 0
        for author in (book.authors or []):
            if author in favorite_authors:
                score += 2
        for genre in (book.genres or []):
            if genre in favorite_genres:
                score += 1
        if score > 0:
            scored.append((book, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    result = []
    for book, score in scored[:limit]:
        result.append({
            "id": str(book.id),
            "title": book.title,
            "authors": book.authors or [],
            "cover_url": book.cover_url,
            "average_rating": book.average_rating,
            "similarity_score": float(score),
            "reason": "Based on your reading history"
        })

    return result if result else get_popular_books(db, limit)


def get_collaborative_recommendations(
    db: Session,
    user_id: str,
    limit: int = 6
) -> List[dict]:
    """Filtrage collaboratif simplifié."""
    my_shelves = db.query(Shelf).filter(
        Shelf.user_id == user_id
    ).all()
    my_book_ids = set(str(s.book_id) for s in my_shelves)

    if not my_book_ids:
        return get_popular_books(db, limit)

    from app.models.user import User
    other_users = db.query(User).filter(User.id != user_id).all()

    user_similarity = []
    for other_user in other_users:
        other_shelves = db.query(Shelf).filter(
            Shelf.user_id == other_user.id
        ).all()
        other_book_ids = set(str(s.book_id) for s in other_shelves)

        if not other_book_ids:
            continue

        intersection = len(my_book_ids & other_book_ids)
        union = len(my_book_ids | other_book_ids)
        similarity = intersection / union if union > 0 else 0

        if similarity > 0:
            user_similarity.append((other_user, similarity, other_book_ids))

    if not user_similarity:
        return get_popular_books(db, limit)

    user_similarity.sort(key=lambda x: x[1], reverse=True)

    recommended_book_ids = set()
    for _, _, other_books in user_similarity[:3]:
        new_books = other_books - my_book_ids
        recommended_book_ids.update(new_books)

    if not recommended_book_ids:
        return get_popular_books(db, limit)

    result = []
    import uuid
    for book_id in list(recommended_book_ids)[:limit]:
        try:
            book = db.query(Book).filter(
                Book.id == uuid.UUID(book_id)
            ).first()
            if book:
                result.append({
                    "id": str(book.id),
                    "title": book.title,
                    "authors": book.authors or [],
                    "cover_url": book.cover_url,
                    "average_rating": book.average_rating,
                    "similarity_score": 0.0,
                    "reason": "Readers like you also enjoyed this"
                })
        except:
            continue

    return result if result else get_popular_books(db, limit)


def get_popular_books(db: Session, limit: int = 6) -> List[dict]:
    """Retourne les livres les mieux notés."""
    books = db.query(Book).filter(
        Book.ratings_count > 0
    ).order_by(Book.average_rating.desc()).limit(limit).all()

    if not books:
        books = db.query(Book).limit(limit).all()

    return [
        {
            "id": str(book.id),
            "title": book.title,
            "authors": book.authors or [],
            "cover_url": book.cover_url,
            "average_rating": book.average_rating,
            "similarity_score": 0.0,
            "reason": "Popular on Maktaba"
        }
        for book in books
    ]