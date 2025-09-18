# AllerLens
Multimodal Allergy & Diet Safety Assistant for Dining Out

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- pnpm

### Development Setup

#### 1. Backend (FastAPI)
```bash
# Navigate to API directory
cd apps/api

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the API server
python -m uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Next.js)
```bash
# Navigate to web directory
cd apps/web

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Environment Configuration

#### Backend (.env file in `apps/api/`)
```env
OPENAI_API_KEY=your_openai_api_key_here
AI_MODE=mock  # or "real" for actual OpenAI API calls
```

#### Frontend (.env.local file in `apps/web/`)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## 🎯 Features

- **Menu Upload**: Support for JPG, PNG, and PDF files
- **AI-Powered Parsing**: Extract structured menu data using OpenAI Vision
- **Allergy Detection**: Identify common allergens and dietary restrictions
- **Safety Analysis**: Get personalized safety recommendations
- **Mock Mode**: Development mode with realistic mock responses

## 🛠️ Development

### AI_MODE Options
- **`mock`**: Use mock responses (no API costs, great for development)
- **`real`**: Use actual OpenAI API calls (requires valid API key)

### Project Structure
```
AllerLens/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── packages/         # Shared packages
└── README.md
```
