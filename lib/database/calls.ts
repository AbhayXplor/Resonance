import { supabase, getServiceSupabase } from '../supabase';
import { Call, CallOutcome, Sentiment } from '@/types';

export interface CreateCallData {
  agentId: string;
  customerId: string;
  startTime: Date;
}

export interface UpdateCallData {
  endTime?: Date;
  durationSeconds?: number;
  outcome?: CallOutcome;
  overallSentiment?: Sentiment;
  summary?: string;
  recordingUrl?: string;
}

export interface CallFilters {
  agentId?: string;
  customerId?: string;
  outcome?: CallOutcome;
  startTimeFrom?: Date;
  startTimeTo?: Date;
}

export class CallsRepository {
  async create(data: CreateCallData): Promise<Call> {
    const serviceSupabase = getServiceSupabase();
    
    const { data: call, error } = await serviceSupabase
      .from('calls')
      .insert({
        agent_id: data.agentId,
        customer_id: data.customerId,
        start_time: data.startTime.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create call: ${error.message}`);
    return this.mapToCall(call);
  }

  async getById(id: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get call: ${error.message}`);
    }

    return this.mapToCall(data);
  }

  async update(id: string, data: UpdateCallData): Promise<Call> {
    const serviceSupabase = getServiceSupabase();
    
    const updateData: any = {};
    if (data.endTime) updateData.end_time = data.endTime.toISOString();
    if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds;
    if (data.outcome) updateData.outcome = data.outcome;
    if (data.overallSentiment) updateData.overall_sentiment = data.overallSentiment;
    if (data.summary) updateData.summary = data.summary;
    if (data.recordingUrl) updateData.recording_url = data.recordingUrl;

    const { data: call, error } = await serviceSupabase
      .from('calls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update call: ${error.message}`);
    return this.mapToCall(call);
  }

  async list(filters?: CallFilters, limit = 100): Promise<Call[]> {
    let query = supabase.from('calls').select('*');

    if (filters?.agentId) query = query.eq('agent_id', filters.agentId);
    if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters?.outcome) query = query.eq('outcome', filters.outcome);
    if (filters?.startTimeFrom) query = query.gte('start_time', filters.startTimeFrom.toISOString());
    if (filters?.startTimeTo) query = query.lte('start_time', filters.startTimeTo.toISOString());

    query = query.order('start_time', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(`Failed to list calls: ${error.message}`);
    return data.map(this.mapToCall);
  }

  async delete(id: string): Promise<void> {
    const serviceSupabase = getServiceSupabase();
    
    const { error } = await serviceSupabase
      .from('calls')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete call: ${error.message}`);
  }

  private mapToCall(data: any): Call {
    return {
      id: data.id,
      agentId: data.agent_id,
      customerId: data.customer_id,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      durationSeconds: data.duration_seconds,
      outcome: data.outcome as CallOutcome,
      overallSentiment: data.overall_sentiment as Sentiment,
      summary: data.summary,
      recordingUrl: data.recording_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const callsRepository = new CallsRepository();
