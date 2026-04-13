import type { FlowData } from './flowTypes.js';

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || 'meta-llama/llama-3.1-8b-instruct';

function buildFlowPrompt(prd: Record<string, unknown>): string {
  const services = Array.isArray(prd.services)
    ? (prd.services as string[]).filter((item) => typeof item === 'string')
    : [];
  const faqItems = Array.isArray(prd.faq)
    ? (prd.faq as Array<{ question?: string; answer?: string }>)
        .filter((item) => typeof item.question === 'string' && typeof item.answer === 'string')
        .slice(0, 3)
    : [];

  return `Create a valid JSON conversation flow for a chatbot. Return ONLY one JSON object with top-level keys 'nodes' and 'edges'.

Company: ${prd.companyName || 'Company'}
Industry: ${prd.industry || 'general'}
Tone: ${prd.tone || 'friendly'}
Target audience: ${prd.targetAudience || 'prospects'}
Services: ${services.join(', ') || 'general services'}
FAQ:
${faqItems
  .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
  .join('\n\n')}

Use node types: start, aiResponse, condition, end.
Include node fields: id, type, position, data. Do not include backticks, markdown, or extra explanation.`;
}

function makeFallbackFlow(prd: Record<string, unknown>): FlowData {
  const services = Array.isArray(prd.services)
    ? (prd.services as string[]).filter((s) => typeof s === 'string').slice(0, 3)
    : [];
  const faqItems = Array.isArray(prd.faq)
    ? (prd.faq as Array<{ question?: string; answer?: string }>)
        .filter((f) => typeof f.question === 'string' && typeof f.answer === 'string')
        .slice(0, 2)
    : [];

  const nodes = [
    {
      id: 'start',
      type: 'start',
      position: { x: 120, y: 220 },
      data: {
        label: 'Welcome',
        message: `Welcome to ${prd.companyName || 'our company'}! I can help you with ${prd.industry || 'your needs'}.`,
      },
    },
  ];

  const assistantNodes: FlowData['nodes'] = [];
  let currentY = 140;

  for (const service of services) {
    assistantNodes.push({
      id: `service-${assistantNodes.length + 1}`,
      type: 'aiResponse',
      position: { x: 340, y: currentY },
      data: {
        label: `Service: ${service}`,
        message: `We help with ${service}. Ask me how it fits your ${prd.industry || 'business'}.`,
        intent: 'product',
        triggers: [service],
      },
    });
    currentY += 140;
  }

  for (const faq of faqItems) {
    assistantNodes.push({
      id: `faq-${assistantNodes.length + 1}`,
      type: 'aiResponse',
      position: { x: 560, y: currentY },
      data: {
        label: `FAQ: ${faq.question}`,
        message: faq.answer,
        intent: 'support',
        triggers: [faq.question],
      },
    });
    currentY += 140;
  }

  const endNode = {
    id: 'end',
    type: 'end',
    position: { x: 760, y: 240 },
    data: { label: 'End', message: 'If you have more questions, just ask!' },
  };

  nodes.push(...assistantNodes, endNode);

  const edges = [];
  let previousId = 'start';
  for (const node of assistantNodes) {
    edges.push({ id: `e-${previousId}-${node.id}`, source: previousId, target: node.id });
    previousId = node.id;
  }
  edges.push({ id: `e-${previousId}-end`, source: previousId, target: 'end' });

  return { nodes, edges };
}

function buildRagPrompt(message: string, context: string): string {
  return `You are a product assistant. Use ONLY the following context to answer the user question clearly and truthfully. If the answer is not contained in the context, say you don't know and ask one clarifying question.

Context:
${context || '(no context available)'}

Question:
${message}

Answer succinctly.`;
}

export async function generateFlowWithAI(prd: Record<string, unknown>): Promise<FlowData> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    return makeFallbackFlow(prd);
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
        model: OPENROUTER_MODEL,
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content:
              'You are a conversation flow designer. Return only one valid JSON object with top-level keys "nodes" and "edges". Do not include markdown, backticks, or explanation.',
          },
          {
            role: 'user',
            content: buildFlowPrompt(prd),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter failure ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as FlowData;
  } catch (error) {
    console.error('generateFlowWithAI failed:', error);
    return makeFallbackFlow(prd);
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

  if (!openRouterKey) {
    return {
      content: relevantDocs.length
        ? `Based on available product knowledge:\n\n${relevantDocs.slice(0, 3).join('\n\n')}`
        : "I don't have specific information about that right now, but I can still help with general questions about your product. Please provide more details so I can assist you better.",
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
        model: OPENROUTER_MODEL,
        temperature: 0.25,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: buildRagPrompt(message, context),
          },
          ...history.slice(-5).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter failure ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error('No RAG content');
    }

    return {
      content: text,
      sources: relevantDocs,
    };
  } catch (error) {
    console.error('generateAIResponseWithRAG failed:', error);
    return {
      content: relevantDocs[0] || "I'm having trouble finding that information right now. Can you share more details?",
      sources: relevantDocs,
    };
  }
}
