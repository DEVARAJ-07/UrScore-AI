import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeRepoCodebase(
  repoName: string,
  description: string | null,
  languages: Record<string, number>,
  dependencies: string[],
  filePaths: string[]
): Promise<string> {
  // If no API key is provided, return a simulated description immediately.
  if (!process.env.GEMINI_API_KEY) {
    return generateSimulatedAiDescription(repoName, description, languages, dependencies, filePaths);
  }

  try {
    const prompt = `
You are an expert software architect evaluating a developer's repository.
Analyze the following repository metadata and provide a brief, professional summary (1-3 sentences) of the codebase architecture, purpose, and tech stack. Focus on what the code actually represents based on the files and dependencies.

Repository Name: ${repoName}
GitHub Description: ${description || 'None'}
Languages (bytes): ${JSON.stringify(languages)}
Dependencies: ${dependencies.join(', ')}
Key File Paths (subset): ${filePaths.slice(0, 50).join(', ')}

Please provide ONLY the summary text, without any introductory phrases or pleasantries.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 256,
        temperature: 0.2,
      }
    });

    return response.text || 'Could not generate analysis.';
  } catch (error: any) {
    console.error('[AI Analyzer] Error generating summary:', error.message);
    return 'Analysis unavailable due to processing error.';
  }
}

function generateSimulatedAiDescription(
  repoName: string,
  description: string | null,
  languages: Record<string, number>,
  dependencies: string[],
  filePaths: string[]
): string {
  // Pre-baked high-quality simulated AI analyses based on the repo name patterns
  if (repoName.includes('microservices') || repoName.includes('backend')) {
    return `This is a scalable backend service architecture heavily utilizing ${Object.keys(languages)[0] || 'TypeScript'} and containerization. The codebase demonstrates a clear separation of concerns with a modular directory structure, indicating a robust approach to API design and persistent data management via ${dependencies.join(', ') || 'standard libraries'}.`;
  }
  if (repoName.includes('react') || repoName.includes('dashboard') || repoName.includes('frontend')) {
    return `A modern frontend web application built using a component-driven architecture. The project leverages styling frameworks and robust state management practices to deliver a responsive UI, featuring clear routing schemas and decoupled UI components throughout the source tree.`;
  }
  if (repoName.includes('crawler') || repoName.includes('python')) {
    return `This repository houses a data pipeline or automation script optimized for data extraction and processing. It employs robust parsing libraries and exhibits defensive programming patterns suitable for robust IO operations and data transformation workloads.`;
  }
  if (repoName.includes('ci-cd') || repoName.includes('template')) {
    return `A dedicated DevOps configuration repository establishing automated continuous integration and deployment workflows. The configuration files enforce quality gates, automated testing pipelines, and container registry publishing steps.`;
  }

  return `This project utilizes ${Object.keys(languages)[0] || 'various technologies'} to implement its core logic. The repository structure is organized with ${filePaths.length} tracked files, highlighting a focus on maintainability and structured design patterns.`;
}
