import numpy as np
from sqlalchemy.orm import Session
from app.models.book import Book
from app.models.shelf import Shelf, ShelfType
from app.models.review import Review
from typing import List, Optional
import json

# ── Embedding model (chargé une seule fois) ─────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("Loading embedding model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded ✓")
    return _model


# ── Utilitaires ──────────────────────────────────────────────────────────────

def book_to_text(book: Book) -> str:
    """Convertit un livre en texte pour l'embedding."""
    parts = []
    if book.title:
        parts.append(f"Title: {book.title}")
    if book.authors:
        parts.append(f"Authors: {', '.join(book.authors)}")
    if book.description:
        parts.append(f"Description: {book.description[:400]}")
    if book.genres:
        parts.append(f"Genres: {', '.join(book.genres)}")
    if book.publish_year:
        parts.append(f"Year: {book.publish_year}")
    return " | ".join(parts) if parts else book.title or "Unknown"


def cosine_similarity_vectors(a: np.ndarray, b: np.ndarray) -> float:
    """Calcule la similarité cosinus entre deux vecteurs."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def get_embeddings(texts: List[str]) -> np.ndarray:
    """Encode une liste de textes en embeddings."""
    model = get_model()
    return model.encode(texts, show_progress_bar=False, batch_size=32)


# ── Recommandation principale ────────────────────────────────────────────────

def get_content_based_recommendations(
    db: Session,
    user_id: str,
    limit: int = 8
) -> List[dict]:
    """
    Recommandation sémantique basée sur les embeddings.
    Compare les embeddings des livres lus par l'utilisateur
    avec tous les livres disponibles.
    """
    # Livres de l'utilisateur
    user_shelves = db.query(Shelf).filter(
        Shelf.user_id == user_id
    ).all()

    if not user_shelves:
        return get_popular_books(db, limit)

    user_book_ids = set(str(s.book_id) for s in user_shelves)

    # Récupère les livres lus/en cours (priorité aux livres lus)
    import uuid
    priority_types = [ShelfType.read, ShelfType.reading]
    user_books = []
    for shelf in user_shelves:
        if shelf.shelf_type in priority_types:
            try:
                book = db.query(Book).filter(Book.id == shelf.book_id).first()
                if book:
                    user_books.append(book)
            except:
                continue

    # Si pas de livres lus, prend tous les shelves
    if not user_books:
        for shelf in user_shelves:
            try:
                book = db.query(Book).filter(Book.id == shelf.book_id).first()
                if book:
                    user_books.append(book)
            except:
                continue

    if not user_books:
        return get_popular_books(db, limit)

    # Récupère tous les livres disponibles (pas déjà dans la library)
    all_books = db.query(Book).all()
    candidate_books = [b for b in all_books if str(b.id) not in user_book_ids]

    if not candidate_books:
        return get_popular_books(db, limit)

    try:
        # Crée le profil utilisateur — moyenne des embeddings
        user_texts = [book_to_text(b) for b in user_books]
        user_embeddings = get_embeddings(user_texts)
        user_profile = np.mean(user_embeddings, axis=0)

        # Pondère par les reviews — les livres bien notés comptent plus
        reviews = db.query(Review).filter(
            Review.user_id == user_id
        ).all()
        review_map = {str(r.book_id): r.rating for r in reviews}

        if len(user_books) > 1 and review_map:
            weights = []
            for book in user_books:
                rating = review_map.get(str(book.id), 3.0)
                weights.append(rating / 5.0)
            weights = np.array(weights)
            weights = weights / weights.sum()
            user_profile = np.average(user_embeddings, axis=0, weights=weights)

        # Encode tous les candidats
        candidate_texts = [book_to_text(b) for b in candidate_books]
        candidate_embeddings = get_embeddings(candidate_texts)

        # Calcule les similarités
        similarities = []
        for i, (book, emb) in enumerate(zip(candidate_books, candidate_embeddings)):
            sim = cosine_similarity_vectors(user_profile, emb)

            # Boost si livre bien noté globalement
            if book.average_rating > 0:
                rating_boost = (book.average_rating / 5.0) * 0.15
                sim = sim * 0.85 + rating_boost

            # Boost si livre récent
            if book.publish_year and book.publish_year > 2010:
                sim += 0.02

            similarities.append((book, sim))

        # Trie par similarité décroissante
        similarities.sort(key=lambda x: x[1], reverse=True)

        result = []
        for book, score in similarities[:limit]:
            result.append({
                "id": str(book.id),
                "title": book.title,
                "authors": book.authors or [],
                "cover_url": book.cover_url,
                "average_rating": book.average_rating,
                "similarity_score": round(score, 4),
                "reason": _get_reason(book, user_books)
            })

        return result if result else get_popular_books(db, limit)

    except Exception as e:
        print(f"Embedding recommendation error: {e}")
        return get_content_based_fallback(db, user_id, user_books, user_book_ids, limit)


def _get_reason(book: Book, user_books: List[Book]) -> str:
    """Génère une raison personnalisée pour la recommandation."""
    # Auteur en commun
    user_authors = set()
    for ub in user_books:
        for a in (ub.authors or []):
            user_authors.add(a.lower())

    for author in (book.authors or []):
        if author.lower() in user_authors:
            return f"More from {author}"

    # Genre en commun
    user_genres = set()
    for ub in user_books:
        for g in (ub.genres or []):
            user_genres.add(g.lower())

    for genre in (book.genres or []):
        if genre.lower() in user_genres:
            return f"Because you like {genre}"

    # Rating élevé
    if book.average_rating >= 4.0:
        return f"Highly rated — {book.average_rating:.1f}★"

    return "Similar to your reading taste"


def get_content_based_fallback(
    db: Session,
    user_id: str,
    user_books: List[Book],
    user_book_ids: set,
    limit: int
) -> List[dict]:
    """Fallback sans embeddings — matching auteurs/genres."""
    favorite_authors = set()
    favorite_genres = set()
    for book in user_books:
        for author in (book.authors or []):
            favorite_authors.add(author.lower())
        for genre in (book.genres or []):
            favorite_genres.add(genre.lower())

    all_books = db.query(Book).all()
    scored = []
    for book in all_books:
        if str(book.id) in user_book_ids:
            continue
        score = 0
        for author in (book.authors or []):
            if author.lower() in favorite_authors:
                score += 3
        for genre in (book.genres or []):
            if genre.lower() in favorite_genres:
                score += 1
        if book.average_rating > 0:
            score += book.average_rating * 0.3
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
            "similarity_score": round(score, 2),
            "reason": _get_reason(book, user_books)
        })

    return result if result else get_popular_books(db, limit)


def get_collaborative_recommendations(
    db: Session,
    user_id: str,
    limit: int = 6
) -> List[dict]:
    """
    Filtrage collaboratif amélioré avec similarité de Jaccard pondérée.
    """
    my_shelves = db.query(Shelf).filter(Shelf.user_id == user_id).all()
    my_book_ids = set(str(s.book_id) for s in my_shelves)

    # Mes reviews pour pondération
    my_reviews = db.query(Review).filter(Review.user_id == user_id).all()
    my_ratings = {str(r.book_id): r.rating for r in my_reviews}

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

        # Jaccard similarity
        intersection = len(my_book_ids & other_book_ids)
        union = len(my_book_ids | other_book_ids)
        jaccard = intersection / union if union > 0 else 0

        if jaccard > 0:
            # Pondère par les reviews communes
            common_books = my_book_ids & other_book_ids
            rating_agreement = 0
            if common_books:
                other_reviews = db.query(Review).filter(
                    Review.user_id == other_user.id,
                    Review.book_id.in_([
                        __import__('uuid').UUID(bid) for bid in common_books
                    ])
                ).all()
                other_ratings = {str(r.book_id): r.rating for r in other_reviews}

                agreements = []
                for bid in common_books:
                    if bid in my_ratings and bid in other_ratings:
                        diff = abs(my_ratings[bid] - other_ratings[bid])
                        agreements.append(1 - diff / 4)

                if agreements:
                    rating_agreement = sum(agreements) / len(agreements)
                    jaccard = jaccard * 0.7 + rating_agreement * 0.3

            user_similarity.append((other_user, jaccard, other_book_ids))

    if not user_similarity:
        return get_popular_books(db, limit)

    user_similarity.sort(key=lambda x: x[1], reverse=True)

    # Score chaque livre recommandé par les utilisateurs similaires
    book_scores = {}
    for similar_user, sim_score, other_books in user_similarity[:5]:
        new_books = other_books - my_book_ids
        for book_id in new_books:
            if book_id not in book_scores:
                book_scores[book_id] = 0
            book_scores[book_id] += sim_score

    if not book_scores:
        return get_popular_books(db, limit)

    # Trie par score
    sorted_books = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)

    result = []
    import uuid as uuid_lib
    for book_id, score in sorted_books[:limit]:
        try:
            book = db.query(Book).filter(
                Book.id == uuid_lib.UUID(book_id)
            ).first()
            if book:
                result.append({
                    "id": str(book.id),
                    "title": book.title,
                    "authors": book.authors or [],
                    "cover_url": book.cover_url,
                    "average_rating": book.average_rating,
                    "similarity_score": round(score, 4),
                    "reason": "Readers like you enjoyed this"
                })
        except:
            continue

    return result if result else get_popular_books(db, limit)


def get_popular_books(db: Session, limit: int = 8) -> List[dict]:
    """Retourne les livres les mieux notés — fallback."""
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