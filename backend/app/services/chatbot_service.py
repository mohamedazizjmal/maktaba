from groq import Groq
from sqlalchemy.orm import Session
from app.models.book import Book
from app.core.config import settings
import httpx

client = Groq(api_key=settings.GROQ_API_KEY)

async def get_book_context(book_id: str, db: Session) -> str:
    """Récupère le contexte du livre depuis la base + Open Library."""
    import uuid
    try:
        book = db.query(Book).filter(Book.id == uuid.UUID(book_id)).first()
        if not book:
            return ""

        context = f"Title: {book.title}\n"
        context += f"Authors: {', '.join(book.authors or [])}\n"

        if book.description:
            context += f"Description: {book.description}\n"
        else:
            # Récupère la description depuis Open Library
            if book.open_library_id:
                try:
                    async with httpx.AsyncClient() as client_http:
                        res = await client_http.get(
                            f"https://openlibrary.org/works/{book.open_library_id}.json",
                            timeout=5.0
                        )
                        data = res.json()
                        desc = data.get("description", "")
                        if isinstance(desc, dict):
                            desc = desc.get("value", "")
                        if desc:
                            context += f"Description: {desc[:1000]}\n"
                            # Sauvegarde dans la base
                            book.description = desc[:2000]
                            db.commit()
                except:
                    pass

        if book.genres:
            context += f"Genres: {', '.join(book.genres)}\n"
        if book.publish_year:
            context += f"Published: {book.publish_year}\n"
        if book.average_rating > 0:
            context += f"Average rating: {book.average_rating:.1f}/5\n"

        return context
    except:
        return ""


async def chat_with_book(
    book_id: str,
    message: str,
    conversation_history: list,
    db: Session,
    spoiler_safe: bool = True
) -> str:
    """Envoie un message au chatbot avec le contexte du livre."""

    book_context = await get_book_context(book_id, db)

    spoiler_instruction = (
        "IMPORTANT: Do not reveal major plot twists, endings, or spoilers. "
        "If asked about spoilers, politely decline and suggest the user read the book."
        if spoiler_safe else
        "You can discuss all aspects of the book including plot details."
    )

    system_prompt = f"""You are Maktaba's AI book assistant — knowledgeable, friendly, and passionate about literature.

You have detailed knowledge about the following book:
{book_context}

{spoiler_instruction}

Your role:
- Answer questions about the book's themes, writing style, characters, and context
- Give thoughtful literary analysis
- Recommend similar books when relevant
- Keep responses concise and engaging (2-4 sentences unless more detail is needed)
- If you don't know something specific, say so honestly

Always respond in the same language the user writes in."""

    messages = [{"role": "system", "content": system_prompt}]

    # Ajoute l'historique de conversation (max 10 messages)
    for msg in conversation_history[-10:]:
        messages.append(msg)

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )

    return response.choices[0].message.content


async def general_book_chat(
    message: str,
    conversation_history: list
) -> str:
    """Chat général sur les livres sans contexte spécifique."""

    system_prompt = """You are Maktaba's AI assistant — an expert on books, literature, and reading.

Your role:
- Help users discover books they might enjoy
- Answer questions about authors, genres, literary movements
- Give reading recommendations based on preferences
- Discuss themes, writing styles, and literary analysis
- Keep responses engaging and concise

Always respond in the same language the user writes in."""

    messages = [{"role": "system", "content": system_prompt}]

    for msg in conversation_history[-10:]:
        messages.append(msg)

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )

    return response.choices[0].message.content