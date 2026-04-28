# Campaign Management AI Agent

An AI-powered tool that helps campaign managers transform ambiguous campaign briefs into structured execution plans, with automated QA validation before launch.

## 🎯 Features

1. **Brief Analysis** - Analyzes campaign briefs to identify gaps and ambiguities
2. **Interactive Clarification** - Generates specific, answerable questions to fill information gaps
3. **Plan Generation** - Creates detailed, structured execution plans with:
   - Channel specifications
   - Week-by-week timeline
   - Budget breakdown
   - Copy guidelines per audience
   - Success metrics
   - Verification checklist
4. **QA Validation** - Compares plans against briefs to catch misalignments before launch

## 🏗️ Architecture

```
campaign-management-ai/
├── backend/          # FastAPI backend with Azure OpenAI integration
│   ├── main.py       # FastAPI app with API routes
│   ├── models/       # Pydantic data schemas
│   ├── services/     # Business logic (analyzer, generator, validator)
│   └── prompts/      # AI prompt templates
└── frontend/         # React + TypeScript frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── services/    # API client
    │   ├── types/       # TypeScript definitions
    │   └── data/        # Sample briefs
    └── public/
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Azure OpenAI account with GPT-4 deployment

### Backend Setup

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Create virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```powershell
   cp .env.example .env
   ```
   
   Edit `.env` and add your Azure OpenAI credentials:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   ```

5. **Run backend server**
   ```powershell
   python main.py
   ```
   
   Backend runs at: `http://localhost:8000`
   API docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```powershell
   cd frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Run development server**
   ```powershell
   npm run dev
   ```
   
   Frontend runs at: `http://localhost:3000`

## 📋 API Endpoints

### `POST /api/analyze-brief`
Analyzes a campaign brief and returns clarifying questions.

**Request:**
```json
{
  "brief": {
    "campaign_name": "Q3 Enterprise Push",
    "business_objective": "Convert 200 trial accounts...",
    "target_audience": "VP of Operations at 1000+ employee companies",
    ...
  }
}
```

**Response:**
```json
{
  "questions": [...],
  "gaps_identified": [...],
  "ready_to_plan": false
}
```

### `POST /api/generate-plan`
Generates an execution plan from brief and answers.

**Request:**
```json
{
  "brief": {...},
  "answers": [
    {"question_id": "q1", "answer": "LinkedIn and Instagram"}
  ]
}
```

**Response:**
```json
{
  "campaign_name": "Q3 Enterprise Push",
  "executive_summary": "...",
  "channels": [...],
  "timeline": [...],
  "budget": {...},
  ...
}
```

### `POST /api/validate-plan`
Validates plan against brief to identify misalignments.

**Request:**
```json
{
  "brief": {...},
  "plan": {...}
}
```

**Response:**
```json
{
  "overall_alignment_score": 85,
  "summary": "...",
  "misalignments": [...],
  "ready_to_launch": true
}
```

## 🎬 Demo Flow

1. **Load Sample Brief** - Click "Load B2B SaaS Sample" to populate the brief form
2. **Submit Brief** - AI analyzes and generates clarifying questions
3. **Answer Questions** - Provide answers or skip to generate plan with assumptions
4. **Review Plan** - See detailed execution plan with channels, timeline, budget
5. **Run QA** - Validate plan against brief, see alignment score and issues
6. **Export** - Download plan as JSON for handoff

## 🛠️ Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- Azure OpenAI - GPT-4 for reasoning and generation
- Pydantic - Data validation and serialization
- Python-dotenv - Environment configuration

**Frontend:**
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool and dev server
- TailwindCSS - Styling
- Axios - HTTP client

## 📊 Sample Data

Two sample campaign briefs are included:

1. **B2B SaaS** - Enterprise trial-to-paid conversion campaign
2. **B2C Retail** - Summer re-purchase drive for Home & Garden

These demonstrate the tool's ability to handle different campaign types and complexities.

## ⚙️ Configuration

### Backend Environment Variables

- `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT_NAME` - GPT-4 deployment name (default: `gpt-4`)
- `AZURE_OPENAI_API_VERSION` - API version (default: `2024-02-15-preview`)
- `CORS_ORIGINS` - Allowed frontend origins (default: `http://localhost:3000`)

### Frontend Environment Variables (Optional)

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Testing
```powershell
cd backend
# Test health endpoint
curl http://localhost:8000/health

# Test with sample brief (using API docs)
# Navigate to http://localhost:8000/docs
# Try the /api/analyze-brief endpoint
```

### Frontend Testing
1. Open `http://localhost:3000`
2. Load a sample brief
3. Follow the workflow through to QA validation

## 🐛 Troubleshooting

**Backend won't start:**
- Check Azure OpenAI credentials in `.env`
- Ensure Python 3.10+ is installed
- Verify all dependencies are installed: `pip list`

**Frontend won't start:**
- Delete `node_modules` and `package-lock.json`, run `npm install` again
- Check that backend is running on port 8000
- Clear browser cache

**AI responses are slow:**
- Normal for GPT-4 (10-30 seconds for plan generation)
- Check Azure OpenAI quota and rate limits
- Review prompt complexity in `backend/prompts/`

**CORS errors:**
- Verify `CORS_ORIGINS` in backend `.env` includes `http://localhost:3000`
- Check that backend is actually running

## 📝 License

This project is for hackathon/educational purposes.

## 👥 Contributing

This is a hackathon project. For production use, consider:
- Adding authentication
- Database integration for persisting briefs/plans
- Multi-user collaboration features
- Advanced analytics and reporting
- Integration with marketing platforms (LinkedIn, Google Ads, etc.)

## 🎯 Future Enhancements

- [ ] Plan editing and regeneration of specific sections
- [ ] Multi-turn clarification (follow-up questions)
- [ ] Auto-fix for QA issues
- [ ] Export to PDF/DOCX
- [ ] Campaign templates library
- [ ] Historical brief/plan analysis
- [ ] Integration with project management tools (Asana, Monday)
- [ ] Real-time collaboration for team review

---
