import numpy as np
from sqlalchemy.orm import Session
from app.models.book import Book
from app.models.shelf import Shelf, ShelfType
from app.models.review import Review
from typing import List
import httpx

async def get_book_description(ol_id: str) -> str:
    """Récupère la description d'un livre depuis Open Library."""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"https://openlibrary.org/works/{ol_id}.json",
                timeout=5.0
            )
            data = res.json()
            desc = data.get("description", "")
            if isinstance(desc, dict):
                desc = desc.get("value", "")
            return desc or ""
    except:
        return ""


def get_content_based_recommendations(
    db: Session,
    user_id: str,
    limit: int = 6
) -> List[dict]:
    """
    Recommandation basée sur le contenu.
    Trouve des livres similaires à ceux que l'utilisateur a lus
    en utilisant TF-IDF sur les titres et auteurs.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    # Récupère les livres de l'utilisateur
    user_shelves = db.query(Shelf).filter(
        Shelf.user_id == user_id
    ).all()

    if not user_shelves:
        return get_popular_books(db, limit)

    user_book_ids = [str(s.book_id) for s in user_shelves]

    # Récupère tous les livres
    all_books = db.query(Book).all()
    if len(all_books) < 2:
        return get_popular_books(db, limit)

    # Crée les features textuelles
    book_features = []
    for book in all_books:
        authors = " ".join(book.authors or [])
        genres = " ".join(book.genres or [])
        text = f"{book.title} {authors} {genres} {book.description or ''}"
        book_features.append(text)

    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(
        max_features=500,
        stop_words='english',
        ngram_range=(1, 2)
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(book_features)
    except:
        return get_popular_books(db, limit)

    # Trouve les indices des livres de l'utilisateur
    book_ids = [str(book.id) for book in all_books]
    user_indices = [
        book_ids.index(bid)
        for bid in user_book_ids
        if bid in book_ids
    ]

    if not user_indices:
        return get_popular_books(db, limit)

    # Calcule le profil utilisateur (moyenne des vecteurs)
    user_profile = np.asarray(
        tfidf_matrix[user_indices].mean(axis=0)
    )

    # Calcule la similarité cosinus
    similarities = cosine_similarity(user_profile, tfidf_matrix)[0]

    # Trie par similarité et exclut les livres déjà lus
    scored_books = [
        (all_books[i], float(similarities[i]))
        for i in range(len(all_books))
        if book_ids[i] not in user_book_ids
    ]
    scored_books.sort(key=lambda x: x[1], reverse=True)

    # Retourne les top recommandations
    result = []
    for book, score in scored_books[:limit]:
        result.append({
            "id": str(book.id),
            "title": book.title,
            "authors": book.authors or [],
            "cover_url": book.cover_url,
            "average_rating": book.average_rating,
            "similarity_score": round(score, 3),
            "reason": "Based on your reading history"
        })

    return result if result else get_popular_books(db, limit)


def get_collaborative_recommendations(
    db: Session,
    user_id: str,
    limit: int = 6
) -> List[dict]:
    """
    Filtrage collaboratif simplifié.
    Trouve des utilisateurs similaires et recommande leurs livres.
    """
    # Récupère les shelves de l'utilisateur courant
    my_shelves = db.query(Shelf).filter(
        Shelf.user_id == user_id
    ).all()
    my_book_ids = set(str(s.book_id) for s in my_shelves)

    if not my_book_ids:
        return get_popular_books(db, limit)

    # Récupère toutes les shelves des autres utilisateurs
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

        # Similarité de Jaccard
        intersection = len(my_book_ids & other_book_ids)
        union = len(my_book_ids | other_book_ids)
        similarity = intersection / union if union > 0 else 0

        if similarity > 0:
            user_similarity.append((other_user, similarity, other_book_ids))

    if not user_similarity:
        return get_popular_books(db, limit)

    # Trie par similarité
    user_similarity.sort(key=lambda x: x[1], reverse=True)

    # Récupère les livres des utilisateurs similaires
    recommended_book_ids = set()
    for _, _, other_books in user_similarity[:3]:
        new_books = other_books - my_book_ids
        recommended_book_ids.update(new_books)

    if not recommended_book_ids:
        return get_popular_books(db, limit)

    result = []
    for book_id in list(recommended_book_ids)[:limit]:
        import uuid
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