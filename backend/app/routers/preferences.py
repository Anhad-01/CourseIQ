from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, UserPreference
from ..schemas import UserPreferenceIn, UserPreferenceOut
from ..services.serialization import preference_to_dict


router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("", response_model=UserPreferenceOut)
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    return preference_to_dict(preference)


@router.get("/setup-complete")
def setup_complete(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    return {"setup_complete": preference is not None}


@router.put("", response_model=UserPreferenceOut)
def upsert_preferences(
    payload: UserPreferenceIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    values = payload.model_dump()
    if preference is None:
        preference = UserPreference(user_id=user.id, **values)
        db.add(preference)
    else:
        for key, value in values.items():
            setattr(preference, key, value)
    db.commit()
    db.refresh(preference)
    return preference_to_dict(preference)
