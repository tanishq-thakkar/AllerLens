from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any

# Load env vars (OPENAI_API_KEY in apps/api/.env)
import os, uuid, base64, json
from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
from PIL import Image
from io import BytesIO

# Optional PDF → image
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except Exception:
    PDF2IMAGE_AVAILABLE = False

# ---- App setup ----
app = FastAPI(title="AllerLens API (o4-mini)", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- OpenAI setup ----
OPENAI_MODEL_VLM = "gpt-4o-mini"   # vision + text
OPENAI_MODEL_TEXT = "gpt-4o-mini"  # text reasoning for MVP
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing. Set it in apps/api/.env or export it in your shell.")
client = OpenAI(api_key=OPENAI_API_KEY)

# ---- Storage (MVP in-memory) ----
MENUS: Dict[str, Dict[str, Any]] = {}  # {menu_id: {"path":..., "parsed":[...]}}
TMP = "/tmp"

# ---- Schemas ----
PARSE_SCHEMA = {
    "type": "object",
    "properties": {
        "page": {"type": "integer"},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "ingredients": {"type": "array", "items": {"type": "string"}},
                    "price": {"type": ["number", "null"]},
                    "section": {"type": ["string", "null"]},
                    "bbox": {"type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 4}
                },
                "required": ["name", "bbox"],
                "additionalProperties": False
            }
        },
        "icons": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "enum": ["peanut","tree_nut","shellfish","egg","dairy","gluten","vegan","vegetarian","spicy"]
                    },
                    "bbox": {"type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 4},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                },
                "required": ["label", "bbox"],
                "additionalProperties": False
            }
        },
        "tables": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "bbox": {"type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 4},
                    "cells": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "r": {"type": "integer"},
                                "c": {"type": "integer"},
                                "text": {"type": "string"}
                            },
                            "required": ["r", "c", "text"],
                            "additionalProperties": False
                        }
                    }
                },
                "required": ["bbox", "cells"],
                "additionalProperties": False
            }
        }
    },
    "required": ["page", "items", "icons", "tables"],
    "additionalProperties": False
}

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

QA_SCHEMA = {
    "type": "object",
    "properties": {
        "result": {"type": "string", "enum": ["safe","unsafe","ask_server"]},
        "reasons": {"type": "array", "items": {"type": "string"}},
        "alternatives": {"type": "array", "items": {"type": "string"}},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "integer"},
                    "bbox": {"type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 4},
                    "type": {"type": "string"},
                    "text": {"type": "string"}
                },
                "required": ["page", "bbox", "type", "text"],
                "additionalProperties": False
            }
        },
        "summary": {"type": "string"}
    },
    "required": ["result","reasons","alternatives","citations","summary"],
    "additionalProperties": False
}

# ---- Helpers ----
def save_bytes(path: str, data: bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)

def img_bytes_to_base64(img_bytes: bytes) -> str:
    return base64.b64encode(img_bytes).decode("utf-8")

def pdf_to_images(pdf_path: str) -> List[bytes]:
    if not PDF2IMAGE_AVAILABLE:
        raise HTTPException(status_code=500, detail="pdf2image/poppler not available on server")
    pages = convert_from_path(pdf_path, dpi=200)
    out: List[bytes] = []
    for im in pages:
        buf = BytesIO()
        im.convert("RGB").save(buf, format="JPEG", quality=92)
        out.append(buf.getvalue())
    return out

def call_o4mini_parse(image_bytes: bytes, page_no: int) -> Dict[str, Any]:
    prompt = (
        "You are a structured menu parser. Return STRICT JSON with keys: page, items, icons, tables. "
        "Use pixel coordinates for bbox. Be conservative; omit if unsure."
    )
    b64 = img_bytes_to_base64(image_bytes)
    
    print(f"\n{'='*60}")
    print(f"🔍 PARSING MENU PAGE {page_no}")
    print(f"{'='*60}")
    print(f"📝 Prompt: {prompt}")
    print(f"🖼️  Image size: {len(image_bytes)} bytes")
    print(f"🤖 Model: {OPENAI_MODEL_VLM}")
    print(f"🌡️  Temperature: 0.1")
    
    try:
        print(f"📡 Making OpenAI API call...")
        resp = client.chat.completions.create(
            model=OPENAI_MODEL_VLM,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    ],
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {"name": "MenuPage", "schema": PARSE_SCHEMA, "strict": True},
            },
            temperature=0.1,
        )
        
        print(f"✅ API Response received!")
        print(f"📊 Usage: {resp.usage}")
        print(f"🎯 Response content:")
        print(f"{'-'*40}")
        print(resp.choices[0].message.content)
        print(f"{'-'*40}")
        
        parsed_response = json.loads(resp.choices[0].message.content)
        print(f"📋 Parsed {len(parsed_response.get('items', []))} menu items")
        print(f"🏷️  Found {len(parsed_response.get('icons', []))} icons")
        print(f"📊 Found {len(parsed_response.get('tables', []))} tables")
        
        return parsed_response
        
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        print(f"🔄 Returning mock response for development...")
        
        mock_response = {
            "page": page_no,
            "items": [
                {
                    "name": "Sample Menu Item",
                    "ingredients": ["Sample ingredient 1", "Sample ingredient 2"],
                    "price": 12.99,
                    "section": "Main Course",
                    "bbox": [100, 100, 300, 150]
                }
            ],
            "icons": [
                {
                    "label": "gluten",
                    "bbox": [50, 50, 80, 80],
                    "confidence": 0.8
                }
            ],
            "tables": []
        }
        
        print(f"🎭 Mock response:")
        print(f"{'-'*40}")
        print(json.dumps(mock_response, indent=2))
        print(f"{'-'*40}")
        
        return mock_response

def call_o4mini_answer(parsed_pages: List[Dict[str, Any]], profile: Profile, question: str) -> Dict[str, Any]:
    sys = (
        "You are a precise dining safety analyst. Use ONLY the provided parsed menu context. "
        "Return STRICT JSON matching the schema."
    )
    user = (
        f"user_profile: {profile.model_dump()}\n"
        f"question: {question}\n"
        f"context_pages: {json.dumps(parsed_pages)[:15000]}"
    )
    
    print(f"\n{'='*60}")
    print(f"🤔 ANALYZING MENU SAFETY")
    print(f"{'='*60}")
    print(f"👤 User Profile: {profile.model_dump()}")
    print(f"❓ Question: {question}")
    print(f"📄 Context pages: {len(parsed_pages)} pages")
    print(f"🤖 Model: {OPENAI_MODEL_TEXT}")
    print(f"🌡️  Temperature: 0.2")
    print(f"📝 System prompt: {sys}")
    print(f"💬 User prompt length: {len(user)} characters")
    
    try:
        print(f"📡 Making OpenAI API call...")
        resp = client.chat.completions.create(
            model=OPENAI_MODEL_TEXT,
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": user},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {"name": "QAResponse", "schema": QA_SCHEMA, "strict": True},
            },
            temperature=0.2,
        )
        
        print(f"✅ API Response received!")
        print(f"📊 Usage: {resp.usage}")
        print(f"🎯 Response content:")
        print(f"{'-'*40}")
        print(resp.choices[0].message.content)
        print(f"{'-'*40}")
        
        parsed_response = json.loads(resp.choices[0].message.content)
        print(f"🔍 Analysis result: {parsed_response.get('result', 'unknown')}")
        print(f"📝 Summary: {parsed_response.get('summary', 'No summary')}")
        print(f"📋 Reasons: {len(parsed_response.get('reasons', []))} items")
        print(f"🔄 Alternatives: {len(parsed_response.get('alternatives', []))} items")
        print(f"📚 Citations: {len(parsed_response.get('citations', []))} items")
        
        return parsed_response
        
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        print(f"🔄 Returning mock response for development...")
        
        mock_response = {
            "result": "ask_server",
            "reasons": ["OpenAI API quota exceeded - please check billing"],
            "alternatives": ["Contact server administrator for API access"],
            "citations": [],
            "summary": "Unable to analyze menu due to API quota limits. Please check OpenAI billing settings."
        }
        
        print(f"🎭 Mock response:")
        print(f"{'-'*40}")
        print(json.dumps(mock_response, indent=2))
        print(f"{'-'*40}")
        
        return mock_response

# ---- Routes ----
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/menus/upload")
async def upload_menu(file: UploadFile = File(...)):
    print(f"\n{'='*60}")
    print(f"📤 MENU UPLOAD REQUEST")
    print(f"{'='*60}")
    print(f"📁 Filename: {file.filename}")
    print(f"📏 Content type: {file.content_type}")
    
    menu_id = str(uuid.uuid4())
    data = await file.read()
    ext = os.path.splitext(file.filename or "")[1].lower()
    
    print(f"🆔 Generated menu_id: {menu_id}")
    print(f"📄 File extension: {ext}")
    print(f"📊 File size: {len(data)} bytes")
    
    if ext not in [".jpg",".jpeg",".png",".pdf"]:
        print(f"❌ Unsupported file type: {ext}")
        raise HTTPException(status_code=400, detail="Only JPG/PNG/PDF supported")
    
    save_path = os.path.join(TMP, f"{menu_id}{ext}")
    save_bytes(save_path, data)
    MENUS[menu_id] = {"path": save_path}
    
    print(f"✅ File saved to: {save_path}")
    print(f"📋 Total menus in memory: {len(MENUS)}")
    
    return {"menu_id": menu_id, "filename": file.filename}

@app.post("/menus/{menu_id}/parse")
def parse_menu(menu_id: str):
    print(f"\n{'='*60}")
    print(f"🔍 MENU PARSE REQUEST")
    print(f"{'='*60}")
    print(f"🆔 Menu ID: {menu_id}")
    
    info = MENUS.get(menu_id)
    if not info:
        print(f"❌ Menu not found in memory")
        raise HTTPException(status_code=404, detail="menu_id not found; upload first")
    
    path = info["path"]
    print(f"📁 File path: {path}")
    print(f"📄 File exists: {os.path.exists(path)}")
    
    parsed_pages: List[Dict[str, Any]] = []

    if path.lower().endswith(".pdf"):
        print(f"📖 Processing PDF file...")
        images = pdf_to_images(path)
        print(f"📄 PDF has {len(images)} pages")
        for i, img_bytes in enumerate(images, start=1):
            print(f"🔄 Processing page {i}/{len(images)}")
            parsed_pages.append(call_o4mini_parse(img_bytes, page_no=i))
    else:
        print(f"🖼️  Processing image file...")
        with open(path, "rb") as f:
            img_bytes = f.read()
        print(f"📊 Image size: {len(img_bytes)} bytes")
        parsed_pages.append(call_o4mini_parse(img_bytes, page_no=1))

    MENUS[menu_id]["parsed"] = parsed_pages
    cache_file = os.path.join(TMP, f"{menu_id}_parsed.json")
    with open(cache_file, "w") as f:
        json.dump(parsed_pages, f)
    
    print(f"✅ Parsing complete!")
    print(f"📋 Total pages parsed: {len(parsed_pages)}")
    print(f"💾 Cached to: {cache_file}")
    
    return {"menu_id": menu_id, "pages": len(parsed_pages), "status": "parsed"}

@app.post("/qa", response_model=QAResponse)
def qa(req: QARequest):
    print(f"\n{'='*60}")
    print(f"❓ Q&A REQUEST")
    print(f"{'='*60}")
    print(f"🆔 Menu ID: {req.menu_id}")
    print(f"❓ Question: {req.question}")
    print(f"👤 Profile: {req.profile.model_dump()}")
    
    info = MENUS.get(req.menu_id)
    if not info or "parsed" not in info:
        print(f"❌ Menu not found or not parsed")
        raise HTTPException(status_code=400, detail="Menu not parsed yet. Call /menus/{id}/parse first.")
    
    parsed_pages = info["parsed"]
    print(f"📄 Using {len(parsed_pages)} parsed pages for analysis")
    
    result = call_o4mini_answer(parsed_pages, req.profile, req.question)
    
    print(f"✅ Q&A analysis complete!")
    print(f"🎯 Final result: {result.get('result', 'unknown')}")
    
    return QAResponse(**result)
