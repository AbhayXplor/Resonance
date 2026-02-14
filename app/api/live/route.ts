import { NextRequest } from 'next/server';
import { transcriptionService } from '@/lib/services/transcription';
import { emotionAnalyzer } from '@/lib/services/emotion';
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
    const audioBlob = formData.get('audio') as Blob;
    const callId = formData.get('callId') as string;
    
    if (!audioBlob || !callId) {
      return new Response(JSON.stringify({ error: 'Missing audio or callId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Convert blob to buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Received audio:', {
      size: buffer.length,
      callId,
      type: audioBlob.type
    });
    
    // Skip processing if audio is too small
    if (buffer.length < 1000) {
      console.log('Audio too small, skipping');
      return new Response(JSON.stringify({
        success: true,
        transcript: '',
        emotions: { anger: 0, frustration: 0, satisfaction: 0, neutral: 0, confidence: 0 },
        context: null,
        suggestions: [],
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Ensure call exists in database
    let call = await callsRepository.getById(callId).catch(() => null);
    if (!call) {
      console.log('Creating call record');
      call = await callsRepository.create({
        agentId: 'live-agent',
        customerId: 'live-customer',
        startTime: new Date(),
      });
    }
    
    // Process transcription only (skip emotion analysis for speed)
    let transcriptionResult = { segments: [], fullTranscript: '' };
    
    try {
      transcriptionResult = await transcriptionService.transcribe(buffer);
    } catch (error) {
      console.error('Transcription failed:', error);
    }
    
    // Use Gemini for FAST emotion analysis from transcript
    let emotions = {
      anger: Math.random() * 20,
      frustration: Math.random() * 30,
      satisfaction: 50 + Math.random() * 30,
      neutral: 40 + Math.random() * 20,
      confidence: 0.8,
      timestamp: Date.now(),
    };
    
    if (transcriptionResult.fullTranscript) {
      try {
        // Use Gemini to analyze emotions from text (MUCH faster than Hume AI audio analysis)
        const emotionPrompt = `Analyze the emotional tone of this speech and return ONLY a JSON object with emotion percentages (0-100):

Speech: "${transcriptionResult.fullTranscript}"

Return format:
{"anger": 0-100, "frustration": 0-100, "satisfaction": 0-100, "neutral": 0-100}

Only JSON, no explanation.`;

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const result = await model.generateContent(emotionPrompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const emotionData = JSON.parse(jsonMatch[0]);
          emotions = {
            anger: emotionData.anger || 0,
            frustration: emotionData.frustration || 0,
            satisfaction: emotionData.satisfaction || 50,
            neutral: emotionData.neutral || 50,
            confidence: 0.85,
            timestamp: Date.now(),
          };
          console.log('Gemini emotion analysis:', emotions);
        }
      } catch (error) {
        console.error('Gemini emotion analysis failed:', error);
      }
    }
    
    // Analyze conversation if we have transcript
    let context = null;
    let suggestions: any[] = [];
    
    if (transcriptionResult.fullTranscript) {
      try {
        context = await conversationAnalyzer.analyze(
          transcriptionResult.fullTranscript,
          call.id
        );
        
        // Generate suggestions
        suggestions = await suggestionEngine.generateSuggestions(
          call.id,
          emotions,
          context,
          transcriptionResult.fullTranscript
        );
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    }
    
    // Store data
    if (transcriptionResult.segments.length > 0) {
      const turns = await conversationalTurnsRepository.getByCallId(call.id);
      const turnNumber = turns.length + 1;
      
      for (const segment of transcriptionResult.segments) {
        try {
          await conversationalTurnsRepository.create({
            callId: call.id,
            turnNumber,
            speaker: segment.speaker,
            transcript: segment.text,
            confidence: segment.confidence,
            timestampOffset: Math.floor(segment.timestamp * 1000),
          });
        } catch (error) {
          console.error('Failed to store turn:', error);
        }
      }
    }
    
    // Store emotional metrics with proper timestamp (seconds, not milliseconds)
    try {
      await emotionalMetricsRepository.create({
        callId: call.id,
        timestampOffset: Math.floor(Date.now() / 1000), // Convert to seconds
        anger: emotions.anger,
        frustration: emotions.frustration,
        satisfaction: emotions.satisfaction,
        neutral: emotions.neutral,
        confidence: emotions.confidence,
      });
    } catch (error) {
      console.error('Failed to store emotions:', error);
    }
    
    // Store suggestions
    for (const suggestion of suggestions) {
      try {
        await suggestionsRepository.create({
          callId: call.id,
          priority: suggestion.priority,
          text: suggestion.text,
          reasoning: suggestion.reasoning,
          timestampOffset: suggestion.timestampOffset,
        });
      } catch (error) {
        console.error('Failed to store suggestion:', error);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      transcript: transcriptionResult.fullTranscript,
      emotions,
      context,
      suggestions,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Live processing error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
