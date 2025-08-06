from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import Optional

# ----------------------------
# User
# ----------------------------
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Game
# ----------------------------
class GameCreate(BaseModel):
    week: int
    season: int
    game_time: datetime
    home_team: str
    away_team: str

class GameOut(BaseModel):
    id: UUID
    week: int
    season: int
    game_time: datetime
    home_team: str
    away_team: str
    winner: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------------------
# Pick
# ----------------------------
class PickCreate(BaseModel):
    user_id: UUID
    game_id: UUID
    selected_team: str

class PickOut(BaseModel):
    id: UUID
    user_id: UUID
    game_id: UUID
    selected_team: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Group
# ----------------------------
class GroupCreate(BaseModel):
    name: str
    created_by: UUID

class GroupOut(BaseModel):
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Group Membership
# ----------------------------
class GroupMembershipCreate(BaseModel):
    group_id: UUID
    user_id: UUID

class GroupMembershipOut(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    joined_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Leaderboard
# ----------------------------
class LeaderboardEntryCreate(BaseModel):
    group_id: UUID
    user_id: UUID
    week: int
    wins: int
    losses: int

class LeaderboardEntryOut(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    week: int
    wins: int
    losses: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Tiebreaker Pick
# ----------------------------
class TiebreakerPickCreate(BaseModel):
    user_id: UUID
    game_id: UUID
    predicted_score_total: int

class TiebreakerPickOut(BaseModel):
    id: UUID
    user_id: UUID
    game_id: UUID
    predicted_score_total: int

    class Config:
        from_attributes = True
