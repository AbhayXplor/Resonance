import { conversationalTurnsRepository } from '@/lib/database';
import { TranscriptSegment } from '@/types';

export class TranscriptionStorageService {
  /**
   * Store transcription results in database
   */
  async storeTranscripts(
    callId: string,
    segments: TranscriptSegment[]
  ): Promise<void> {
    try {
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        await conversationalTurnsRepository.create({
          callId,
          turnNumber: i + 1,
          speaker: segment.speaker,
          transcript: segment.text,
          confidence: segment.confidence,
          timestampOffset: Math.floor(segment.timestamp),
        });
      }
    } catch (error) {
      console.error('Failed to store transcripts:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to store transcripts'
      );
    }
  }

  /**
   * Flag low confidence transcripts for review
   */
  async flagLowConfidence(
    callId: string,
    threshold = 0.7
  ): Promise<string[]> {
    try {
      const turns = await conversationalTurnsRepository.getByCallId(callId);
      
      const lowConfidenceTurns = turns
        .filter(turn => turn.confidence < threshold)
        .map(turn => turn.id);

      // In a real implementation, you might want to store these flags
      // in a separate table or add a flag column to conversational_turns
      
      return lowConfidenceTurns;
    } catch (error) {
      console.error('Failed to flag low confidence transcripts:', error);
      return [];
    }
  }
}

export const transcriptionStorageService = new TranscriptionStorageService();
