# Novelist AI - Multi-Project Novel Writing Platform

AI-powered long-form novel writing application with **multi-project support**, Story Bible canon enforcement, and professional writing workflows.

## 🎯 What's New - Multi-Project System

Novelist AI has been **completely upgraded** from a single-project tool to a full-featured novel writing platform:

✅ **Multi-Project Management** - Create and manage unlimited novel projects  
✅ **Professional Dashboard** - Visual project cards with progress tracking  
✅ **4-Step Book Creation** - Setup → Concept → Story Bible → Outline  
✅ **Advanced 3-Panel Editor** - Chapter list, content view, Story Bible reference  
✅ **Export System** - Markdown, DOCX, PDF (coming soon), EPUB (coming soon)  
✅ **Project Lifecycle** - Draft → In Progress → Completed → Published  
✅ **Quality Enforcement** - Prose validation with auto-regeneration  

## ✨ Core Features

### 📚 Multi-Project Management
- Create unlimited novel projects
- Each project has its own Story Bible, Outline, and Chapters
- Project states: Draft, In Progress, Completed, Published
- Dashboard with statistics and filtering

### 🎨 Professional Writing Workflow

**New Book Creation (4 Steps):**
1. **Setup** - Title, genre, POV, tone, target word count
2. **Concept** - Input whitepaper or story concept
3. **Story Bible** - Auto-generate and approve canonical rules
4. **Outline** - Generate 30-50 chapter structure

### ✍️ Advanced Editor

**3-Panel Layout:**
- **Left Panel** - Chapter list with generation controls
- **Center Panel** - Full chapter content with prose quality scores
- **Right Panel** - Story Bible reference and chapter metadata

**Features:**
- One-click chapter generation
- Regenerate any chapter
- Real-time prose quality scoring (0-100)
- Canon compliance checking
- Character state tracking

### 📤 Export System
- **Markdown** (.md) - ✅ Available
- **DOCX** (.docx) - ✅ Available  
- **PDF** - 🚧 Coming soon
- **EPUB** - 🚧 Coming soon

### 🎯 Quality Enforcement
- **Canon Sanitation** - Zero tolerance for Story Bible leakage
- **Prose Validation** - Scene-based writing, proper paragraph rhythm
- **Auto-Regeneration** - Up to 3 attempts for quality
- **Quality Scoring** - Detailed feedback with issues and warnings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- An AI API key (Gemini or OpenAI)

### Installation

1. **Clone/Download** the project

2. **Install dependencies**:
```bash
npm install
```

3. **Configure AI Provider**:
   - Copy `.env.local.example` to `.env.local`
   - Add your API key:

```env
# For Gemini (recommended)
AI_PROVIDER=GEMINI
GEMINI_API_KEY=your_gemini_api_key_here

# OR for OpenAI
AI_PROVIDER=OPENAI
OPENAI_API_KEY=your_openai_api_key_here
```

**Get API Keys**:
- Gemini: https://makersuite.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys

4. **Run the development server**:
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 📖 Usage Workflow

### Step 1: Create Story Bible
1. Paste your whitepaper/lore document
2. Add optional metadata (genre, tone, POV, target length)
3. Click "Generate Story Bible"
4. Review the structured canon
5. **Lock the Story Bible** (required before proceeding)

### Step 2: Generate Outline
1. Choose act structure (3-Act or 5-Act)
2. Set target chapter count (default: 40)
3. Generate outline
4. Review chapter summaries and Bible citations

### Step 3: Write Novel
1. Click "Generate Chapter 1"
2. Review chapter content and canon warnings
3. Regenerate if needed
4. Continue generating chapters sequentially
5. Track character states and world changes

## 🧠 How Canon Enforcement Works

### Before Generation
- Story Bible injected into system prompt as **NON-NEGOTIABLE**
- Hard constraints marked as ABSOLUTE
- Previous chapter summaries included for consistency

### During Generation
- AI instructed: "If creativity conflicts with canon, CANON WINS"
- World rules and constraints enforced
- Character states maintained

### After Generation
- Canon compliance check runs automatically
- Violations flagged with warning badges
- User can regenerate if needed

## 🏗️ Architecture

### Data Models
- **StoryBible**: Immutable canon (locked after approval)
- **Outline**: Chapter structure with Bible citations
- **Chapter**: Content + summary + state delta + canon warnings

### Storage
- LocalStorage for MVP (browser-based)
- Easily upgradeable to database (PostgreSQL, MongoDB, etc.)

### AI Integration
- Supports Gemini Pro and GPT-4
- Structured JSON outputs
- Temperature: 0.7 for creative consistency

## 📁 Project Structure

```
novelwritex/
├── app/
│   ├── api/
│   │   ├── generate-bible/route.ts
│   │   ├── generate-outline/route.ts
│   │   └── generate-chapter/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── WhitepaperInput.tsx
│   ├── StoryBibleViewer.tsx
│   ├── OutlineGenerator.tsx
│   └── ChapterWriter.tsx
├── lib/
│   ├── types.ts                 # TypeScript types
│   ├── storage.ts               # LocalStorage wrapper
│   ├── ai-service.ts            # AI generation logic
│   └── utils.ts
└── package.json
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **AI**: Google Gemini / OpenAI GPT-4

## ⚙️ Configuration

### AI Provider
Set in `.env.local`:
- `AI_PROVIDER=GEMINI` or `AI_PROVIDER=OPENAI`

### Model Selection
Edit `lib/ai-service.ts`:
- Gemini: `gemini-pro`
- OpenAI: `gpt-4-turbo-preview`

## 🔒 Hard Rules

1. **Never write without a Story Bible**
2. **Never modify Story Bible after lock**
3. **Never write more than one chapter per call**
4. **Never invent rules outside the whitepaper**
5. **Story Bible overrides creativity**

## 🚧 Future Enhancements

- [ ] Database integration (PostgreSQL/Supabase)
- [ ] Export to EPUB/PDF
- [ ] Multi-user collaboration
- [ ] Version control for chapters
- [ ] Advanced canon violation detection
- [ ] Character relationship graphs
- [ ] Timeline visualization

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a reference implementation of canon-enforced AI writing.

---

**Built with canon enforcement in mind. Story Bible is law.**
