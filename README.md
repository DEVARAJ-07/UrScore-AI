<div align="center">
  <img src="frontend/public/logo.png" alt="UrScore AI Logo" width="120" />
  <h1>UrScore AI</h1>
  <p><strong>Stateless Parallel Analysis Scanner & Verification Engine</strong></p>
  <p>Cross-reference public codebase commits with PDF resumes to prevent skill spoofing and verify true technical competency.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Express.js-Backend-blue?style=for-the-badge&logo=express" alt="Express" />
    <img src="https://img.shields.io/badge/TailwindCSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/AI-Powered-FF6F00?style=for-the-badge&logo=google-gemini" alt="AI Powered" />
  </p>
</div>

---

## 🎯 Overview

**UrScore AI** is a state-of-the-art developer evaluation platform designed to combat "skill spoofing" in tech hiring. Rather than simply scanning a resume for keywords, UrScore AI autonomously scrapes, parses, and cross-references a candidate's uploaded resume against their actual, verifiable **GitHub codebase** and **LeetCode statistics**. 

The engine produces a mathematically rigorous **Competency Score** and evaluates candidate true proficiency using AI architecture analysis, delivering results via a stunning 3D Web Dashboard and a generated, shareable PDF Report.

## ✨ Key Features

- **Resume ATS Parser**: Extracts languages, frameworks, and tools directly from PDF resumes using natural language processing.
- **Deep GitHub Auditing**: Scrapes public repositories, analyzes up to 400 recent commits per repo, and detects the actual tech stack used in production code.
- **LeetCode Integration**: Connects to the LeetCode GraphQL API to measure algorithmic problem-solving volume.
- **Skill Cross-Referencing**: Mathematically overlaps claimed resume skills with active repository imports/dependencies, penalizing unverified skills.
- **AI Architectural Review**: Evaluates the codebase structure and outputs a strict 2-3 sentence technical summary of strengths and weaknesses.
- **Premium 3D UI**: Features glassmorphic panels, dynamic animations, and swinging 3D CSS Medals (Elite, Gold, Silver, Bronze).
- **PDF Report Generation**: Compiles the entire analysis into a sleek, downloadable Competency ScoreCard PDF using `@react-pdf/renderer`.

## 🏗️ System Architecture & Flow

The system operates across three tightly integrated services:

1. **Frontend (`/frontend`)**: 
   - Built with Next.js 14 and Tailwind CSS.
   - Users upload their PDF resume and input their GitHub/LeetCode usernames.
   - Long-polling connects to the backend to display real-time, animated progress steps (Analyzing Commits -> Verifying Skills -> Generating Score).
   - Renders the final 3D Dashboard and handles the local compilation of the PDF report.

2. **Backend API (`/backend`)**: 
   - Express.js server that handles the file upload (`multer`) and orchestration.
   - Parses the PDF into raw text and queues a massive parallel analysis job to the background worker.
   - Provides a polling endpoint `/api/scan/:id` for the frontend to fetch real-time task progress.

3. **Background Worker (`/worker`)**:
   - The heavy lifting engine. Runs asynchronous queues.
   - **Step 1**: Triggers `pdfParse` and AI extraction to identify core resume skills.
   - **Step 2**: Crawls GitHub repositories concurrently, fetching languages, package.json dependencies, and commits using the GitHub API.
   - **Step 3**: Hits the LeetCode API to fetch algorithm stats.
   - **Step 4**: Computes the final strict algorithmic score (`scoring.ts`), factoring in commit quality, project complexity, ATS density, and cross-reference validation.
   - **Step 5**: Saves the final `evidence` and `report` JSON payloads for the frontend.

## 🏅 Medal Tier System

Based on the final Composite Score (0-100), candidates are awarded a rank:
- **🏆 ELITE** (> 85 Score) - Glowing Fuchsia
- **🥇 GOLD** (> 70 Score) - Golden Amber
- **🥈 SILVER** (> 60 Score) - Slate Gray
- **🥉 BRONZE** (> 50 Score) - Deep Orange
- **No Medal** (< 50 Score)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- GitHub Personal Access Token (for API rate limits)
- Gemini / OpenAI API Key (for AI Analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/urscore-ai.git
   cd urscore-ai
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   # Create a .env file with your PORT and API Keys
   npm run dev
   ```

3. **Setup the Worker**
   ```bash
   cd worker
   npm install
   # Create a .env file with your GITHUB_TOKEN and AI API Keys
   npm run dev
   ```

4. **Setup the Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Run the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Lucide React, `@react-pdf/renderer`, `react-dropzone`
- **Backend/Worker**: Node.js, Express.js, TypeScript, Axios, `pdf-parse`
- **AI/APIs**: Google Gemini SDK, GitHub REST API, LeetCode GraphQL API

## 📝 License

This project is licensed under the MIT License.
