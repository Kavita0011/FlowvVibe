export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  subscription?: Subscription;
  role?: 'user' | 'admin';
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
  
  companyDescription?: string;
  uniqueSellingPoints?: string[];
  hoursOfOperation?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: string[];
  leadQualification?: string;
  commonObjections?: string[];
  competitiveAdvantages?: string;
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
  hidden?: boolean;
  draggable?: boolean;
  selectable?: boolean;
}

export type NodeType = 
  | 'start'
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
  | 'end';

export interface NodeData {
  label?: string;
  message?: string;
  question?: string;
  condition?: string;
  conditionValue?: string;
  delay?: number;
  webhookUrl?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  apiHeaders?: Record<string, string>;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  smsContent?: string;
  options?: string[];
  quickReplies?: string[];
  intents?: Intent[];
  responses?: Response[];
  validation?: 'none' | 'email' | 'phone' | 'number' | 'required';
  errorMessage?: string;
  successMessage?: string;
  branchOptions?: BranchOption[];
  leadFields?: LeadField[];
  storeAs?: string;
  companyUSP?: string[];
  quickReplyButtons?: QuickReplyButton[];
  [key: string]: unknown;
}

export interface QuickReplyButton {
  label: string;
  action: string;
  payload?: string;
}

export interface BranchOption {
  id: string;
  label: string;
  condition: string;
  conditionValue?: string;
}

export interface LeadField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'date';
  required?: boolean;
  options?: string[];
  validation?: string;
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
  type?: 'default' | 'conditional';
  label?: string;
  data?: { condition?: string };
}

export interface Channel {
  type: 'website' | 'whatsapp' | 'telegram' | 'slack' | 'instagram' | 'facebook' | 'api';
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
  apiKey?: string;
  color?: string;
  position?: 'bottom-left' | 'bottom-right';
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
  leadData?: Record<string, string>;
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
  quickReply?: string;
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

export interface Analytics {
  chatbotId: string;
  totalConversations: number;
  totalMessages: number;
  averageRating: number;
  topIntents: { intent: string; count: number }[];
  conversationsByDay: { date: string; count: number }[];
  leadsCollected: number;
}

export interface Lead {
  id: string;
  chatbotId: string;
  conversationId: string;
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
  createdAt: Date;
  status: 'new' | 'contacted' | 'converted' | 'lost';
}

export interface AdminCredentials {
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
}