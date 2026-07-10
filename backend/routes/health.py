from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import LLM_PROVIDER
from database import get_db
from services.llm_service import check_ollama_health

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_connected = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_connected = False

    llm_provider_status = check_ollama_health()

    return {
        "status": "ok" if db_connected else "error",
        "database_connected": db_connected,
        "llm_provider": LLM_PROVIDER,
        "llm_provider_status": llm_provider_status,
    }
