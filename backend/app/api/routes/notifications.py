from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def create_notification(
    db: Session,
    user_id: str,
    type: str,
    message: str,
    link: str = None
):
    """Utilitaire pour créer une notification."""
    try:
        import uuid as _uuid
        notif = Notification(
            user_id=_uuid.UUID(str(user_id)),
            type=type,
            message=message,
            link=link
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        print(f"Notification error: {e}")


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": str(n.id),
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}