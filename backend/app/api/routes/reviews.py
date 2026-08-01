from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.database import get_db
from app.models.review import Review
from app.models.book import Book
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Vérifie si le livre existe
    book = db.query(Book).filter(Book.id == review_data.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Vérifie si l'utilisateur a déjà reviewé ce livre
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.book_id == review_data.book_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this book")

    review = Review(
        user_id=current_user.id,
        book_id=review_data.book_id,
        rating=review_data.rating,
        content=review_data.content,
        contains_spoiler=review_data.contains_spoiler
    )
    db.add(review)

    # Met à jour le rating moyen du livre
    all_reviews = db.query(Review).filter(Review.book_id == review_data.book_id).all()
    total_rating = sum(r.rating for r in all_reviews) + review_data.rating
    book.average_rating = total_rating / (len(all_reviews) + 1)
    book.ratings_count = len(all_reviews) + 1

    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "user_id": review.user_id,
        "book_id": review.book_id,
        "rating": review.rating,
        "content": review.content,
        "contains_spoiler": review.contains_spoiler,
        "created_at": review.created_at,
        "username": current_user.username,
        "book_title": book.title,
    }


@router.get("/book/{book_id}", response_model=List[ReviewResponse])
def get_book_reviews(
    book_id: UUID,
    db: Session = Depends(get_db)
):
    """Retourne toutes les reviews d'un livre."""
    reviews = db.query(Review).filter(Review.book_id == book_id).all()
    result = []
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        book = db.query(Book).filter(Book.id == review.book_id).first()
        result.append({
            "id": review.id,
            "user_id": review.user_id,
            "book_id": review.book_id,
            "rating": review.rating,
            "content": review.content,
            "contains_spoiler": review.contains_spoiler,
            "created_at": review.created_at,
            "username": user.username if user else None,
            "book_title": book.title if book else None,
        })
    return result


@router.get("/me", response_model=List[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne toutes les reviews de l'utilisateur connecté."""
    reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
    result = []
    for review in reviews:
        book = db.query(Book).filter(Book.id == review.book_id).first()
        result.append({
            "id": review.id,
            "user_id": review.user_id,
            "book_id": review.book_id,
            "rating": review.rating,
            "content": review.content,
            "contains_spoiler": review.contains_spoiler,
            "created_at": review.created_at,
            "username": current_user.username,
            "book_title": book.title if book else None,
        })
    return result


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: UUID,
    review_data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == current_user.id
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.content is not None:
        review.content = review_data.content
    if review_data.contains_spoiler is not None:
        review.contains_spoiler = review_data.contains_spoiler

    db.commit()
    db.refresh(review)

    book = db.query(Book).filter(Book.id == review.book_id).first()
    return {
        "id": review.id,
        "user_id": review.user_id,
        "book_id": review.book_id,
        "rating": review.rating,
        "content": review.content,
        "contains_spoiler": review.contains_spoiler,
        "created_at": review.created_at,
        "username": current_user.username,
        "book_title": book.title if book else None,
    }


@router.delete("/{review_id}")
def delete_review(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == current_user.id
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}