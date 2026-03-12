import os
import json
from typing import Optional
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from core.security import get_current_user
from models import UserProfile

router = APIRouter()

# Ensure environment variables are loaded even if server was started from a different CWD.
ENV_PATH = Path(__file__).resolve().parent.parent / "app" / ".env"
load_dotenv(ENV_PATH, override=False)


def _list_models(api_key: str) -> list[dict]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    req = urlrequest.Request(url, method="GET")
    with urlrequest.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
        data = json.loads(raw)
    return data.get("models") or []


def _pick_fallback_model(models: list[dict]) -> str | None:
    # Pick first Gemini model that supports generateContent
    for m in models:
        name = str(m.get("name") or "")
        methods = m.get("supportedGenerationMethods") or []
        if not name.startswith("models/"):
            continue
        if "generateContent" not in methods:
            continue
        if "gemini" not in name.lower():
            continue
        return name.replace("models/", "", 1)
    return None


class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = None


class TranslateResponse(BaseModel):
    translated_text: str


@router.post("/translate", response_model=TranslateResponse)
def translate_text(
    payload: TranslateRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Translation service is not configured (missing GEMINI_API_KEY). "
                f"Expected .env at {ENV_PATH} (exists={ENV_PATH.exists()})."
            ),
        )

    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    target = (payload.target_language or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="target_language is required")

    source = (payload.source_language or "").strip()

    model = os.getenv("GEMINI_TRANSLATE_MODEL", "gemini-1.5-pro")

    if source:
        prompt = (
            f"Translate the following text from {source} to {target}. "
            "Return only the translated text.\n\n"
            f"TEXT:\n{text}"
        )
    else:
        prompt = (
            f"Translate the following text to {target}. "
            "Return only the translated text.\n\n"
            f"TEXT:\n{text}"
        )

    def make_url(model_name: str) -> str:
        return f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        },
    }

    try:
        req = urlrequest.Request(
            make_url(model),
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlrequest.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)

        candidates = data.get("candidates") or []
        content = candidates[0].get("content") if candidates else None
        parts = (content or {}).get("parts") or []
        translated = parts[0].get("text") if parts else None

        if not translated or not str(translated).strip():
            raise HTTPException(status_code=502, detail="Translation failed")

        return TranslateResponse(translated_text=str(translated).strip())
    except HTTPException:
        raise
    except HTTPError as e:
        try:
            raw = e.read().decode("utf-8")
        except Exception:
            raw = ""

        # If model is not found / not supported, try to auto-select a supported model.
        if e.code == 404:
            try:
                models = _list_models(api_key)
                fallback = _pick_fallback_model(models)
                if fallback and fallback != model:
                    retry_req = urlrequest.Request(
                        make_url(fallback),
                        data=json.dumps(body).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                        method="POST",
                    )
                    with urlrequest.urlopen(retry_req, timeout=30) as resp:
                        retry_raw = resp.read().decode("utf-8")
                        retry_data = json.loads(retry_raw)

                    candidates = retry_data.get("candidates") or []
                    content = candidates[0].get("content") if candidates else None
                    parts = (content or {}).get("parts") or []
                    translated = parts[0].get("text") if parts else None

                    if translated and str(translated).strip():
                        return TranslateResponse(translated_text=str(translated).strip())
            except HTTPException:
                raise
            except Exception:
                pass

        raw_lower = raw.lower() if raw else ""

        # Friendly messages for the frontend (avoid leaking long provider JSON to users)
        if e.code == 404:
            raise HTTPException(
                status_code=502,
                detail="Translation API is available, but the model is not supported for this key. Update the model/key.",
            )

        if e.code in (401, 403):
            raise HTTPException(
                status_code=502,
                detail="Translation API key is invalid or has no permission. Update GEMINI_API_KEY.",
            )

        if e.code == 429 or "quota" in raw_lower or "rate" in raw_lower or "resource_exhausted" in raw_lower:
            raise HTTPException(
                status_code=502,
                detail="Translation limit reached (quota exceeded). Try later or use a new/billing-enabled key.",
            )

        raise HTTPException(status_code=502, detail="Translation failed (provider error). Please try again.")
    except URLError:
        raise HTTPException(
            status_code=502,
            detail="Translation service is temporarily unavailable (network/server). Please try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Translation failed: {str(e)}")
