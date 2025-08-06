from sqlalchemy.orm import Session
from uuid import UUID
from models import Group, GroupMembership
from schemas_all import GroupCreate, GroupMembershipCreate

def create_group(db: Session, group: GroupCreate):
    db_group = Group(**group.dict())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def get_group(db: Session, group_id: UUID):
    return db.query(Group).filter(Group.id == group_id).first()

def get_group_by_name(db: Session, name: str):
    return db.query(Group).filter(Group.name == name).first()

def join_group(db: Session, membership: GroupMembershipCreate):
    db_membership = GroupMembership(**membership.dict())
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership

def get_user_groups(db: Session, user_id: UUID):
    return db.query(GroupMembership).filter(GroupMembership.user_id == user_id).all()
