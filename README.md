# AI Workflow Engine 🤖

An intelligent workflow automation platform that converts natural language instructions into executable workflows using AI. Built with Next.js, TypeScript, and powered by Google Gemini AI.

## 🚀 Features

- **Natural Language Processing**: Describe workflows in plain English - AI generates the execution plan
- **Dynamic Workflow Generation**: Google Gemini 2.5 Flash converts instructions to structured workflow JSON
- **Real-time Execution Monitoring**: Live updates as workflow steps execute using Supabase Realtime
- **Step-by-Step Execution**: Visual tracking of each workflow step with output payload display
- **Final Result Aggregation**: Collects and displays important outputs from all workflow steps
- **Rate Limiting**: Built-in protection (10 executions per minute)
- **Usage Tracking**: Monitor AI token consumption and model usage
- **Type-Safe**: Full TypeScript implementation with Zod schema validation

## 🏗️ Architecture

```
┌─────────────────┐
│   User Input    │ (Natural Language)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini 2.5     │ (Workflow Generation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ (Workflow Storage)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Step Executor  │ (Sequential Processing)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Real-time UI   │ (Live Progress Updates)
└─────────────────┘
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI Model**: Google Gemini 2.5 Flash
- **Validation**: Zod 4.3.6
- **HTTP Client**: Axios 1.13.6

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm
- Supabase account
- Google Gemini API key

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Workflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_KEY=your_gemini_api_key
```

4. **Set up database**

Run the following SQL in your Supabase SQL Editor:

```sql
-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  definition_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow runs table
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Workflow step runs table
CREATE TABLE workflow_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES workflow_runs(id),
  step_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  output_payload JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime for step runs
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_step_runs;
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Workflow/
├── app/
│   ├── api/
│   │   ├── create-workflow/
│   │   │   └── route.ts         # Workflow generation endpoint
│   │   └── execute-workflow/
│   │       └── route.ts         # Workflow execution endpoint
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main UI component
├── lib/
│   ├── schema.ts                # Zod validation schemas
│   └── supabase.ts              # Supabase client
├── public/                      # Static assets
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🔌 API Endpoints

### POST `/api/create-workflow`

Creates a new workflow from natural language instructions.

**Request Body:**
```json
{
  "instruction": "Score resume against job description",
  "userId": "user-uuid"
}
```

**Response:**
```json
[{
  "id": "workflow-uuid",
  "name": "Generated Workflow",
  "definition_json": {
    "trigger": "manual",
    "steps": [
      {
        "id": "step-1",
        "type": "score_against_jd"
      }
    ]
  }
}]
```

### POST `/api/execute-workflow`

Executes a workflow by ID.

**Request Body:**
```json
{
  "workflowId": "workflow-uuid"
}
```

**Response:**
```json
{
  "message": "Workflow executed",
  "result": {
    "score": 55,
    "feedback": "Improve backend depth.",
    "email_sent": true
  }
}
```

## 🎯 Supported Workflow Steps

The engine supports the following step types (flexible matching):

| Category | Step Types | Output |
|----------|-----------|---------|
| **Data Extraction** | `extract`, `data_extraction`, `extract_skills` | `{ skills: ["React", "Node"] }` |
| **Scoring** | `score`, `scoring`, `score_against_jd` | `{ score: 55 }` |
| **Content Generation** | `feedback`, `content_generation`, `generate_feedback` | `{ tips: "..." }` |
| **Notifications** | `email`, `notify`, `notification`, `send_email` | `{ email_sent: true }` |

## 💡 How It Works

### 1. Workflow Creation
```
User Input → Gemini AI → Structured JSON → Supabase Storage
```

The system sends a prompt to Gemini AI with the workflow schema and user instruction. The AI returns a structured JSON workflow that's validated with Zod and stored in Supabase.

### 2. Workflow Execution
```
Fetch Workflow → Execute Steps Sequentially → Track Progress → Return Results
```

Each step:
1. Marks as "running" in database (triggers realtime update)
2. Executes the step logic
3. Captures output and latency
4. Updates status to "completed"
5. Aggregates important results to final output

### 3. Real-time Updates

The UI subscribes to Supabase Realtime changes on `workflow_step_runs` table, showing live progress as steps execute.

## 🎨 UI Components

### Left Panel
- **Workflow Creation**: Text area for natural language input
- **Action Buttons**: Create and Execute workflow controls
- **Workflow ID Display**: Shows generated workflow identifier
- **Final Result Panel**: Displays aggregated outputs (score, feedback, email status)

### Right Panel
- **Execution Output**: Real-time step-by-step execution log
- **Status Indicators**: Color-coded status (completed: green, running: yellow, failed: red)
- **Output Payloads**: JSON preview of each step's output

## 🔒 Security Features

- **Rate Limiting**: Maximum 10 workflow executions per minute
- **Input Validation**: Zod schema validation on all inputs
- **Error Handling**: Comprehensive try-catch blocks with error messages
- **Environment Variables**: Sensitive keys stored in environment

## 🚧 Future Enhancements

- [ ] Conditional step execution based on previous outputs
- [ ] Custom step type plugins
- [ ] Workflow templates library
- [ ] Async/parallel step execution
- [ ] Workflow scheduling (cron jobs)
- [ ] User authentication and authorization
- [ ] Workflow versioning
- [ ] Advanced analytics dashboard
- [ ] Export/import workflows
- [ ] Webhook triggers

## 📝 Example Usage

```typescript
// 1. Create a workflow
const instruction = "Score a resume against a job description and send email if score > 70";

// 2. AI generates workflow with steps:
// - Step 1: Extract skills from resume
// - Step 2: Score against job description
// - Step 3: Generate feedback
// - Step 4: Send conditional email

// 3. Execute workflow and see real-time progress
// 4. View final aggregated results
```

## 🐛 Troubleshooting

**Issue**: Workflow creation fails
- Check Gemini API key is valid
- Verify API quota hasn't been exceeded
- Check network connectivity

**Issue**: Real-time updates not working
- Verify Supabase Realtime is enabled for `workflow_step_runs` table
- Check browser console for WebSocket errors
- Ensure Supabase anon key has proper permissions

**Issue**: Execution fails
- Check workflow exists in database
- Verify rate limit hasn't been exceeded
- Review server logs for detailed error messages

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. Contributions are not currently accepted.

## 📧 Contact

For questions or support, please contact the project maintainer.

---

Built with ❤️ using Next.js and AI
