export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  subscription?: Subscription;
  role?: 'user' | 'admin';
  phone?: string;
  companyName?: string;
  location?: string;
  subscriptionStartDate?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt: Date;
  startDate?: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'upi' | 'bank_transfer' | 'card' | 'razorpay';
  transactionId?: string;
  plan: 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
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
  status: 'draft' | 'active' | 'inactive' | 'archived';
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt?: Date;
  theme?: BotTheme;
  settings?: BotSettings;
}

export interface BotTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  avatarUrl?: string;
  logoUrl?: string;
}

export interface BotSettings {
  welcomeMessage: string;
  fallbackMessage: string;
  typingIndicator: boolean;
  soundEnabled: boolean;
  fileAttachments: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  businessHoursOnly: boolean;
  autoCloseTimeout: number;
  requireEmail: boolean;
  requirePhone: boolean;
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
  | 'end'
  | 'booking'
  | 'makeCall'
  | 'humanHandoff'
  | 'zapierWebhook';

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
  emailFrom?: string;
  smsContent?: string;
  phoneNumber?: string;
  twilioConfig?: TwilioConfig;
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
  bookingService?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingSlots?: BookingSlot[];
  agentEmail?: string;
  agentNotification?: string;
  zapierHookUrl?: string;
  zapierAction?: string;
  crmUpdate?: CRMUpdate;
  [key: string]: unknown;
}

export interface QuickReplyButton {
  label: string;
  action: string;
  payload?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface CRMUpdate {
  crmType: 'salesforce' | 'hubspot' | 'zoho' | 'custom';
  apiKey: string;
  endpoint: string;
  mapping: Record<string, string>;
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
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  apiKey: string;
}

export interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string;
  userId: string;
  role: 'user';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

// ==================== BOOKINGS ====================

export interface Booking {
  id: string;
  chatbotId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt?: Date;
}

export interface BookingService {
  id: string;
  name: string;
  duration: number;
  description?: string;
  price?: number;
}

export interface BookingSlot {
  date: string;
  time: string;
  available: boolean;
}

// ==================== PREMIUM FEATURES ====================

export interface PremiumFeatures {
  bookings: boolean;
  call: boolean;
  email: boolean;
  humanHandoff: boolean;
  webhooks: boolean;
  customCRM: boolean;
  analytics: boolean;
}

export interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  price: number;
  yearlyPrice?: number;
  features: PremiumFeatures;
  limits: PlanLimits;
  addons: Addon[];
}

export interface PlanLimits {
  chatbots: number;
  conversations: number;
  leads: number;
  users?: number;
  storageMB?: number;
}

export interface Addon {
  id: string;
  name: string;
  feature: keyof PremiumFeatures;
  price: number;
  description: string;
}

export interface FeatureAccess {
  userId: string;
  feature: keyof PremiumFeatures;
  active: boolean;
  expiresAt?: Date;
}