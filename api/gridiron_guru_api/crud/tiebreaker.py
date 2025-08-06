from sqlalchemy.orm import Session
from uuid import UUID
from models import TiebreakerPick
from schemas_all import TiebreakerPickCreate

def create_tiebreaker_pick(db: Session, pick: TiebreakerPickCreate):
    db_pick = TiebreakerPick(**pick.dict())
    db.add(db_pick)
    db.commit()
    db.refresh(db_pick)
    return db_pick

def get_tiebreaker_pick(db: Session, user_id: UUID, game_id: UUID):
    return db.query(TiebreakerPick).filter(
        TiebreakerPick.user_id == user_id,
        TiebreakerPick.game_id == game_id
    ).first()
