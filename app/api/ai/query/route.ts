import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { getAIContext } from '../../../../lib/aiContext';
import { applyAIMutations } from '../../../../lib/aiController';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { query, mode, actions } = await request.json();

  // Placeholder response before plugging in Gemini/ChatGPT
  const context = await getAIContext(user);
  let mutationsResult = null;
  if (mode === 'full' && actions) {
    mutationsResult = await applyAIMutations(user, actions);
  }

  return NextResponse.json({
    echo: query,
    mode,
    contextPreview: { projectCount: context.projects.length, taskCount: context.tasks.length },
    mutationsResult,
    note: 'TODO: integrate real LLM (Gemini/ChatGPT) to use context and generate responses.'
  });
}
