// Core domain types

export enum CallOutcome {
  SUCCESSFUL = 'successful',
  ESCALATED = 'escalated',
  UNRESOLVED = 'unresolved',
  CHURN = 'churn'
}

export enum Sentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

export interface Call {
  id: string;
  agentId: string;
  customerId: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  outcome?: CallOutcome;
  overallSentiment?: Sentiment;
  summary?: string;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationalTurn {
  id: string;
  callId: string;
  turnNumber: number;
  speaker: 'agent' | 'customer';
  transcript: string;
  confidence: number;
  timestampOffset: number;
  createdAt: Date;
}

export interface EmotionalMetrics {
  anger: number;
  frustration: number;
  satisfaction: number;
  neutral: number;
  confidence: number;
  timestamp: number;
}

export interface EmotionalMetric {
  id: string;
  callId: string;
  turnId?: string;
  timestampOffset: number;
  anger: number;
  frustration: number;
  satisfaction: number;
  neutral: number;
  confidence: number;
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  callId: string;
  priority: 'high' | 'medium' | 'low';
  text: string;
  reasoning: string;
  historicalSuccessRate?: number;
  similarCaseIds?: string[];
  wasFollowed?: boolean;
  timestampOffset: number;
  createdAt: Date;
}

export interface Pattern {
  id: string;
  patternType: 'success' | 'failure' | 'escalation';
  emotionalSignature: EmotionalMetrics;
  contextSignature: ConversationContext;
  commonOutcome: CallOutcome;
  frequency: number;
  successRate: number;
  sampleCallIds: string[];
  lastUpdated: Date;
  createdAt: Date;
}

export interface TurningPoint {
  id: string;
  callId: string;
  timestampOffset: number;
  description: string;
  emotionBefore: EmotionalMetrics;
  emotionAfter: EmotionalMetrics;
  trigger: string;
  createdAt: Date;
}

export interface ConversationContext {
  trajectory: 'improving' | 'escalating' | 'de-escalating' | 'stable';
  topics: string[];
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: number;
}

export interface TranscriptSegment {
  text: string;
  confidence: number;
  speaker: 'agent' | 'customer';
  timestamp: number;
  isFinal: boolean;
}
