from sqlalchemy.orm import Session
from uuid import UUID
from models import Pick
from schemas_all import PickCreate

def create_pick(db: Session, pick: PickCreate):
    db_pick = Pick(**pick.dict())
    db.add(db_pick)
    db.commit()
    db.refresh(db_pick)
    return db_pick

def get_user_picks_for_week(db: Session, user_id: UUID, week: int, season: int):
    return db.query(Pick).join(Pick.game).filter(
        Pick.user_id == user_id,
        Pick.game.has(week=week, season=season)
    ).all()

def get_pick(db: Session, pick_id: UUID):
    return db.query(Pick).filter(Pick.id == pick_id).first()
