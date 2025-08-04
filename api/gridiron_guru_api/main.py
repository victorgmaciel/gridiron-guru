from fastapi import FastAPI
from gridiron_guru_api.routes import router


app = FastAPI(
    title="Gridiron Guru API",
    version="1.0.0"
)

app.include_router(router)
