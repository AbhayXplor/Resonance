import Groq from 'groq-sdk';
import { TranscriptSegment } from '@/types';

export interface TranscriptionResult {
  segments: TranscriptSegment[];
  fullTranscript: string;
}

export class TranscriptionService {
  private groq: Groq | null = null;
  
  constructor() {
    // Lazy initialization
  }
  
  private getClient() {
    if (!this.groq) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set');
      }
      this.groq = new Groq({ apiKey });
    }
    return this.groq;
  }
  
  async transcribe(audioBuffer: Buffer): Promise<TranscriptionResult> {
    try {
      const groq = this.getClient();
      
      console.log('Transcribing with Groq Whisper:', audioBuffer.length, 'bytes');
      
      // Convert Buffer to Uint8Array for Blob constructor
      const uint8Array = new Uint8Array(audioBuffer);
      const audioBlob = new Blob([uint8Array], { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'json',
        language: 'en',
      });
      
      console.log('Groq transcription result:', transcription);
      
      const fullTranscript = transcription.text || '';
      
      // Groq doesn't provide speaker diarization, so we'll treat all as customer
      const segments: TranscriptSegment[] = [];
      
      if (fullTranscript) {
        // If no segments, create one segment with full transcript
        segments.push({
          text: fullTranscript,
          confidence: 0.9,
          speaker: 'customer',
          timestamp: 0,
          isFinal: true,
        });
      }
      
      console.log('Transcription successful:', {
        segments: segments.length,
        transcript: fullTranscript.substring(0, 100)
      });
      
      return {
        segments,
        fullTranscript,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      // Return empty result instead of throwing
      return { segments: [], fullTranscript: '' };
    }
  }
  
  async transcribeFromFile(file: File): Promise<TranscriptionResult> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return this.transcribe(buffer);
  }
  
  identifySpeaker(segment: TranscriptSegment): 'agent' | 'customer' {
    return segment.speaker;
  }
  
  flagLowConfidence(segment: TranscriptSegment, threshold: number = 0.7): boolean {
    return segment.confidence < threshold;
  }
}

export const transcriptionService = new TranscriptionService();
