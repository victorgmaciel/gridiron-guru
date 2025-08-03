# app/routes.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def home():
    return {"message": "Welcome to Gridiron Guru API"}

@router.get("/health")
def health():
    return {"status": "ok"}
