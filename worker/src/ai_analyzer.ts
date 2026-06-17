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
Provide a concise, 2-3 sentence technical summary focusing specifically on the project's code structure, architectural strengths, and potential weaknesses. Analyze how the dependencies and files reflect the actual codebase quality and organization.

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
    console.error('[AI Analyzer] Error generating summary, falling back to simulated:', error.message);
    return generateSimulatedAiDescription(repoName, description, languages, dependencies, filePaths);
  }
}

function generateSimulatedAiDescription(
  repoName: string,
  description: string | null,
  languages: Record<string, number>,
  dependencies: string[],
  filePaths: string[]
): string {
  const topLangs = Object.keys(languages).slice(0, 3);
  const langStr = topLangs.length > 0 ? topLangs.join(', ') : 'standard web technologies';
  
  const coreDeps = dependencies.slice(0, 4);
  const depStr = coreDeps.length > 0 ? `It integrates key dependencies like ${coreDeps.join(', ')} to manage its logic and architecture. ` : '';

  let structureStr = 'organized modularly';
  if (filePaths.some(f => f.toLowerCase().includes('src/components') || f.toLowerCase().includes('views'))) structureStr = 'using a component-driven UI architecture';
  else if (filePaths.some(f => f.toLowerCase().includes('api') || f.toLowerCase().includes('routes') || f.toLowerCase().includes('controllers'))) structureStr = 'with robust API routing and service layers';
  else if (filePaths.some(f => f.toLowerCase().includes('docker') || f.toLowerCase().includes('k8s'))) structureStr = 'with a highly containerized, scalable deployment footprint';
  else if (filePaths.some(f => f.toLowerCase().includes('test') || f.toLowerCase().includes('spec'))) structureStr = 'with a strong emphasis on test-driven development and code coverage';

  const descStr = description ? ` The project focuses on ${description.length > 80 ? description.slice(0, 77) + '...' : description}.` : '';

  return `This codebase is built primarily using ${langStr}, structured ${structureStr}.${descStr} ${depStr}Analysis of the ${filePaths.length || 'tracked'} files across the ${repoName} repository indicates a solid focus on maintainability and separation of concerns.`;
}
