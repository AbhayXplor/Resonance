# Design Document: AI-Powered Call Monitoring & Emotion Intelligence System

## Overview

This document describes the technical design for an AI-powered system that monitors customer support calls in real-time, detects emotional signals, and provides intelligent suggestions to agents based on historical patterns. The system captures audio from Google Meet calls, analyzes emotions and conversation context using AI services, stores structured data in Supabase, and displays real-time insights through a web dashboard.

### Key Design Goals

1. **Real-time Processing**: Capture and analyze audio with minimal latency to provide timely suggestions
2. **Intelligent Learning**: Build historical knowledge base to improve suggestions over time
3. **Dual Mode Operation**: Support both live monitoring and post-call analysis
4. **Simple Demo Setup**: Use familiar tools (Google Meet) to minimize setup complexity
5. **Graceful Degradation**: Fall back to upload mode if live capture fails

### Architecture Philosophy

The system follows a microservices-inspired architecture with clear separation between:
- Audio capture and streaming
- AI analysis services (emotion, transcription, conversation)
- Data persistence and pattern learning
- User interface and visualization

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Agent Dashboard │         │ Customer View    │          │
│  │  (React/Next.js) │         │ (Optional)       │          │
│  │                  │         │                  │          │
│  │  • Live metrics  │         │  • Simple UI     │          │
│  │  • Suggestions   │         │  • Call controls │          │
│  │  • Analytics     │         │                  │          │
│  └────────┬─────────┘         └──────────────────┘          │
│           │                                                   │
│           │ WebSocket / HTTP                                 │
│           │                                                   │
└───────────┼───────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Server (Node.js/Express)            │   │
│  │                                                       │   │
│  │  • WebSocket handler                                 │   │
│  │  • Audio stream processor                            │   │
│  │  • Suggestion engine                                 │   │
│  │  • Analytics aggregator                              │   │
│  └───────┬──────────────────────────────────────────────┘   │
│          │                                                    │
└──────────┼────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Transcription│  │   Emotion    │  │ Conversation │       │
│  │   Service   │  │   Analyzer   │  │   Analyzer   │       │
│  │             │  │              │  │              │       │
│  │ Deepgram/   │  │  Hume AI     │  │  Gemini LLM  │       │
│  │ Google STT  │  │  API         │  │  API         │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase (PostgreSQL)                   │   │
│  │                                                       │   │
│  │  Tables:                                             │   │
│  │  • calls                                             │   │
│  │  • conversational_turns                              │   │
│  │  • emotional_metrics                                 │   │
│  │  • suggestions                                       │   │
│  │  • patterns                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Live Call Monitoring Flow:**
```
1. Google Meet Call Active
   ↓
2. Agent Dashboard captures audio (Screen Capture API)
   ↓
3. Audio chunks sent to Backend via WebSocket
   ↓
4. Backend orchestrates parallel processing:
   ├─→ Transcription Service (Deepgram)
   ├─→ Emotion Analyzer (Hume AI)
   └─→ Conversation Analyzer (Gemini)
   ↓
5. Results aggregated and stored in Supabase
   ↓
6. Suggestion Engine queries historical patterns
   ↓
7. Suggestions sent back to Agent Dashboard via WebSocket
   ↓
8. Agent sees real-time suggestions and metrics
```

**Upload Mode Flow:**
```
1. Agent uploads audio file
   ↓
2. Backend receives file and queues for processing
   ↓
3. Audio processed in chunks (same as live mode)
   ↓
4. Results stored in Supabase
   ↓
5. Dashboard displays complete analysis
```

## Components and Interfaces

### 1. Audio Capture Service

**Responsibility:** Capture audio from Google Meet and stream to backend

**Implementation Options:**

**Option A: Screen Capture API (Preferred for MVP)**
```javascript
// Browser-based capture
async function captureAudio() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: false,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000
    }
  });
  
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  
  processor.onaudioprocess = (e) => {
    const audioData = e.inputBuffer.getChannelData(0);
    sendToBackend(audioData);
  };
  
  source.connect(processor);
  processor.connect(audioContext.destination);
}
```

**Option B: Browser Extension (If Screen Capture API insufficient)**
- Chrome extension with `tabCapture` permission
- Captures specific tab audio
- More reliable but requires extension installation

**Interface:**
```typescript
interface AudioCaptureService {
  startCapture(): Promise<MediaStream>;
  stopCapture(): void;
  onAudioChunk(callback: (chunk: Float32Array) => void): void;
  getStatus(): CaptureStatus;
}

enum CaptureStatus {
  IDLE = 'idle',
  CAPTURING = 'capturing',
  ERROR = 'error'
}
```

### 2. WebSocket Handler

**Responsibility:** Manage real-time bidirectional communication between frontend and backend

**Implementation:**
```typescript
// Backend WebSocket server
interface WebSocketMessage {
  type: 'audio_chunk' | 'suggestion' | 'emotion_update' | 'transcript_update';
  callId: string;
  timestamp: number;
  data: any;
}

class WebSocketHandler {
  private connections: Map<string, WebSocket>;
  
  handleConnection(ws: WebSocket, callId: string): void;
  sendSuggestion(callId: string, suggestion: Suggestion): void;
  sendEmotionUpdate(callId: string, emotions: EmotionalMetrics): void;
  broadcastToCall(callId: string, message: WebSocketMessage): void;
}
```

### 3. Audio Stream Processor

**Responsibility:** Coordinate audio processing pipeline

**Implementation:**
```typescript
class AudioStreamProcessor {
  async processAudioChunk(
    chunk: Buffer,
    callId: string
  ): Promise<ProcessingResult> {
    // Parallel processing
    const [transcript, emotions, context] = await Promise.all([
      this.transcriptionService.transcribe(chunk),
      this.emotionAnalyzer.analyze(chunk),
      this.conversationAnalyzer.analyze(chunk, callId)
    ]);
    
    // Store results
    await this.storeResults(callId, {
      transcript,
      emotions,
      context
    });
    
    // Generate suggestions if needed
    const suggestions = await this.suggestionEngine.generate(
      callId,
      emotions,
      context
    );
    
    return { transcript, emotions, context, suggestions };
  }
}
```

### 4. Transcription Service

**Responsibility:** Convert audio to text in real-time

**Provider:** Deepgram (recommended) or Google Speech-to-Text

**Interface:**
```typescript
interface TranscriptionService {
  transcribe(audioChunk: Buffer): Promise<TranscriptSegment>;
  identifySpeaker(audioChunk: Buffer): Promise<SpeakerLabel>;
}

interface TranscriptSegment {
  text: string;
  confidence: number;
  speaker: 'agent' | 'customer';
  timestamp: number;
  isFinal: boolean;
}
```

**Implementation Notes:**
- Use streaming API for real-time results
- Buffer audio chunks (1-2 seconds) before sending
- Handle interim vs final transcripts
- Speaker diarization to separate agent/customer

### 5. Emotion Analyzer

**Responsibility:** Detect emotional states from voice characteristics

**Provider:** Hume AI API

**Interface:**
```typescript
interface EmotionAnalyzer {
  analyze(audioChunk: Buffer): Promise<EmotionalMetrics>;
}

interface EmotionalMetrics {
  anger: number;        // 0-100
  frustration: number;  // 0-100
  satisfaction: number; // 0-100
  neutral: number;      // 0-100
  confidence: number;   // 0-100
  timestamp: number;
}
```

**Implementation:**
```typescript
class HumeEmotionAnalyzer implements EmotionAnalyzer {
  private apiKey: string;
  private apiUrl = 'https://api.hume.ai/v0/batch/jobs';
  
  async analyze(audioChunk: Buffer): Promise<EmotionalMetrics> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        models: { prosody: {} },
        raw_text: false,
        urls: [await this.uploadChunk(audioChunk)]
      })
    });
    
    const result = await response.json();
    return this.parseEmotions(result);
  }
  
  private parseEmotions(humeResponse: any): EmotionalMetrics {
    // Map Hume's emotion scores to our metrics
    const emotions = humeResponse.results.predictions[0].emotions;
    return {
      anger: this.findEmotion(emotions, 'Anger'),
      frustration: this.findEmotion(emotions, 'Annoyance'),
      satisfaction: this.findEmotion(emotions, 'Joy'),
      neutral: this.findEmotion(emotions, 'Calmness'),
      confidence: humeResponse.confidence,
      timestamp: Date.now()
    };
  }
}
```

### 6. Conversation Analyzer

**Responsibility:** Analyze conversation context, trajectory, and key moments

**Provider:** Google Gemini API

**Interface:**
```typescript
interface ConversationAnalyzer {
  analyze(
    transcript: string,
    callId: string
  ): Promise<ConversationContext>;
  
  identifyTurningPoints(
    callHistory: TranscriptSegment[]
  ): Promise<TurningPoint[]>;
}

interface ConversationContext {
  trajectory: 'improving' | 'escalating' | 'de-escalating' | 'stable';
  topics: string[];
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: number; // 0-100
}

interface TurningPoint {
  timestamp: number;
  description: string;
  emotionBefore: EmotionalMetrics;
  emotionAfter: EmotionalMetrics;
  trigger: string;
}
```

**Implementation:**
```typescript
class GeminiConversationAnalyzer implements ConversationAnalyzer {
  private model: GenerativeModel;
  
  async analyze(
    transcript: string,
    callId: string
  ): Promise<ConversationContext> {
    const history = await this.getCallHistory(callId);
    
    const prompt = `
      Analyze this customer support conversation:
      
      Previous context: ${history}
      Current segment: ${transcript}
      
      Provide:
      1. Conversation trajectory (improving/escalating/de-escalating/stable)
      2. Main topics discussed
      3. Customer intent
      4. Overall sentiment
      5. Urgency level (0-100)
      
      Format as JSON.
    `;
    
    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
  
  async identifyTurningPoints(
    callHistory: TranscriptSegment[]
  ): Promise<TurningPoint[]> {
    // Analyze emotion changes over time
    const emotionChanges = this.detectEmotionShifts(callHistory);
    
    // Use LLM to explain significant changes
    const turningPoints = await Promise.all(
      emotionChanges.map(change => this.explainTurningPoint(change))
    );
    
    return turningPoints;
  }
}
```

### 7. Suggestion Engine

**Responsibility:** Generate real-time suggestions based on current state and historical patterns

**Interface:**
```typescript
interface SuggestionEngine {
  generate(
    callId: string,
    emotions: EmotionalMetrics,
    context: ConversationContext
  ): Promise<Suggestion[]>;
  
  findSimilarCases(
    emotions: EmotionalMetrics,
    context: ConversationContext
  ): Promise<HistoricalCase[]>;
}

interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  text: string;
  reasoning: string;
  historicalSuccessRate?: number;
  similarCases?: string[]; // Call IDs
  timestamp: number;
}

interface HistoricalCase {
  callId: string;
  emotionalPattern: EmotionalMetrics[];
  outcome: CallOutcome;
  successfulActions: string[];
  similarity: number; // 0-1
}
```

**Implementation:**
```typescript
class PatternBasedSuggestionEngine implements SuggestionEngine {
  async generate(
    callId: string,
    emotions: EmotionalMetrics,
    context: ConversationContext
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    
    // Rule-based triggers
    if (emotions.anger > 60) {
      const similarCases = await this.findSimilarCases(emotions, context);
      
      if (similarCases.length > 0) {
        const successfulActions = this.extractSuccessfulActions(similarCases);
        
        suggestions.push({
          id: generateId(),
          priority: 'high',
          text: successfulActions[0],
          reasoning: `Customer anger at ${emotions.anger}%. Similar pattern in ${similarCases.length} past cases.`,
          historicalSuccessRate: this.calculateSuccessRate(similarCases),
          similarCases: similarCases.map(c => c.callId),
          timestamp: Date.now()
        });
      }
    }
    
    // LLM-generated contextual suggestions
    if (context.trajectory === 'escalating') {
      const llmSuggestion = await this.generateLLMSuggestion(
        callId,
        emotions,
        context
      );
      suggestions.push(llmSuggestion);
    }
    
    return suggestions;
  }
  
  async findSimilarCases(
    emotions: EmotionalMetrics,
    context: ConversationContext
  ): Promise<HistoricalCase[]> {
    // Query database for similar emotional patterns
    const cases = await this.db
      .from('calls')
      .select('*, emotional_metrics(*), conversational_turns(*)')
      .where('outcome', 'successful')
      .limit(10);
    
    // Calculate similarity scores
    return cases
      .map(c => ({
        ...c,
        similarity: this.calculateSimilarity(emotions, c.emotional_metrics)
      }))
      .filter(c => c.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity);
  }
  
  private calculateSimilarity(
    current: EmotionalMetrics,
    historical: EmotionalMetrics[]
  ): number {
    // Cosine similarity or Euclidean distance
    const avgHistorical = this.averageEmotions(historical);
    
    const dotProduct = 
      current.anger * avgHistorical.anger +
      current.frustration * avgHistorical.frustration +
      current.satisfaction * avgHistorical.satisfaction;
    
    const magnitudeCurrent = Math.sqrt(
      current.anger ** 2 + 
      current.frustration ** 2 + 
      current.satisfaction ** 2
    );
    
    const magnitudeHistorical = Math.sqrt(
      avgHistorical.anger ** 2 + 
      avgHistorical.frustration ** 2 + 
      avgHistorical.satisfaction ** 2
    );
    
    return dotProduct / (magnitudeCurrent * magnitudeHistorical);
  }
}
```

### 8. Learning Engine

**Responsibility:** Analyze historical data to identify patterns and improve suggestions

**Interface:**
```typescript
interface LearningEngine {
  analyzeCallOutcomes(): Promise<Pattern[]>;
  identifySuccessFactors(): Promise<SuccessFactor[]>;
  identifyFailureFactors(): Promise<FailureFactor[]>;
  updatePatterns(): Promise<void>;
}

interface Pattern {
  id: string;
  emotionalSignature: EmotionalMetrics;
  contextSignature: ConversationContext;
  commonOutcome: CallOutcome;
  frequency: number;
  successRate: number;
}

interface SuccessFactor {
  action: string;
  emotionalContext: EmotionalMetrics;
  successRate: number;
  sampleSize: number;
}
```

**Implementation:**
```typescript
class HistoricalLearningEngine implements LearningEngine {
  async analyzeCallOutcomes(): Promise<Pattern[]> {
    // Cluster calls by emotional patterns
    const calls = await this.getAllCalls();
    const clusters = this.clusterByEmotions(calls);
    
    // Identify patterns in each cluster
    return clusters.map(cluster => ({
      id: generateId(),
      emotionalSignature: this.averageEmotions(cluster),
      contextSignature: this.averageContext(cluster),
      commonOutcome: this.mostCommonOutcome(cluster),
      frequency: cluster.length,
      successRate: this.calculateSuccessRate(cluster)
    }));
  }
  
  async identifySuccessFactors(): Promise<SuccessFactor[]> {
    const successfulCalls = await this.db
      .from('calls')
      .select('*, conversational_turns(*), emotional_metrics(*)')
      .eq('outcome', 'successful');
    
    // Extract agent actions that preceded positive outcomes
    const actions = this.extractAgentActions(successfulCalls);
    
    // Group by emotional context
    return this.groupActionsByContext(actions);
  }
}
```

## Data Models

### Database Schema (Supabase/PostgreSQL)

**Table: calls**
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(255),
  customer_id VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  outcome VARCHAR(50), -- 'successful', 'escalated', 'unresolved', 'churn'
  overall_sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  summary TEXT,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_outcome ON calls(outcome);
CREATE INDEX idx_calls_start_time ON calls(start_time);
```

**Table: conversational_turns**
```sql
CREATE TABLE conversational_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  speaker VARCHAR(20) NOT NULL, -- 'agent' or 'customer'
  transcript TEXT NOT NULL,
  confidence FLOAT,
  timestamp_offset INTEGER, -- milliseconds from call start
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_turns_call ON conversational_turns(call_id);
CREATE INDEX idx_turns_speaker ON conversational_turns(speaker);
```

**Table: emotional_metrics**
```sql
CREATE TABLE emotional_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  turn_id UUID REFERENCES conversational_turns(id) ON DELETE CASCADE,
  timestamp_offset INTEGER,
  anger FLOAT CHECK (anger >= 0 AND anger <= 100),
  frustration FLOAT CHECK (frustration >= 0 AND frustration <= 100),
  satisfaction FLOAT CHECK (satisfaction >= 0 AND satisfaction <= 100),
  neutral FLOAT CHECK (neutral >= 0 AND neutral <= 100),
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emotions_call ON emotional_metrics(call_id);
CREATE INDEX idx_emotions_anger ON emotional_metrics(anger);
```

**Table: suggestions**
```sql
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  priority VARCHAR(20), -- 'high', 'medium', 'low'
  text TEXT NOT NULL,
  reasoning TEXT,
  historical_success_rate FLOAT,
  similar_case_ids UUID[],
  was_followed BOOLEAN,
  timestamp_offset INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suggestions_call ON suggestions(call_id);
CREATE INDEX idx_suggestions_priority ON suggestions(priority);
```

**Table: patterns**
```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type VARCHAR(50), -- 'success', 'failure', 'escalation'
  emotional_signature JSONB, -- Average emotional metrics
  context_signature JSONB, -- Common context features
  common_outcome VARCHAR(50),
  frequency INTEGER,
  success_rate FLOAT,
  sample_call_ids UUID[],
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patterns_type ON patterns(pattern_type);
CREATE INDEX idx_patterns_outcome ON patterns(common_outcome);
```

**Table: turning_points**
```sql
CREATE TABLE turning_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  timestamp_offset INTEGER,
  description TEXT,
  emotion_before JSONB,
  emotion_after JSONB,
  trigger TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_turning_points_call ON turning_points(call_id);
```

### TypeScript Data Models

```typescript
// Core domain models
interface Call {
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

enum CallOutcome {
  SUCCESSFUL = 'successful',
  ESCALATED = 'escalated',
  UNRESOLVED = 'unresolved',
  CHURN = 'churn'
}

enum Sentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

interface ConversationalTurn {
  id: string;
  callId: string;
  turnNumber: number;
  speaker: 'agent' | 'customer';
  transcript: string;
  confidence: number;
  timestampOffset: number; // milliseconds from call start
  createdAt: Date;
}

interface EmotionalMetric {
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

interface Suggestion {
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

interface Pattern {
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

interface TurningPoint {
  id: string;
  callId: string;
  timestampOffset: number;
  description: string;
  emotionBefore: EmotionalMetrics;
  emotionAfter: EmotionalMetrics;
  trigger: string;
  createdAt: Date;
}
```

### API Response Models

```typescript
// Real-time updates sent via WebSocket
interface LiveCallUpdate {
  callId: string;
  timestamp: number;
  transcript?: TranscriptSegment;
  emotions?: EmotionalMetrics;
  context?: ConversationContext;
  suggestions?: Suggestion[];
}

// Analytics dashboard data
interface CallAnalytics {
  totalCalls: number;
  successRate: number;
  averageDuration: number;
  emotionalTrends: EmotionalTrend[];
  topIssues: Issue[];
  agentPerformance: AgentMetrics[];
}

interface EmotionalTrend {
  date: string;
  avgAnger: number;
  avgFrustration: number;
  avgSatisfaction: number;
  callCount: number;
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalCalls: number;
  successRate: number;
  avgCustomerSatisfaction: number;
  avgCallDuration: number;
  strengths: string[];
  improvementAreas: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, let me analyze the acceptance criteria from the requirements document:

### Correctness Properties

Based on the prework analysis, the following properties validate the system's correctness:

**Property 1: Audio Capture Completeness**
*For any* initiated call, the Audio_Capture_Service should capture audio data from both customer and agent sources.
**Validates: Requirements 1.1**

**Property 2: Audio Streaming Reliability**
*For any* captured audio chunk, it should be successfully transmitted to the processing pipeline.
**Validates: Requirements 1.2**

**Property 3: Audio Quality Invariant**
*For any* captured audio stream, the sample rate should be at least 16kHz.
**Validates: Requirements 1.5**

**Property 4: Error Handling Continuity**
*For any* audio quality issue, the system should log a warning and continue processing without terminating the call.
**Validates: Requirements 1.4**

**Property 5: Transcription Completeness**
*For any* audio chunk sent to the Transcription_Service, a transcript segment should be generated.
**Validates: Requirements 2.1**

**Property 6: Speaker Identification**
*For any* generated transcript segment, it should include a speaker label (agent or customer).
**Validates: Requirements 2.3**

**Property 7: Low Confidence Flagging**
*For any* transcript segment with confidence below threshold, it should be flagged for review.
**Validates: Requirements 2.4**

**Property 8: Emotion Analysis Output**
*For any* audio chunk sent to the Emotion_Analyzer, emotional metrics should be generated.
**Validates: Requirements 3.1**

**Property 9: Emotion Metrics Completeness**
*For any* emotion analysis result, it should include anger, frustration, satisfaction, neutral scores, and confidence values.
**Validates: Requirements 3.2, 3.3**

**Property 10: Emotional Time Series**
*For any* call with multiple emotion readings, retrieving the emotions should return them in chronological order.
**Validates: Requirements 3.5**

**Property 11: Conversation Analysis Output**
*For any* transcript segment sent to the Conversation_Analyzer, a context analysis should be generated.
**Validates: Requirements 4.1**

**Property 12: Trajectory Classification**
*For any* conversation analysis result, it should include a trajectory classification (improving, escalating, de-escalating, or stable).
**Validates: Requirements 4.2**

**Property 13: Turning Point Detection**
*For any* call where emotional metrics change by more than 30 points, a turning point should be identified.
**Validates: Requirements 4.3**

**Property 14: Topic Extraction**
*For any* conversation analysis result, it should include a list of extracted topics.
**Validates: Requirements 4.5**

**Property 15: Data Persistence Round Trip**
*For any* conversational turn data saved to the Data_Store, retrieving it by ID should return equivalent data.
**Validates: Requirements 5.1**

**Property 16: Data Completeness**
*For any* stored call record, it should include callId, timestamp, agentId, customerId, and outcome fields.
**Validates: Requirements 5.2, 5.3**

**Property 17: Referential Integrity**
*For any* stored conversational turn or emotional metric, its referenced call ID should exist in the calls table.
**Validates: Requirements 5.4**

**Property 18: Query Filtering Correctness**
*For any* query with filters (time range, agent, emotion level), all returned results should match the filter criteria.
**Validates: Requirements 5.5**

**Property 19: Success Pattern Identification**
*For any* set of successful calls with similar emotional patterns, the Learning_Engine should identify at least one common pattern.
**Validates: Requirements 6.1**

**Property 20: Failure Pattern Identification**
*For any* set of escalated calls with similar emotional patterns, the Learning_Engine should identify at least one common failure trigger.
**Validates: Requirements 6.2, 6.5**

**Property 21: Suggestion Triggering**
*For any* call where anger or frustration exceeds 60%, the Suggestion_Engine should generate at least one suggestion.
**Validates: Requirements 7.1**

**Property 22: Suggestion Historical Context**
*For any* generated suggestion, it should reference at least one similar historical case or include reasoning based on past patterns.
**Validates: Requirements 7.2, 7.3**

**Property 23: Suggestion Delivery**
*For any* generated suggestion, it should be sent to the agent interface via WebSocket within the same call session.
**Validates: Requirements 7.4**

**Property 24: Summary Generation Completeness**
*For any* completed call, the generated summary should include key topics, emotional trajectory, and outcome.
**Validates: Requirements 8.1**

**Property 25: Summary Turning Points**
*For any* call with identified turning points, those turning points should appear in the call summary.
**Validates: Requirements 8.2**

**Property 26: Summary Agent Metrics**
*For any* call summary, it should include at least one agent performance indicator.
**Validates: Requirements 8.3**

**Property 27: Summary Persistence Round Trip**
*For any* generated call summary, storing it and retrieving it by call ID should return the same summary content.
**Validates: Requirements 8.5**

**Property 28: Success Rate Calculation**
*For any* set of calls with known outcomes, the calculated success rate should equal (successful calls / total calls).
**Validates: Requirements 9.1**

**Property 29: Emotion Aggregation**
*For any* set of calls with emotional metrics, the average emotions should be calculated correctly across all metrics.
**Validates: Requirements 9.2**

**Property 30: Call Volume Counting**
*For any* time period, the displayed call count should equal the number of calls that started in that period.
**Validates: Requirements 9.3**

**Property 31: Duration Aggregation**
*For any* set of calls with durations, the average duration should be calculated correctly.
**Validates: Requirements 9.4**

**Property 32: Dashboard Filtering**
*For any* combination of filters (date, agent, department), the dashboard should display only calls matching all filter criteria.
**Validates: Requirements 9.5**

**Property 33: Emotional Trend Accuracy**
*For any* time series of emotional metrics, the trend graph should accurately represent the data points.
**Validates: Requirements 10.1**

**Property 34: Emotion Spike Detection**
*For any* dataset where emotions exceed 2 standard deviations from the mean, those periods should be highlighted.
**Validates: Requirements 10.2**

**Property 35: Correlation Detection**
*For any* two variables with known correlation (e.g., high anger and escalation), the dashboard should identify the correlation.
**Validates: Requirements 10.3**

**Property 36: Emotional Distribution by Group**
*For any* grouping (call type, department), emotional distributions should be calculated correctly for each group.
**Validates: Requirements 10.4**

**Property 37: Drill-Down Filtering**
*For any* selected time period in the dashboard, drilling down should show only calls from that period.
**Validates: Requirements 10.5**

**Property 38: Per-Agent Metrics**
*For any* agent, their displayed metrics should be calculated only from calls where they were the agent.
**Validates: Requirements 11.1**

**Property 39: Agent Pattern Extraction**
*For any* agent with at least 5 calls, their typical emotional trajectory pattern should be identifiable.
**Validates: Requirements 11.2**

**Property 40: Agent Comparison**
*For any* agent, their performance metrics should be correctly compared against the team average.
**Validates: Requirements 11.4**

**Property 41: Agent Improvement Tracking**
*For any* agent with calls across multiple time periods, their performance trend should be calculated correctly.
**Validates: Requirements 11.5**

**Property 42: Escalation Trigger Identification**
*For any* set of escalated calls, common triggers should be extracted and ranked by frequency.
**Validates: Requirements 12.1**

**Property 43: De-escalation Technique Effectiveness**
*For any* set of successful de-escalations, techniques should be identified with their success rates calculated correctly.
**Validates: Requirements 12.2**

**Property 44: Issue Frequency Analysis**
*For any* set of calls, frequently occurring issues should be identified and ranked by occurrence count.
**Validates: Requirements 12.3**

**Property 45: Behavior-Outcome Correlation**
*For any* agent behavior that correlates with outcomes, the correlation should be detected and quantified.
**Validates: Requirements 12.4**

**Property 46: Data Persistence Reliability**
*For any* call data submitted to the Data_Store, the operation should complete successfully without throwing errors.
**Validates: Requirements 13.3**

**Property 47: System Stability**
*For any* single call processing operation, the system should complete without crashing or throwing unhandled exceptions.
**Validates: Requirements 13.5**

**Property 48: Authentication Enforcement**
*For any* unauthenticated request to the Analytics_Dashboard, access should be denied with a 401 or 403 status.
**Validates: Requirements 14.4**

**Property 49: Error Logging**
*For any* error condition in the system, an error log entry should be created.
**Validates: Requirements 15.1**

**Property 50: User-Friendly Error Messages**
*For any* error displayed to users, the message should be human-readable and not expose technical details like stack traces.
**Validates: Requirements 15.2**

**Property 51: Processing Failure Recovery**
*For any* audio processing failure, the system should log the error and provide a retry mechanism.
**Validates: Requirements 15.3**

**Property 52: API Response Validation**
*For any* API response received, the system should validate required fields before processing and handle missing fields gracefully.
**Validates: Requirements 15.4**

**Property 53: UI Error State Display**
*For any* data fetch failure in the dashboard, a loading state or error message should be displayed to the user.
**Validates: Requirements 15.5**

## Error Handling

### Error Categories

**1. Audio Capture Errors**
- Microphone permission denied
- Audio device not available
- Screen capture API not supported
- WebRTC connection failure

**Handling Strategy:**
```typescript
class AudioCaptureErrorHandler {
  handleError(error: AudioCaptureError): void {
    switch (error.type) {
      case 'PERMISSION_DENIED':
        this.showUserMessage('Please allow microphone access to continue');
        this.logError(error);
        break;
      
      case 'DEVICE_NOT_AVAILABLE':
        this.showUserMessage('No audio device found. Please check your setup');
        this.fallbackToUploadMode();
        break;
      
      case 'WEBRTC_FAILURE':
        this.logError(error);
        this.attemptReconnect();
        break;
      
      default:
        this.logError(error);
        this.fallbackToUploadMode();
    }
  }
}
```

**2. API Errors**
- Rate limit exceeded
- API timeout
- Invalid API response
- Authentication failure

**Handling Strategy:**
```typescript
class APIErrorHandler {
  async handleAPIError(error: APIError, context: string): Promise<void> {
    if (error.status === 429) {
      // Rate limit - implement exponential backoff
      await this.exponentialBackoff(error.retryAfter);
      return this.retryRequest(context);
    }
    
    if (error.status === 401 || error.status === 403) {
      // Auth error - refresh token or prompt re-login
      await this.refreshAuthentication();
      return this.retryRequest(context);
    }
    
    if (error.isTimeout) {
      // Timeout - retry with longer timeout
      return this.retryWithTimeout(context, error.timeout * 2);
    }
    
    // Log and show user-friendly message
    this.logError(error, context);
    this.showUserMessage('Unable to process request. Please try again.');
  }
}
```

**3. Data Storage Errors**
- Database connection failure
- Constraint violation
- Disk space exhausted
- Transaction timeout

**Handling Strategy:**
```typescript
class DataStorageErrorHandler {
  async handleStorageError(error: StorageError): Promise<void> {
    if (error.type === 'CONNECTION_FAILURE') {
      // Retry with exponential backoff
      await this.retryConnection();
    }
    
    if (error.type === 'CONSTRAINT_VIOLATION') {
      // Log data issue and continue
      this.logDataIssue(error);
      return; // Don't crash, just log
    }
    
    if (error.type === 'TRANSACTION_TIMEOUT') {
      // Break into smaller transactions
      await this.retryWithSmallerBatch(error.data);
    }
    
    // For critical errors, alert admin
    if (error.isCritical) {
      this.alertAdministrator(error);
    }
  }
}
```

**4. Processing Errors**
- Emotion analysis failure
- Transcription failure
- LLM timeout
- Invalid audio format

**Handling Strategy:**
```typescript
class ProcessingErrorHandler {
  async handleProcessingError(
    error: ProcessingError,
    callId: string
  ): Promise<void> {
    // Log error with context
    this.logError(error, { callId, stage: error.stage });
    
    // Continue with partial results
    if (error.stage === 'EMOTION_ANALYSIS') {
      // Use default neutral emotions
      await this.useDefaultEmotions(callId);
    }
    
    if (error.stage === 'TRANSCRIPTION') {
      // Mark as transcription failed, continue with emotion analysis
      await this.markTranscriptionFailed(callId);
    }
    
    // Notify agent of degraded functionality
    this.notifyAgent(callId, 'Some features temporarily unavailable');
  }
}
```

### Graceful Degradation Strategy

**Level 1: Full Functionality**
- Live audio capture
- Real-time emotion analysis
- Real-time transcription
- Live suggestions

**Level 2: Degraded Real-Time**
- Live audio capture
- Delayed emotion analysis (batch processing)
- Delayed transcription
- Suggestions based on cached patterns

**Level 3: Upload Mode**
- No live capture
- Upload recorded audio
- Post-call analysis
- Historical insights only

**Level 4: View-Only Mode**
- No audio processing
- View historical data
- Analytics dashboard only

```typescript
class GracefulDegradationManager {
  private currentLevel: DegradationLevel = 'FULL';
  
  async checkSystemHealth(): Promise<void> {
    const health = await this.assessHealth();
    
    if (!health.audioCapture) {
      this.degradeToLevel('UPLOAD_MODE');
    } else if (!health.realtimeAPIs) {
      this.degradeToLevel('DEGRADED_REALTIME');
    } else if (!health.database) {
      this.degradeToLevel('VIEW_ONLY');
    } else {
      this.restoreToLevel('FULL');
    }
  }
  
  private degradeToLevel(level: DegradationLevel): void {
    this.currentLevel = level;
    this.notifyUsers(`System operating in ${level} mode`);
    this.disableUnavailableFeatures(level);
  }
}
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:** Validate specific examples, edge cases, and integration points
**Property Tests:** Validate universal properties across randomized inputs

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: call-monitoring-emotion-intelligence, Property {N}: {property_text}`

### Testing Layers

**1. Component Unit Tests**

Test individual components with specific examples:

```typescript
describe('EmotionAnalyzer', () => {
  it('should return emotions for valid audio', async () => {
    const analyzer = new HumeEmotionAnalyzer(apiKey);
    const audio = loadTestAudio('sample.wav');
    
    const result = await analyzer.analyze(audio);
    
    expect(result).toHaveProperty('anger');
    expect(result).toHaveProperty('frustration');
    expect(result).toHaveProperty('satisfaction');
    expect(result.confidence).toBeGreaterThan(0);
  });
  
  it('should handle empty audio gracefully', async () => {
    const analyzer = new HumeEmotionAnalyzer(apiKey);
    const emptyAudio = Buffer.alloc(0);
    
    await expect(analyzer.analyze(emptyAudio))
      .rejects.toThrow('Invalid audio');
  });
});
```

**2. Property-Based Tests**

Test universal properties with randomized inputs:

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  // Feature: call-monitoring-emotion-intelligence, Property 15: Data Persistence Round Trip
  it('should persist and retrieve conversational turns correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          callId: fc.uuid(),
          turnNumber: fc.integer({ min: 1, max: 100 }),
          speaker: fc.constantFrom('agent', 'customer'),
          transcript: fc.string({ minLength: 1, maxLength: 500 }),
          confidence: fc.float({ min: 0, max: 1 })
        }),
        async (turn) => {
          // Save turn
          const saved = await dataStore.saveConversationalTurn(turn);
          
          // Retrieve turn
          const retrieved = await dataStore.getConversationalTurn(saved.id);
          
          // Verify equivalence
          expect(retrieved.callId).toBe(turn.callId);
          expect(retrieved.transcript).toBe(turn.transcript);
          expect(retrieved.speaker).toBe(turn.speaker);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: call-monitoring-emotion-intelligence, Property 18: Query Filtering Correctness
  it('should filter calls correctly by emotion level', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            emotions: fc.record({
              anger: fc.float({ min: 0, max: 100 }),
              frustration: fc.float({ min: 0, max: 100 })
            })
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.float({ min: 0, max: 100 }),
        async (calls, threshold) => {
          // Save all calls
          await Promise.all(calls.map(c => dataStore.saveCall(c)));
          
          // Query with filter
          const filtered = await dataStore.queryCalls({
            minAnger: threshold
          });
          
          // Verify all results match filter
          filtered.forEach(call => {
            expect(call.emotions.anger).toBeGreaterThanOrEqual(threshold);
          });
          
          // Verify no matching calls were excluded
          const expectedCount = calls.filter(
            c => c.emotions.anger >= threshold
          ).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: call-monitoring-emotion-intelligence, Property 28: Success Rate Calculation
  it('should calculate success rate correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            outcome: fc.constantFrom('successful', 'escalated', 'unresolved')
          }),
          { minLength: 1, maxLength: 100 }
        ),
        async (calls) => {
          const successfulCount = calls.filter(
            c => c.outcome === 'successful'
          ).length;
          const expectedRate = successfulCount / calls.length;
          
          const calculatedRate = await analytics.calculateSuccessRate(calls);
          
          expect(calculatedRate).toBeCloseTo(expectedRate, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**3. Integration Tests**

Test end-to-end flows:

```typescript
describe('End-to-End Call Processing', () => {
  it('should process a complete call from audio to summary', async () => {
    // Start call
    const callId = await callMonitor.startCall('agent-1', 'customer-1');
    
    // Send audio chunks
    const audioChunks = loadTestAudioChunks('conversation.wav');
    for (const chunk of audioChunks) {
      await callMonitor.processAudioChunk(callId, chunk);
    }
    
    // End call
    await callMonitor.endCall(callId);
    
    // Verify complete data
    const call = await dataStore.getCall(callId);
    expect(call.summary).toBeDefined();
    expect(call.outcome).toBeDefined();
    
    const turns = await dataStore.getConversationalTurns(callId);
    expect(turns.length).toBeGreaterThan(0);
    
    const emotions = await dataStore.getEmotionalMetrics(callId);
    expect(emotions.length).toBeGreaterThan(0);
  });
});
```

### Test Coverage Goals

- Unit test coverage: >80% of business logic
- Property test coverage: All 53 correctness properties
- Integration test coverage: All major user flows
- Edge case coverage: Empty inputs, malformed data, API failures

### Continuous Testing

```typescript
// Run tests before each commit
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm run test:all"
    }
  },
  "scripts": {
    "test:unit": "jest --testPathPattern=unit",
    "test:property": "jest --testPathPattern=property --maxWorkers=4",
    "test:integration": "jest --testPathPattern=integration",
    "test:all": "npm run test:unit && npm run test:property && npm run test:integration"
  }
}
```

## Summary

This design provides a comprehensive architecture for an AI-powered call monitoring system with the following key characteristics:

**Architecture:** Microservices-inspired with clear separation between audio capture, AI processing, data storage, and visualization layers.

**Audio Capture:** Google Meet integration via Screen Capture API with fallback to upload mode for reliability.

**AI Processing:** Parallel processing pipeline using Hume AI for emotions, Deepgram for transcription, and Gemini for conversation analysis.

**Learning System:** Pattern-based suggestion engine that learns from historical calls to provide real-time recommendations.

**Data Model:** Structured PostgreSQL schema in Supabase with tables for calls, turns, emotions, suggestions, and patterns.

**Error Handling:** Four-level graceful degradation strategy ensuring the system remains functional even when components fail.

**Testing:** Dual approach with 53 property-based tests for universal correctness and unit tests for specific scenarios.

**MVP Focus:** Designed for hackathon demonstration with 2-3 concurrent calls, basic security, and upload fallback mode.

The system balances ambitious features (real-time emotion detection, intelligent suggestions) with practical constraints (free tier APIs, hackathon timeline) through careful architectural decisions and graceful degradation strategies.
