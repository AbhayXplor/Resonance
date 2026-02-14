import { supabase, getServiceSupabase } from '../supabase';
import { EmotionalMetric, EmotionalMetrics } from '@/types';

export interface CreateEmotionalMetricData {
  callId: string;
  turnId?: string;
  timestampOffset: number;
  anger: number;
  frustration: number;
  satisfaction: number;
  neutral: number;
  confidence: number;
}

export class EmotionalMetricsRepository {
  async create(data: CreateEmotionalMetricData): Promise<EmotionalMetric> {
    const serviceSupabase = getServiceSupabase();
    
    const { data: metric, error } = await serviceSupabase
      .from('emotional_metrics')
      .insert({
        call_id: data.callId,
        turn_id: data.turnId,
        timestamp_offset: data.timestampOffset,
        anger: data.anger,
        frustration: data.frustration,
        satisfaction: data.satisfaction,
        neutral: data.neutral,
        confidence: data.confidence,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create emotional metric: ${error.message}`);
    return this.mapToMetric(metric);
  }

  async getById(id: string): Promise<EmotionalMetric | null> {
    const { data, error } = await supabase
      .from('emotional_metrics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get emotional metric: ${error.message}`);
    }

    return this.mapToMetric(data);
  }

  async getByCallId(callId: string): Promise<EmotionalMetric[]> {
    const { data, error } = await supabase
      .from('emotional_metrics')
      .select('*')
      .eq('call_id', callId)
      .order('timestamp_offset', { ascending: true });

    if (error) throw new Error(`Failed to get emotional metrics: ${error.message}`);
    return data.map(this.mapToMetric);
  }

  async delete(id: string): Promise<void> {
    const serviceSupabase = getServiceSupabase();
    
    const { error } = await serviceSupabase
      .from('emotional_metrics')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete emotional metric: ${error.message}`);
  }

  private mapToMetric(data: any): EmotionalMetric {
    return {
      id: data.id,
      callId: data.call_id,
      turnId: data.turn_id,
      timestampOffset: data.timestamp_offset,
      anger: data.anger,
      frustration: data.frustration,
      satisfaction: data.satisfaction,
      neutral: data.neutral,
      confidence: data.confidence,
      createdAt: new Date(data.created_at),
    };
  }
}

export const emotionalMetricsRepository = new EmotionalMetricsRepository();
