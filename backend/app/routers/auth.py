from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AuthRequest, AuthResponse
from ..security import create_access_token, hash_password, verify_password
from ..services.serialization import user_to_dict


router = APIRouter(prefix="/auth", tags=["auth"])


def email_from_name(full_name: str) -> str:
    return f"{full_name.strip().lower().replace(' ', '.')}@local.courseiq"


@router.post("/register", response_model=AuthResponse)
def register(payload: AuthRequest, db: Session = Depends(get_db)):
    full_name = (payload.full_name or "").strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required")

    email = (payload.email or email_from_name(full_name)).lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this name already exists")

    user = User(email=email, full_name=full_name, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user_to_dict(user), "access_token": create_access_token(user.id)}


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest, db: Session = Depends(get_db)):
    full_name = (payload.full_name or "").strip()
    email = (payload.email or email_from_name(full_name)).lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"user": user_to_dict(user), "access_token": create_access_token(user.id)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_to_dict(user)
