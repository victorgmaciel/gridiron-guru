from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from uuid import uuid4
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    picks = relationship("Pick", back_populates="user", cascade="all, delete-orphan")
    groups_created = relationship("Group", back_populates="creator", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMembership", back_populates="user", cascade="all, delete-orphan")
    leaderboards = relationship("Leaderboard", back_populates="user", cascade="all, delete-orphan")
    tiebreaker_picks = relationship("TiebreakerPick", back_populates="user", cascade="all, delete-orphan")


class Game(Base):
    __tablename__ = "games"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    week = Column(Integer, nullable=False)
    season = Column(Integer, nullable=False)
    game_time = Column(DateTime, nullable=False)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    winner = Column(String, nullable=True)

    picks = relationship("Pick", back_populates="game", cascade="all, delete-orphan")
    tiebreaker_picks = relationship("TiebreakerPick", back_populates="game", cascade="all, delete-orphan")


class Pick(Base):
    __tablename__ = "picks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)
    selected_team = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="picks")
    game = relationship("Game", back_populates="picks")


class Group(Base):
    __tablename__ = "groups"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, unique=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="groups_created")
    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    leaderboards = relationship("Leaderboard", back_populates="group", cascade="all, delete-orphan")


class GroupMembership(Base):
    __tablename__ = "group_memberships"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="memberships")
    user = relationship("User", back_populates="group_memberships")


class Leaderboard(Base):
    __tablename__ = "leaderboards"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week = Column(Integer, nullable=False)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="leaderboards")
    user = relationship("User", back_populates="leaderboards")


class TiebreakerPick(Base):
    __tablename__ = "tiebreaker_picks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)
    predicted_score_total = Column(Integer, nullable=False)

    user = relationship("User", back_populates="tiebreaker_picks")
    game = relationship("Game", back_populates="tiebreaker_picks")
