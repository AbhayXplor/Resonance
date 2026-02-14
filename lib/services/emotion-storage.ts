import { emotionalMetricsRepository } from '@/lib/database';
import { EmotionalMetrics } from '@/types';

export class EmotionStorageService {
  /**
   * Store emotional metrics in database
   */
  async storeEmotions(
    callId: string,
    emotions: EmotionalMetrics,
    turnId?: string,
    timestampOffset?: number
  ): Promise<void> {
    try {
      await emotionalMetricsRepository.create({
        callId,
        turnId,
        timestampOffset: timestampOffset || 0,
        anger: emotions.anger,
        frustration: emotions.frustration,
        satisfaction: emotions.satisfaction,
        neutral: emotions.neutral,
        confidence: emotions.confidence,
      });
    } catch (error) {
      console.error('Failed to store emotions:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to store emotions'
      );
    }
  }

  /**
   * Get emotional timeline for a call
   */
  async getEmotionalTimeline(callId: string): Promise<EmotionalMetrics[]> {
    try {
      const metrics = await emotionalMetricsRepository.getByCallId(callId);
      
      return metrics.map(metric => ({
        anger: metric.anger,
        frustration: metric.frustration,
        satisfaction: metric.satisfaction,
        neutral: metric.neutral,
        confidence: metric.confidence,
        timestamp: metric.timestampOffset,
      }));
    } catch (error) {
      console.error('Failed to get emotional timeline:', error);
      return [];
    }
  }

  /**
   * Calculate average emotions for a call
   */
  async getAverageEmotions(callId: string): Promise<EmotionalMetrics | null> {
    try {
      const metrics = await emotionalMetricsRepository.getByCallId(callId);
      
      if (metrics.length === 0) return null;

      const sum = metrics.reduce(
        (acc, metric) => ({
          anger: acc.anger + metric.anger,
          frustration: acc.frustration + metric.frustration,
          satisfaction: acc.satisfaction + metric.satisfaction,
          neutral: acc.neutral + metric.neutral,
          confidence: acc.confidence + metric.confidence,
        }),
        { anger: 0, frustration: 0, satisfaction: 0, neutral: 0, confidence: 0 }
      );

      const count = metrics.length;

      return {
        anger: sum.anger / count,
        frustration: sum.frustration / count,
        satisfaction: sum.satisfaction / count,
        neutral: sum.neutral / count,
        confidence: sum.confidence / count,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to calculate average emotions:', error);
      return null;
    }
  }
}

export const emotionStorageService = new EmotionStorageService();
