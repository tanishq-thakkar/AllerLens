from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional
import uuid

app = FastAPI(title="AllerLens API", version="0.1.0")

# CORS so Next.js on :3000 can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- health ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- upload ----------
@app.post("/menus/upload")
async def upload_menu(file: UploadFile = File(...)):
    """
    MVP: accept an image or PDF; return a fake menu_id.
    (Optionally persist to /tmp for now.)
    """
    menu_id = str(uuid.uuid4())
    contents = await file.read()
    with open(f"/tmp/{menu_id}_{file.filename}", "wb") as f:
        f.write(contents)
    return {"menu_id": menu_id, "filename": file.filename}

# ---------- QA (mock) ----------
class Profile(BaseModel):
    allergens: List[str] = []
    diets: List[str] = []
    sodium_limit: Optional[int] = None

class Citation(BaseModel):
    page: int
    bbox: List[float]
    type: str
    text: str

class QARequest(BaseModel):
    menu_id: str
    question: str
    profile: Profile

class QAResponse(BaseModel):
    result: Literal["safe", "unsafe", "ask_server"]
    reasons: List[str]
    alternatives: List[str]
    citations: List[Citation]
    summary: str

@app.post("/qa", response_model=QAResponse)
def qa(req: QARequest):
    # Mock answer
    return QAResponse(
        result="unsafe",
        reasons=["Contains peanut oil"],
        alternatives=["Stir-fried tofu", "Vegetable curry"],
        citations=[Citation(page=1, bbox=[100, 200, 180, 220], type="ingredient", text="peanut oil")],
        summary="This dish is unsafe for someone with a peanut allergy.",
    )
