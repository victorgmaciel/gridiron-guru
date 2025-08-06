from sqlalchemy.orm import Session
from uuid import UUID
from models import Game
from schemas_all import GameCreate

def create_game(db: Session, game: GameCreate):
    db_game = Game(**game.dict())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def get_game(db: Session, game_id: UUID):
    return db.query(Game).filter(Game.id == game_id).first()

def get_games_by_week(db: Session, week: int, season: int):
    return db.query(Game).filter(Game.week == week, Game.season == season).all()

def update_game_winner(db: Session, game_id: UUID, winner: str):
    game = db.query(Game).filter(Game.id == game_id).first()
    if game:
        game.winner = winner
        db.commit()
        db.refresh(game)
    return game
