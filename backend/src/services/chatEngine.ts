import type { FlowData, FlowNode, FlowEdge } from './flowTypes.js';
export type { FlowData, FlowNode, FlowEdge } from './flowTypes.js';
export { parseFlowData } from './flowTypes.js';

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
  'until', 'while', 'about', 'against', 'between', 'into', 'through', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'been', 'being', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'their', 'our', 'its',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function tokenOverlapScore(haystackNorm: string, userNorm: string): number {
  const ts = tokens(haystackNorm);
  if (!ts.length) return 0;
  let score = 0;
  for (const t of ts) {
    if (userNorm.includes(t)) score += t.length > 4 ? 1.4 : 1;
  }
  return score;
}

/** Richer intent labels aligned with Flow Builder `aiResponse` data.intent */
export function detectIntent(userNorm: string): string {
  const u = userNorm;
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|hola|howdy)\b/.test(u)) return 'greeting';
  const checks: [string, string[]][] = [
    ['greeting', ['hello', 'hi ', ' hey', 'hey ', 'how are you', 'whats up', "what's up"]],
    ['farewell', ['bye', 'goodbye', 'see you', 'later', 'cya', 'take care']],
    ['thanks', ['thank', 'thanks', 'appreciate', 'grateful']],
    [
      'pricing',
      [
        'price',
        'pricing',
        'cost',
        'fee',
        'charge',
        'how much',
        'discount',
        'plan',
        'subscription',
        'pay',
        'payment',
        'billing',
      ],
    ],
    ['booking', ['book', 'booking', 'schedule', 'appointment', 'reserve', 'reservation', 'availability', 'slot']],
    ['order', ['order', 'delivery', 'ship', 'shipping', 'tracking', 'track package', 'refund', 'return']],
    ['support', ['help', 'support', 'issue', 'problem', 'broken', 'error', 'not working', 'fix', 'bug', 'stuck']],
    ['contact', ['contact', 'email', 'phone', 'call', 'address', 'location', 'reach', 'speak to']],
    ['hours', ['hours', 'open', 'close', 'when are you', 'timezone', '24/7']],
    ['human', ['human', 'agent', 'person', 'representative', 'operator', 'live chat', 'real person']],
    ['complaint', ['complaint', 'angry', 'frustrated', 'terrible', 'worst', 'unacceptable', 'ridiculous']],
    ['product', ['product', 'feature', 'how does', 'what is', 'tell me about', 'capabilities', 'integration']],
  ];
  for (const [intent, keys] of checks) {
    if (keys.some((k) => u.includes(k))) return intent;
  }
  return 'general';
}

export function detectSentiment(userNorm: string): string {
  const neg = ['angry', 'frustrated', 'terrible', 'worst', 'awful', 'horrible', 'hate', 'disappointed', 'useless', 'scam', 'ridiculous'];
  const pos = ['great', 'awesome', 'love', 'amazing', 'excellent', 'perfect', 'wonderful', 'fantastic', 'thanks', 'helpful'];
  if (neg.some((k) => userNorm.includes(k))) return 'negative';
  if (pos.some((k) => userNorm.includes(k))) return 'positive';
  return 'neutral';
}

interface PrdFaq {
  question: string;
  answer: string;
}

function parsePrd(prd: unknown): {
  companyName?: string;
  industry?: string;
  tone?: string;
  targetAudience?: string;
  services?: string[];
  faq?: PrdFaq[];
} {
  if (!prd || typeof prd !== 'object') return {};
  const p = prd as Record<string, unknown>;
  return {
    companyName: typeof p.companyName === 'string' ? p.companyName : undefined,
    industry: typeof p.industry === 'string' ? p.industry : undefined,
    tone: typeof p.tone === 'string' ? p.tone : undefined,
    targetAudience: typeof p.targetAudience === 'string' ? p.targetAudience : undefined,
    services: Array.isArray(p.services) ? (p.services as string[]).filter((s) => typeof s === 'string') : undefined,
    faq: Array.isArray(p.faq)
      ? (p.faq as unknown[])
          .filter((x): x is PrdFaq => {
            if (!x || typeof x !== 'object') return false;
            const o = x as Record<string, unknown>;
            return typeof o.question === 'string' && typeof o.answer === 'string';
          })
          .map((x) => ({ question: x.question, answer: x.answer }))
      : undefined,
  };
}

function bestFaqAnswer(userNorm: string, faqs: PrdFaq[]): { answer: string; score: number } | null {
  let best: { answer: string; score: number } | null = null;
  for (const f of faqs) {
    const qNorm = normalize(f.question);
    const aNorm = normalize(f.answer);
    let score = tokenOverlapScore(qNorm, userNorm) * 2.2;
    const qTokens = tokens(f.question);
    const matched = qTokens.filter((t) => userNorm.includes(t)).length;
    score += matched * 1.1;
    if (qNorm.length > 8 && userNorm.includes(qNorm.slice(0, Math.min(24, qNorm.length)))) score += 2.5;
    if (userNorm.length > 6 && qNorm.includes(userNorm.slice(0, Math.min(20, userNorm.length)))) score += 1.5;
    score += tokenOverlapScore(aNorm, userNorm) * 0.35;
    if (!best || score > best.score) best = { answer: f.answer, score };
  }
  if (best && best.score >= 2.2) return best;
  return null;
}

function serviceMatch(userNorm: string, services: string[]): string | null {
  let best: { line: string; score: number } | null = null;
  for (const s of services) {
    const sc = tokenOverlapScore(s, userNorm);
    if (sc >= 1.2 && (!best || sc > best.score)) best = { line: s, score: sc };
  }
  if (!best) return null;
  return `We offer ${best.line}. Would you like more detail on how that works for you, or help choosing the right option?`;
}

function neighborsFrom(
  nodeId: string,
  edges: FlowEdge[],
  nodesById: Map<string, FlowNode>
): FlowNode[] {
  const out: FlowNode[] = [];
  for (const e of edges) {
    if (e.source === nodeId) {
      const n = nodesById.get(e.target);
      if (n) out.push(n);
    }
  }
  return out;
}

function conditionMatches(node: FlowNode, userNorm: string): boolean {
  const data = node.data as Record<string, unknown>;
  const cond = typeof data.condition === 'string' ? data.condition : '';
  if (!cond.trim()) return true;
  return tokenOverlapScore(cond, userNorm) >= 1 || tokens(cond).some((t) => userNorm.includes(t));
}

function collectAiResponsesAfterCondition(
  flow: FlowData,
  userNorm: string
): { node: FlowNode; bonus: number }[] {
  const nodesById = new Map(flow.nodes.map((n) => [n.id, n]));
  const results: { node: FlowNode; bonus: number }[] = [];
  for (const node of flow.nodes) {
    if (node.type !== 'condition' && node.type !== 'branch') continue;
    if (!conditionMatches(node, userNorm)) continue;
    for (const next of neighborsFrom(node.id, flow.edges, nodesById)) {
      if (next.type === 'aiResponse') results.push({ node: next, bonus: 2.8 });
      for (const nn of neighborsFrom(next.id, flow.edges, nodesById)) {
        if (nn.type === 'aiResponse') results.push({ node: nn, bonus: 1.4 });
      }
    }
  }
  return results;
}

function scoreAiNode(
  node: FlowNode,
  userNorm: string,
  intent: string,
  sentiment: string,
  bonus: number
): number {
  const data = node.data as Record<string, unknown>;
  const nodeIntent = typeof data.intent === 'string' ? data.intent : '';
  const message = typeof data.message === 'string' ? data.message : '';
  const label = typeof data.label === 'string' ? data.label : '';
  const triggers = Array.isArray(data.triggers)
    ? (data.triggers as unknown[]).filter((t): t is string => typeof t === 'string')
    : typeof data.triggers === 'string'
      ? data.triggers.split(',').map((s) => s.trim())
      : [];

  let score = bonus;
  if (nodeIntent && nodeIntent === intent) score += 4.5;
  if (nodeIntent && intent !== 'general') {
    if (nodeIntent === 'greeting' && intent === 'greeting') score += 3;
    if (nodeIntent === 'farewell' && (intent === 'farewell' || intent === 'thanks')) score += 2;
    if (nodeIntent === 'support' && intent === 'support') score += 3;
    if (nodeIntent === 'pricing' && intent === 'pricing') score += 3;
    if (nodeIntent === 'order' && intent === 'order') score += 3;
  }

  score += tokenOverlapScore(`${message} ${label}`, userNorm) * 1.15;
  for (const tr of triggers) {
    if (userNorm.includes(normalize(tr))) score += 2.2;
  }

  if (sentiment === 'negative' && /sorry|apolog|understand|help/i.test(message)) score += 0.8;

  if (message.length > 12) score += 0.25;
  return score;
}

function pickStartGreeting(flow: FlowData): string | null {
  const start = flow.nodes.find((n) => n.type === 'start');
  if (!start) return null;
  const data = start.data as Record<string, unknown>;
  const msg = typeof data.message === 'string' ? data.message.trim() : '';
  return msg || null;
}

function bestFlowReply(
  flow: FlowData,
  userNorm: string,
  intent: string,
  sentiment: string,
  isFirstUserTurn: boolean
): { content: string; score: number } | null {
  if (!flow.nodes.length) return null;

  if (isFirstUserTurn && intent === 'greeting') {
    const greet = pickStartGreeting(flow);
    if (greet) return { content: greet, score: 100 };
  }

  const bonuses = new Map<string, number>();
  for (const { node, bonus } of collectAiResponsesAfterCondition(flow, userNorm)) {
    bonuses.set(node.id, Math.max(bonuses.get(node.id) ?? 0, bonus));
  }

  let best: { content: string; score: number } | null = null;
  for (const node of flow.nodes) {
    if (node.type !== 'aiResponse') continue;
    const data = node.data as Record<string, unknown>;
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!message) continue;
    const b = bonuses.get(node.id) ?? 0;
    const score = scoreAiNode(node, userNorm, intent, sentiment, b);
    if (!best || score > best.score) best = { content: message, score };
  }

  if (best && best.score >= 2.4) return best;
  return best;
}

function contextualFallback(
  intent: string,
  prd: ReturnType<typeof parsePrd>,
  meta: { name?: string; description?: string; industry?: string; tone?: string }
): string {
  const company = prd.companyName || meta.name || 'our team';
  const industry = prd.industry || meta.industry || 'your needs';
  const tone = (meta.tone || prd.tone || 'friendly').toLowerCase();

  const lines: Record<string, string> = {
    greeting: `Hi — thanks for reaching out to ${company}. What would you like help with today?`,
    thanks: `You're welcome! If anything else comes up, I'm here.`,
    farewell: `Thanks for chatting with ${company}. Have a great day!`,
    pricing: `I can walk you through options and pricing for ${company}. What are you trying to solve in ${industry}?`,
    booking: `I can help you find a time. What day works best, and what timezone are you in?`,
    order: `I'll help with your order. Do you have an order ID, or the email you used at checkout?`,
    support: `Sorry you're running into this — let's fix it. What exactly happens when you try (any error message helps)?`,
    contact: `You can share what you need here and I'll route it to ${company}, or tell me if you prefer email vs phone.`,
    hours: `I don't have live hours in this chat yet — tell me your region and what you need, and I'll give the best next step.`,
    human: `I can note that you'd like a human. What should they help you with so I can pass a clear summary?`,
    complaint: `I'm sorry this has been frustrating. I want to make it right — what happened, and what outcome would help?`,
    product: `Happy to explain how we fit ${industry}. Are you comparing options, or ready to try something specific?`,
    general: `I'm here to help with ${company} (${industry}). Could you share a bit more about what you're looking for?`,
  };

  let base = lines[intent] || lines.general;
  if (meta.description && intent === 'general') {
    const short = meta.description.slice(0, 220);
    base = `${base}\n\nQuick context: ${short}`;
  }
  if (tone.includes('formal')) base = base.replace(/Hi —/g, 'Hello.').replace(/I'm here/g, 'I am here');
  return base;
}

async function llmReply(params: {
  userMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  prd: ReturnType<typeof parsePrd>;
  meta: { name?: string; description?: string; industry?: string; tone?: string };
  flowSummary: string;
  intent: string;
  sentiment: string;
}): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const model =
    process.env.CHAT_LLM_MODEL?.trim() || 'openai/gpt-4o-mini';

  const company = params.prd.companyName || params.meta.name || 'the business';
  const industry = params.prd.industry || params.meta.industry || 'general';
  const tone = params.meta.tone || params.prd.tone || 'friendly, concise, professional';

  const faqBlock =
    params.prd.faq?.slice(0, 12).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') ||
    '(no FAQ configured)';

  const system = `You are the website chat assistant for "${company}" (${industry}).
Tone: ${tone}.
User intent (heuristic): ${params.intent}. Sentiment: ${params.sentiment}.

Use ONLY the knowledge below plus the flow snippets. If something is unknown, say so briefly and ask ONE focused follow-up question — do not invent policies, prices, or legal claims.

=== FAQ / knowledge ===
${faqBlock}

=== Flow responses (authoritative snippets builders configured) ===
${params.flowSummary || '(empty flow)'}

Rules:
- Reply in 1–3 short paragraphs or bullet list; plain text, no markdown headers.
- Mirror the user's language if non-English.
- Be specific and actionable; avoid generic filler like "I understand" unless empathy is needed for negative sentiment.`;

  const hist = params.history.slice(-10);
  const last = hist[hist.length - 1];
  const withoutDupUser =
    last?.role === 'user' && last.content.trim() === params.userMessage.trim()
      ? hist.slice(0, -1)
      : hist;
  const messages = [
    { role: 'system' as const, content: system },
    ...withoutDupUser.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: params.userMessage },
  ];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://flowvibe.ai',
        'X-Title': 'FlowVibe Chat',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 450,
        messages,
      }),
    });
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

function buildFlowSummary(flow: FlowData, maxNodes = 14): string {
  const parts: string[] = [];
  for (const n of flow.nodes) {
    if (n.type === 'aiResponse' || n.type === 'start') {
      const d = n.data as Record<string, unknown>;
      const label = typeof d.label === 'string' ? d.label : n.type;
      const msg = typeof d.message === 'string' ? d.message : '';
      const intent = typeof d.intent === 'string' ? ` [intent=${d.intent}]` : '';
      if (msg) parts.push(`- ${label}${intent}: ${msg.slice(0, 280)}${msg.length > 280 ? '…' : ''}`);
    }
  }
  return parts.slice(0, maxNodes).join('\n');
}

export interface RunTurnParams {
  flow: FlowData;
  prd: unknown;
  chatbot: {
    name?: string;
    description?: string;
    industry?: string;
    tone?: string;
  };
  userMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RunTurnResult {
  content: string;
  intent: string;
  sentiment: string;
}

/** Main entry: FAQ + flow graph + LLM fallback for strong conversational quality */
export async function runConversationTurn(params: RunTurnParams): Promise<RunTurnResult> {
  const raw = params.userMessage.trim();
  const userNorm = normalize(raw);
  if (!userNorm) {
    return { content: 'Go ahead — what would you like help with?', intent: 'general', sentiment: 'neutral' };
  }

  const intent = detectIntent(userNorm);
  const sentiment = detectSentiment(userNorm);
  const prd = parsePrd(params.prd);

  const assistantTurns = params.history.filter((h) => h.role === 'assistant').length;
  const isFirstUserTurn = assistantTurns === 0;

  const faqHit = prd.faq?.length ? bestFaqAnswer(userNorm, prd.faq) : null;
  if (faqHit && faqHit.score >= 2.2) {
    return { content: faqHit.answer, intent, sentiment };
  }

  if (prd.services?.length) {
    const svc = serviceMatch(userNorm, prd.services);
    if (svc) return { content: svc.replace(/\*\*/g, ''), intent, sentiment };
  }

  const flowPick = bestFlowReply(params.flow, userNorm, intent, sentiment, isFirstUserTurn);
  if (flowPick && flowPick.score >= 2.4) {
    return { content: flowPick.content, intent, sentiment };
  }

  const flowSummary = buildFlowSummary(params.flow);
  const llm = await llmReply({
    userMessage: raw,
    history: params.history,
    prd,
    meta: params.chatbot,
    flowSummary,
    intent,
    sentiment,
  });
  if (llm) {
    return { content: llm, intent, sentiment };
  }

  if (flowPick && flowPick.content) {
    return { content: flowPick.content, intent, sentiment };
  }

  return {
    content: contextualFallback(intent, prd, params.chatbot),
    intent,
    sentiment,
  };
}

/** @deprecated use runConversationTurn for quality */
export function generateAIResponse(
  flow: FlowData,
  userMessage: string
): { content: string; intent: string; sentiment: string } {
  const userNorm = normalize(userMessage);
  const intent = detectIntent(userNorm);
  const sentiment = detectSentiment(userNorm);
  const pick = bestFlowReply(flow, userNorm, intent, sentiment, false);
  if (pick?.content) {
    return { content: pick.content, intent, sentiment };
  }
  return {
    content: contextualFallback(intent, {}, {}),
    intent,
    sentiment,
  };
}
