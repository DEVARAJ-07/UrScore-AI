-- Supabase Database Schema for UrScore AI
-- Enforces strict relations and types for developer scans and reports.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Auth links)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'developer' CHECK (role IN ('developer', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Scans Table (Orchestration & State tracking)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    github_username TEXT NOT NULL,
    resume_url TEXT,
    portfolio_url TEXT,
    leetcode_username TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing_resume', 'fetching_github', 'calculating', 'completed', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow scan creators to read their scans" 
    ON public.scans FOR SELECT USING (true);

CREATE POLICY "Allow system workers to insert/update scans" 
    ON public.scans FOR ALL USING (true);

-- 3. Competency Reports Table (Computed Subscores)
CREATE TABLE IF NOT EXISTS public.competency_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0.00 AND overall_score <= 100.00),
    skill_verification NUMERIC(5,2) NOT NULL CHECK (skill_verification >= 0.00 AND skill_verification <= 100.00),
    commit_quality NUMERIC(5,2) NOT NULL CHECK (commit_quality >= 0.00 AND commit_quality <= 100.00),
    project_complexity NUMERIC(5,2) NOT NULL CHECK (project_complexity >= 0.00 AND project_complexity <= 100.00),
    recency NUMERIC(5,2) NOT NULL CHECK (recency >= 0.00 AND recency <= 100.00),
    cross_reference NUMERIC(5,2) NOT NULL CHECK (cross_reference >= 0.00 AND cross_reference <= 100.00),
    activity_consistency NUMERIC(5,2) NOT NULL CHECK (activity_consistency >= 0.00 AND activity_consistency <= 100.00),
    summary_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    pdf_report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for reports
ALTER TABLE public.competency_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to competency reports" 
    ON public.competency_reports FOR SELECT USING (true);

CREATE POLICY "Allow system updates to reports" 
    ON public.competency_reports FOR ALL USING (true);

-- 4. Evidence Store Table (Detailed raw findings)
CREATE TABLE IF NOT EXISTS public.evidence_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    raw_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for evidence store
ALTER TABLE public.evidence_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to evidence" 
    ON public.evidence_store FOR SELECT USING (true);

CREATE POLICY "Allow system write to evidence" 
    ON public.evidence_store FOR ALL USING (true);
