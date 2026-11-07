# Supreme Court Precedent Analyzer & Legal Argument Engine
## Comprehensive Frontend Architecture, UI/UX Design & Implementation Blueprint (`FRONTEND.md`)

---

## 1. Executive Overview

This document provides the complete, production-grade specification for building the frontend of the **Supreme Court Precedent Analyzer & Legal Argument Engine**. 

The frontend acts as an elite **"Senior Advocate Virtual Consultation Chamber"** designed for lawyers, legal researchers, and judges. It allows counsel to:
1. Consult interactively with the AI Senior Advocate across multi-turn sessions.
2. Ingest case documents (FIRs, Petitions, Orders) via drag-and-drop PDF parsing.
3. Inspect authentic, verified 5-year Supreme Court precedents (76,802 chunks) with verbatim quotes, bench quorums, and similarity scores.
4. Convert ongoing consultations into court-ready **Case Strategy Reports** with 1-click **PDF and HTML export**.

---

## 2. Technology Stack Recommendations

| Layer | Recommended Technology | Alternatives |
| :--- | :--- | :--- |
| **Framework** | **React 18 / 19 with Vite** (or **Next.js 14/15 App Router**) | SvelteKit / Vue 3 |
| **Language** | **TypeScript** (Strict mode) | JavaScript |
| **Styling** | **Tailwind CSS v3 / v4** | CSS Modules |
| **UI Components** | **shadcn/ui** (Radix UI primitives) | MUI / Ant Design |
| **Icons** | **Lucide React** (`lucide-react`) | Heroicons |
| **Markdown & Quotes** | **react-markdown** + **remark-gfm** | marked.js |
| **HTTP Client** | **Axios** (or native `fetch`) | TanStack Query |
| **State Management** | **Zustand** (lightweight, reactive) | React Context / Redux |
| **PDF Viewing** | Native Browser Iframe / `pdfjs-dist` | `react-pdf` |

---

## 3. Design System & Aesthetics (LegalTech Executive Theme)

### Color Palette

```css
/* Primary Judicial Theme */
--bg-primary: #0b132b;        /* Deep Midnight Navy (Chamber background) */
--bg-surface: #1c2541;        /* Muted Navy Surface for Cards/Panels */
--bg-card: #1e293b;           /* Slate 800 for Chat Bubbles & Drawers */
--bg-light-paper: #ffffff;    /* Clean White for Legal Brief / Document Previews */

/* Accent & High-Impact Colors */
--accent-gold: #d97706;       /* Judicial Gold / Amber (Citations, Badges) */
--accent-gold-light: #fef3c7; /* Light Gold background */
--accent-blue: #3b82f6;       /* Petitioner Blue */
--accent-rose: #f43f5e;       /* Respondent / Defense Rose */
--accent-emerald: #10b981;    /* Verbatim Quotes & Verified Precedent Match */

/* Text & Borders */
--text-primary: #f8fafc;      /* Crisp Off-White */
--text-secondary: #94a3b8;    /* Muted Slate Grey */
--text-paper: #0f172a;        /* Deep Charcoal for PDF/Report Previews */
--border-subtle: #334155;     /* Dark Slate Border */
--border-gold: #b45309;       /* Distinctive Citation Border */
```

### Typography
- **Headings & Court Documents:** Classic Serif typography (`Georgia`, `Merriweather`, or `Playfair Display`) for an authentic judicial feel.
- **Body & Chat UI:** Clean, legible Sans-Serif (`Inter`, `SF Pro`, or `system-ui`).
- **Legal Citations & Monospace:** `JetBrains Mono` or `Fira Code`.

---

## 4. UI Layout & Wireframe Architecture

The application layout follows a **3-Column Workspace Layout** optimized for legal workflows:

```text
+--------------------------------------------------------------------------------------------------------------------+
|  [Logo] Supreme Court Precedent Engine               [Stance: Petitioner v]   [Generate Report]  [Export PDF]     |
+------------------------------------+---------------------------------------------------------------+---------------+
|  CASE CONTEXT & INGESTION          |  CONVERSATIONAL STRATEGY CHAMBER                              | CITATION &    |
|  (Left Sidebar - 280px)            |  (Center Main Stage - Flexible)                               | PRECEDENT DOCK|
|                                    |                                                               | (Right - 320px|
|  [ + New Consultation ]            |  +---------------------------------------------------------+  |               |
|                                    |  | [Advocate Assistant]                                    |  | Grounded (4): |
|  ACTIVE CASE FILE:                 |  | Welcome Counsel. State your case facts or ask questions.|  |               |
|  [ FIR_420_Bail.pdf (14p) [X] ]    |  +---------------------------------------------------------+  | 1. Cox & Kings|
|                                    |                                                               |    (2022)     |
|  REPRESENTING SIDE:                |  +---------------------------------------------------------+  |    Match: 89% |
|  (*) Petitioner / Appellant        |  | [Counsel / User]                                        |  |    [Inspect >]|
|  ( ) Respondent / Defense          |  | Can Section 420 IPC be quashed if an arbitration clause |  |               |
|  ( ) Neutral Evaluation            |  | exists in the commercial contract?                      |  | 2. Senthil    |
|                                    |  +---------------------------------------------------------+  |    Balaji     |
|  FACTUAL MATRIX (Editable):        |                                                               |    (2023)     |
|  [ Commercial agreement dated... ] |  +---------------------------------------------------------+  |    Match: 90% |
|                                    |  | [Advocate Assistant]                                    |  |    [Inspect >]|
|  STATUTORY PROVISIONS:             |  | Senior Counsel, below is the bench-ready framework:     |  |               |
|  [Sec 438 CrPC] [Sec 420 IPC]      |  |                                                         |  | 3. Jamia      |
|  [Sec 8 Arbitration Act]           |  | [Citation: Cox And Kings Ltd (2022) | Match: 89.4%]     |  |    Masjid     |
|                                    |  | > "The amendment clarified the scope of judicial..."    |  |    (2021)     |
|  QUICK ACTIONS:                    |  |                                                         |  |    Match: 89% |
|  [ Convert to Strategy Report ]    |  | Ratio Decidendi & Legal Strategy:                       |  |               |
|  [ Direct PDF Export ]             |  | 1. Statutory limit on judicial interference...          |  | 4. Indian Oil |
|                                    |  | 2. Anticipated Objection: Criminal trial independence...|  |    (2022)     |
|                                    |  | 3. Strategic Rebuttal: Civil disputes cannot be cloaked |  |    Match: 91% |
|                                    |  +---------------------------------------------------------+  |               |
|                                    |                                                               |               |
|                                    |  [Type your query or court argument here...]      [Attach] [>]|               |
+------------------------------------+---------------------------------------------------------------+---------------+
```

---

## 5. Component Breakdown & Specifications

### 1. Global Navigation Bar (`Navbar.tsx`)
* **Components:**
  - `BrandLogo`: Supreme Court emblem with title: *"PrecedentRAG | Supreme Court of India"*.
  - `DatabaseBadge`: Green pulsing status dot showing `"76,802 SC Cases Indexed (Legal-BERT)"`.
  - `StanceDropdown`: Quick pill dropdown to switch `Petitioner / Appellant`, `Respondent / Defense`, or `Neutral Evaluation`.
  - `GenerateReportButton`: Primary action button opening the Report Modal.
  - `ExportPdfButton`: Immediate 1-click download of the court brief PDF.

### 2. Left Sidebar: Case Context & Ingestion (`CaseSidebar.tsx`)
* **Components:**
  - `NewCaseButton`: Clears state, resets conversation history, and opens fresh chamber.
  - `FileDropzone`:
    - Accepts `.pdf` and `.txt`.
    - Handles drag-and-drop or file selector.
    - Shows file size, page count, and removal button `[X]`.
  - `FactualMatrixEditor`:
    - Collapsible card containing active case facts.
    - Editable textarea with auto-sync to chat state.
  - `StatuteTags`:
    - Auto-extracted statutory tags (e.g., `Section 438 CrPC`, `Section 420 IPC`, `Article 21`).
  - `ConvertReportCard`:
    - Callout card prompting user: *"Ready for court? Convert this conversation into a Formal Supreme Court Strategy Report."*

### 3. Center: Interactive Case Chamber (`ChatWindow.tsx`)
* **Components:**
  - `MessageList`:
    - Auto-scrolls to bottom on new messages.
    - Supports Markdown rendering (bullet points, bold statutes, numbered arguments).
  - `CitationBadge` (Inside Chat Bubbles):
    - Distinctive Amber/Gold card embedded directly in the message text.
    - Displays: `[Citation: Case Title (Year) | Bench: Judges | Match: XX.X%]`.
    - Blockquote with verbatim quote in italicized serif.
    - Copy Citation button (`📋`).
  - `ChatInputArea`:
    - Multi-line textarea with auto-expand up to 6 lines.
    - Attachment clip icon allowing in-line PDF uploads.
    - Send button (`Enter` to submit, `Shift+Enter` for newline).
    - Quick Suggestion Pills:
      - *"What counter-arguments will prosecution raise?"*
      - *"Formulate pre-arrest bail plea on parity."*
      - *"Draft our primary oral argument for the Bench."*

### 4. Right Drawer: Precedents & Authorities Dock (`PrecedentDock.tsx`)
* **Components:**
  - `PrecedentListHeader`: Shows total unique authentic precedents retrieved in current session.
  - `PrecedentCard`:
    - **Header:** Match Score badge (e.g., `91.3% Match` with green indicator).
    - **Title:** Case Name (Year) in bold serif.
    - **Bench:** Listed judges / quorum.
    - **Excerpt:** 3-line preview of the relevant judgment paragraph.
    - **Actions:**
      - `[ Inspect Raw Chunk ]`: Opens full chunk modal.
      - `[ Cite in Next Query ]`: Appends case name to user input box.

### 5. Report Preview & Export Modal (`ReportModal.tsx`)
* **Triggered by:** "Convert to Report" button in Navbar or Left Sidebar.
* **Layout:** Full-screen modal with split view or tabbed navigation:
  - **Tab 1: Document View (Printable HTML)** — Formatted with classic judicial seal, margins, double borders, and serif typography.
  - **Tab 2: Markdown View** — Raw markdown for easy copying into Word / LaTeX.
  - **Tab 3: Table of Authorities** — Sortable table of all cited precedents.
* **Top Action Bar:**
  - `[ Download PDF ]` -> Calls `/api/v1/export-report-pdf`.
  - `[ Print ]` -> Triggers `window.print()` with clean `@media print` CSS.
  - `[ Copy Markdown ]` -> Copies to clipboard.

---

## 6. TypeScript Data Models (Matching Backend API)

Create `src/types/api.ts`:

```typescript
export type RepresentingSide = 
  | "Petitioner / Appellant" 
  | "Respondent / Defense" 
  | "Neutral Evaluation";

export interface SupportingPrecedent {
  case_name: str;
  year: string;
  bench?: string;
  file_name?: string;
  verbatim_quote: string;
  similarity_score: number;
  chunk_id?: string;
}

export interface PrecedentCitation extends SupportingPrecedent {
  citation_tag: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: PrecedentCitation[];
}

export interface ChatRequest {
  message: string;
  representing_side: RepresentingSide;
  case_context?: string;
  conversation_history?: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
  representing_side: RepresentingSide;
  generated_queries: string[];
  citations: PrecedentCitation[];
  retrieved_precedents: SupportingPrecedent[];
  processing_time_seconds: number;
}

export interface ExecutiveBrief {
  summary_of_facts: string;
  key_legal_issues: string[];
  applicable_statutes: string[];
}

export interface LegalArgument {
  argument_number: number;
  title: string;
  detailed_reasoning: string;
  supporting_precedents: SupportingPrecedent[];
  anticipated_counter_argument: string;
  rebuttal: string;
}

export interface ReportGenerationRequest {
  title?: string;
  representing_side: RepresentingSide;
  case_context?: string;
  conversation_history?: { role: string; content: string }[];
  executive_brief?: ExecutiveBrief;
  arguments?: LegalArgument[];
}

export interface LegalReportResponse {
  report_id: string;
  title: string;
  generated_at: string;
  representing_side: RepresentingSide;
  executive_brief: ExecutiveBrief;
  arguments: LegalArgument[];
  table_of_authorities: PrecedentCitation[];
  markdown_content: string;
  html_content: string;
  total_precedents_cited: number;
  processing_time_seconds: number;
}

export interface PrecedentSearchItem {
  chunk_id: string;
  case_title: string;
  year: string;
  file_name?: string;
  bench?: string;
  similarity_score: number;
  text_snippet: string;
  full_text: string;
}

export interface DirectSearchResponse {
  query: string;
  total_results: number;
  results: PrecedentSearchItem[];
}
```

---

## 7. Frontend API Service Layer (`src/services/api.ts`)

```typescript
import axios from "axios";
import {
  ChatRequest,
  ChatResponse,
  ReportGenerationRequest,
  LegalReportResponse,
  DirectSearchResponse
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout for LLM reasoning
});

export const LegalApiService = {
  // 1. Interactive Chat
  async sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>("/chat", payload);
    return response.data;
  },

  // 2. Generate Formal Strategy Report (JSON / HTML / Markdown)
  async generateReport(payload: ReportGenerationRequest): Promise<LegalReportResponse> {
    const response = await apiClient.post<LegalReportResponse>("/generate-report", payload);
    return response.data;
  },

  // 3. Download Court-Ready PDF Report
  async downloadReportPdf(payload: ReportGenerationRequest, filename = "Supreme_Court_Brief.pdf"): Promise<void> {
    const response = await apiClient.post("/export-report-pdf", payload, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 4. Analyze Case via File Upload (Multipart Form)
  async analyzeCaseFile(formData: FormData): Promise<any> {
    const response = await apiClient.post("/analyze-case", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 5. Standalone Precedent Search
  async searchPrecedents(query: string, topK = 5): Promise<DirectSearchResponse> {
    const params = new URLSearchParams();
    params.append("query", query);
    params.append("top_k", topK.toString());
    const response = await apiClient.post<DirectSearchResponse>("/search-precedents", params);
    return response.data;
  },

  // 6. Health Check
  async checkHealth(): Promise<any> {
    const response = await apiClient.get("/health");
    return response.data;
  }
};
```

---

## 8. State Management Store (`src/store/useLegalStore.ts`)

Using **Zustand** for clean reactive state across Sidebar, Chat, and Precedent Dock:

```typescript
import { create } from "zustand";
import { 
  RepresentingSide, 
  ChatMessage, 
  SupportingPrecedent, 
  LegalReportResponse 
} from "../types/api";

interface LegalState {
  // Case & Stance
  representingSide: RepresentingSide;
  caseContext: string;
  activeFileName: string | null;
  setRepresentingSide: (side: RepresentingSide) => void;
  setCaseContext: (text: string) => void;
  setActiveFileName: (name: string | null) => void;

  // Consultation Chat
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setIsLoading: (loading: boolean) => void;

  // Precedents Dock
  precedentsPool: Record<string, SupportingPrecedent>;
  addPrecedents: (precedents: SupportingPrecedent[]) => void;

  // Generated Report
  activeReport: LegalReportResponse | null;
  setActiveReport: (report: LegalReportResponse | null) => void;
  isReportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
}

export const useLegalStore = create<LegalState>((set) => ({
  representingSide: "Petitioner / Appellant",
  caseContext: "",
  activeFileName: null,
  setRepresentingSide: (side) => set({ representingSide: side }),
  setCaseContext: (text) => set({ caseContext: text }),
  setActiveFileName: (name) => set({ activeFileName: name }),

  messages: [
    {
      role: "assistant",
      content: "Welcome, Counsel. I am your Senior Supreme Court Advocate consultant. You may upload a petition/FIR (PDF/TXT) or state your client's factual matrix to begin strategizing."
    }
  ],
  isLoading: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearChat: () => set({ 
    messages: [], 
    caseContext: "", 
    activeFileName: null, 
    precedentsPool: {}, 
    activeReport: null 
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  precedentsPool: {},
  addPrecedents: (newPrecs) => set((state) => {
    const updated = { ...state.precedentsPool };
    newPrecs.forEach((p) => {
      const key = `${p.case_name}_${p.year}`;
      if (!updated[key] || p.similarity_score > updated[key].similarity_score) {
        updated[key] = p;
      }
    });
    return { precedentsPool: updated };
  }),

  activeReport: null,
  setActiveReport: (report) => set({ activeReport: report }),
  isReportModalOpen: false,
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
}));
```

---

## 9. Key User Interactions & UX Flows

### Flow 1: Interactive Case Consultation & Precedent Grounding
1. User types in chat: *"Can Section 420 IPC be quashed under Section 482 if there is an arbitration clause?"*
2. Frontend immediately displays the user message and triggers typing animation.
3. Calls `POST /api/v1/chat` with current `case_context`, `representing_side`, and recent history.
4. Response arrives (typically within 2.5–3.5s):
   - Renders Senior Advocate response.
   - Parses inline citation tags `[Citation: ...]` and renders rich interactive Gold/Navy **Citation Cards**.
   - Adds newly retrieved precedents to the **Right Precedent Dock**, sorted descending by match score.

### Flow 2: Case Document Ingestion (PDF / FIR Upload)
1. User drags an FIR or Special Leave Petition (PDF) into the left sidebar dropzone.
2. Frontend sends file to `POST /api/v1/analyze-case`.
3. Backend extracts the factual matrix, identifies legal issues, and retrieves relevant 5-year SC precedents.
4. Left sidebar populates with extracted summary, and the chat automatically presents the Executive Case Brief.

### Flow 3: 1-Click "Convert to Strategy Report" & PDF Download
1. Lawyer clicks the **"Convert to Report"** button in the Navbar.
2. Frontend calls `POST /api/v1/generate-report` with the entire consultation history and case facts.
3. `ReportModal` opens, displaying the formal brief (Executive Brief, Numbered Arguments with Ratio Decidendi, Anticipated Counter-Arguments, Rebuttals, and Table of Authorities).
4. Lawyer clicks **"Download PDF"**:
   - Calls `POST /api/v1/export-report-pdf`.
   - Browser immediately triggers download of `SCR-YYYYMMDD-XXXXXX.pdf` with court headers and official formatting.

---

## 10. Frontend Project Setup Instructions

To scaffold this frontend in 5 minutes:

```bash
# 1. Create Vite + React + TypeScript project
npm create vite@latest supreme-court-rag-ui -- --template react-ts
cd supreme-court-rag-ui

# 2. Install dependencies
npm install axios zustand lucide-react react-markdown remark-gfm clsx tailwind-merge

# 3. Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env

# 5. Start development server
npm run dev
```

---

*This document serves as the complete specification for the frontend development.*
