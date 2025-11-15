from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.domain.user import User

router = APIRouter()

@router.get("/my-membership")
def get_my_membership(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Versión temporal que siempre retorna 404 para testing
    raise HTTPException(status_code=404, detail="No active membership found")