import { NextRequest, NextResponse } from 'next/server';
import { transcriptionService } from '@/lib/services/transcription';
import { emotionAnalyzer } from '@/lib/services/emotion';
import { summaryGenerator } from '@/lib/services/summary';
import { suggestionEngine } from '@/lib/services/suggestions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationContext } from '@/types';
import { callsRepository, conversationalTurnsRepository, emotionalMetricsRepository, suggestionsRepository } from '@/lib/database';

// Inline conversation analyzer to avoid export issues
class ConversationAnalyzer {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  private getModel() {
    if (!this.model) {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GEMINI_API_KEY is not set');
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      });
    }
    return this.model;
  }
  
  async analyze(transcript: string, callId: string): Promise<ConversationContext> {
    try {
      const model = this.getModel();
      const prompt = `
Analyze this customer support conversation and provide a JSON response.

Current segment: ${transcript}

Provide analysis in this exact JSON format:
{
  "trajectory": "improving" | "escalating" | "de-escalating" | "stable",
  "topics": ["topic1", "topic2"],
  "intent": "brief description of customer intent",
  "sentiment": "positive" | "negative" | "neutral",
  "urgency": 0-100
}

Only respond with valid JSON, no additional text.
`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const context = JSON.parse(jsonMatch[0]);
      
      if (!context.trajectory || !context.topics || !context.intent || !context.sentiment || context.urgency === undefined) {
        throw new Error('Invalid conversation context format');
      }
      
      return context as ConversationContext;
    } catch (error) {
      console.error('Conversation analysis error:', error);
      throw new Error(`Failed to analyze conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const conversationAnalyzer = new ConversationAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Create call record
    const call = await callsRepository.create({
      agentId: 'demo-agent',
      customerId: 'demo-customer',
      startTime: new Date(),
    });
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process in parallel
    const [transcriptionResult, emotions] = await Promise.all([
      transcriptionService.transcribe(buffer),
      emotionAnalyzer.analyze(buffer),
    ]);
    
    // Store transcription segments
    for (let i = 0; i < transcriptionResult.segments.length; i++) {
      const segment = transcriptionResult.segments[i];
      await conversationalTurnsRepository.create({
        callId: call.id,
        turnNumber: i + 1,
        speaker: segment.speaker,
        transcript: segment.text,
        confidence: segment.confidence,
        timestampOffset: Math.floor(segment.timestamp * 1000),
      });
    }
    
    // Store emotional metrics
    await emotionalMetricsRepository.create({
      callId: call.id,
      timestampOffset: 0,
      anger: emotions.anger,
      frustration: emotions.frustration,
      satisfaction: emotions.satisfaction,
      neutral: emotions.neutral,
      confidence: emotions.confidence,
    });
    
    // Analyze conversation
    const context = await conversationAnalyzer.analyze(
      transcriptionResult.fullTranscript,
      call.id
    );
    
    // Generate call summary
    const emotionalMetrics = await emotionalMetricsRepository.getByCallId(call.id);
    const summary = await summaryGenerator.generateSummary(
      call,
      await conversationalTurnsRepository.getByCallId(call.id),
      emotionalMetrics
    );
    
    // Generate suggestions
    const suggestions = await suggestionEngine.generateSuggestions(
      call.id,
      emotions,
      context,
      transcriptionResult.fullTranscript
    );
    
    // Store suggestions
    for (const suggestion of suggestions) {
      await suggestionsRepository.create({
        callId: call.id,
        priority: suggestion.priority,
        text: suggestion.text,
        reasoning: suggestion.reasoning,
        timestampOffset: suggestion.timestampOffset,
      });
    }
    
    // Update call with results
    await callsRepository.update(call.id, {
      endTime: new Date(),
      durationSeconds: Math.floor((Date.now() - call.startTime.getTime()) / 1000),
      overallSentiment: context.sentiment as any,
      summary: summary.overview,
    });
    
    return NextResponse.json({
      success: true,
      callId: call.id,
      transcript: transcriptionResult.fullTranscript,
      emotions,
      context,
      summary,
      suggestions,
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
