import type { FlowData } from './flowTypes.js';

export async function generateFlowWithAI(prd: Record<string, unknown>): Promise<FlowData> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    return {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 200 },
          data: {
            label: 'Start',
            message: `Welcome to ${prd.companyName || 'our company'}! How can I help you?`,
          },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 500, y: 200 },
          data: { label: 'End', message: 'Thank you for chatting!' },
        },
      ],
      edges: [{ id: 'e1', source: 'start', target: 'end' }],
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://flowvibe.ai',
        'X-Title': 'FlowvVibe',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'user',
            content: `Create a conversation flow JSON for a ${prd.tone || 'friendly'} AI chatbot for ${prd.companyName} in ${prd.industry} industry.

          Target: ${prd.targetAudience}
          Services: ${(prd.services as string[])?.join(', ')}
          FAQ: ${(prd.faq as Array<{ question: string; answer: string }>)?.map((f) => `Q: ${f.question} A: ${f.answer}`).join('; ')}

          Create nodes: START, AI responses for each FAQ, intent detection, conditions, and END.
          Return ONLY JSON: {"nodes": [...], "edges": [...]}`,
          },
        ],
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as FlowData;
  } catch {
    return {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 200 },
          data: { label: 'Start', message: `Welcome to ${prd.companyName}!` },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 500, y: 200 },
          data: { label: 'End', message: 'Goodbye!' },
        },
      ],
      edges: [{ id: 'e1', source: 'start', target: 'end' }],
    };
  }
}

export async function generateAIResponseWithRAG(
  message: string,
  knowledgeBase: string[],
  history: Array<{ role: string; content: string }>
): Promise<{ content: string; sources: string[] }> {
  const relevantDocs = knowledgeBase.filter((doc) =>
    doc.toLowerCase().includes(message.toLowerCase().split(' ')[0] || '')
  );

  const context = relevantDocs.join('\n\n');

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey || !relevantDocs.length) {
    return {
      content:
        relevantDocs[0] ||
        "I don't have specific information about that. Let me transfer you to a human agent.",
      sources: relevantDocs,
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          ...history.slice(-5).map((m) => ({ role: m.role, content: m.content })),
          { role: 'system', content: `Use this knowledge base to answer:\n${context}` },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content || '';
    return {
      content: text,
      sources: relevantDocs,
    };
  } catch {
    return {
      content: relevantDocs[0] || "I'm having trouble finding that information.",
      sources: relevantDocs,
    };
  }
}
