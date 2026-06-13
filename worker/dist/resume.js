"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResumeText = analyzeResumeText;
const LANGUAGES_DICT = ['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'ruby', 'rust', 'swift', 'php', 'html', 'css', 'c#', 'kotlin'];
const FRAMEWORKS_DICT = ['react', 'angular', 'vue', 'next.js', 'express', 'django', 'flask', 'rails', 'spring boot', 'laravel', 'tailwind', 'redux', 'svelte', 'fastapi'];
const DATABASES_DICT = ['postgresql', 'mongodb', 'mysql', 'redis', 'sqlite', 'dynamodb', 'oracle', 'cassandra', 'mariadb', 'supabase'];
const TOOLS_DICT = ['git', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'jenkins', 'github actions', 'graphql', 'rest api', 'ci/cd', 'webpack', 'vite'];
function analyzeResumeText(text) {
    if (!text) {
        return {
            keywords: { languages: [], frameworks: [], databases: [], tools: [] },
            totalKeywordsCount: 0,
            experienceYears: 1,
            extractedProjects: []
        };
    }
    const normalizedText = text.toLowerCase();
    const findMatches = (dict) => {
        return dict.filter(keyword => {
            // Word boundary regex to avoid partial matches (e.g. 'go' matching 'django' or 'google')
            // For symbols like c++, c#, next.js, we escape them first
            const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(normalizedText);
        });
    };
    const languages = findMatches(LANGUAGES_DICT);
    const frameworks = findMatches(FRAMEWORKS_DICT);
    const databases = findMatches(DATABASES_DICT);
    const tools = findMatches(TOOLS_DICT);
    // Years of Experience regex estimator
    // Matches expressions like "X+ years", "X years of experience", "2018 - 2022", "2020 to Present"
    let experienceYears = 1;
    const expRegex = /(\d+)\+?\s*years?\b/gi;
    let match;
    let maxYears = 0;
    while ((match = expRegex.exec(normalizedText)) !== null) {
        const years = parseInt(match[1]);
        if (years > maxYears && years < 30) {
            maxYears = years;
        }
    }
    // Date range parsing (e.g. 2018 - 2023)
    const dateRangeRegex = /\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current)\b/gi;
    let dateRangeMatch;
    let calculatedYears = 0;
    while ((dateRangeMatch = dateRangeRegex.exec(normalizedText)) !== null) {
        const startYear = parseInt(dateRangeMatch[1]);
        const endYearStr = dateRangeMatch[2].toLowerCase();
        const endYear = (endYearStr === 'present' || endYearStr === 'current')
            ? new Date().getFullYear()
            : parseInt(endYearStr);
        if (endYear >= startYear) {
            calculatedYears += (endYear - startYear);
        }
    }
    experienceYears = Math.max(1, maxYears, calculatedYears);
    // Extract project names/titles
    // Usually bullet points under "Projects" or "Key Projects"
    // Let's scrape sentences containing "project" or uppercase phrases as project lists
    const projectMentions = [];
    const lines = text.split(/\r?\n/);
    let inProjectsSection = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (/projects|work experience|employment/i.test(trimmed)) {
            inProjectsSection = true;
            continue;
        }
        if (inProjectsSection && trimmed.length > 5 && trimmed.startsWith('•') || trimmed.startsWith('-')) {
            // Extract first 4 words of project description or specific names
            const cleaned = trimmed.replace(/^[•\-\s]+/, '');
            if (cleaned.length > 10 && projectMentions.length < 5) {
                projectMentions.push(cleaned.split(/[.,;]/)[0]);
            }
        }
    }
    // Fallback project names
    if (projectMentions.length === 0) {
        const projMatches = text.match(/(?:Project|System|Platform|Application):\s*([A-Za-z0-9\s]{3,20})/gi);
        if (projMatches) {
            projMatches.forEach(m => projectMentions.push(m.replace(/(?:Project|System|Platform|Application):\s*/i, '').trim()));
        }
    }
    const totalKeywordsCount = languages.length + frameworks.length + databases.length + tools.length;
    return {
        keywords: {
            languages,
            frameworks,
            databases,
            tools
        },
        totalKeywordsCount,
        experienceYears,
        extractedProjects: Array.from(new Set(projectMentions))
    };
}
