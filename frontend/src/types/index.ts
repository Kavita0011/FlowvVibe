export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  subscription?: Subscription;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt: Date;
}

export interface Chatbot {
  id: string;
  userId: string;
  name: string;
  description?: string;
  industry: string;
  targetAudience?: string;
  tone: 'formal' | 'friendly' | 'professional' | 'casual';
  flow: FlowData;
  published: boolean;
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PRD {
  id: string;
  chatbotId: string;
  companyName: string;
  industry: string;
  services: string[];
  targetAudience: string;
  faq: FAQ[];
  escalationRules?: string;
  tone: string;
  createdAt: Date;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export type NodeType = 
  | 'aiResponse'
  | 'intentDetection'
  | 'sentimentAnalysis'
  | 'multiLanguage'
  | 'textInput'
  | 'numberInput'
  | 'emailInput'
  | 'phoneInput'
  | 'multiSelect'
  | 'datePicker'
  | 'fileUpload'
  | 'condition'
  | 'branch'
  | 'delay'
  | 'loop'
  | 'abTest'
  | 'sendEmail'
  | 'sms'
  | 'webhook'
  | 'apiCall'
  | 'crmUpdate'
  | 'transferToAgent'
  | 'contextTransfer'
  | 'start'
  | 'end';

export interface NodeData {
  label?: string;
  message?: string;
  condition?: string;
  delay?: number;
  webhookUrl?: string;
  apiEndpoint?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  smsContent?: string;
  options?: string[];
  intents?: Intent[];
  responses?: Response[];
  [key: string]: unknown;
}

export interface Intent {
  name: string;
  examples: string[];
  response: string;
}

export interface Response {
  intent: string;
  response: string;
  action?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Channel {
  type: 'website' | 'whatsapp' | 'telegram' | 'slack' | 'instagram' | 'facebook';
  config: ChannelConfig;
  enabled: boolean;
}

export interface ChannelConfig {
  widgetId?: string;
  phoneNumber?: string;
  botToken?: string;
  webhookUrl?: string;
  appId?: string;
  pageId?: string;
}

export interface Conversation {
  id: string;
  chatbotId: string;
  userId?: string;
  sessionId: string;
  messages: Message[];
  status: 'active' | 'completed' | 'transferred';
  startedAt: Date;
  endedAt?: Date;
  rating?: number;
  feedback?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  online: boolean;
  maxChats: number;
  activeChats: number;
}