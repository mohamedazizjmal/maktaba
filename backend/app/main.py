from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.routes import auth, books, shelves, reviews, recommendations, chatbot

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Maktaba API",
    description="AI-powered reading platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(shelves.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Maktaba API is running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}