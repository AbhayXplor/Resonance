import { supabase, getServiceSupabase } from '../supabase';
import { Suggestion } from '@/types';

export interface CreateSuggestionData {
  callId: string;
  priority: 'high' | 'medium' | 'low';
  text: string;
  reasoning: string;
  historicalSuccessRate?: number;
  similarCaseIds?: string[];
  timestampOffset: number;
}

export interface UpdateSuggestionData {
  wasFollowed?: boolean;
}

export class SuggestionsRepository {
  async create(data: CreateSuggestionData): Promise<Suggestion> {
    const serviceSupabase = getServiceSupabase();
    
    const { data: suggestion, error } = await serviceSupabase
      .from('suggestions')
      .insert({
        call_id: data.callId,
        priority: data.priority,
        text: data.text,
        reasoning: data.reasoning,
        historical_success_rate: data.historicalSuccessRate,
        similar_case_ids: data.similarCaseIds,
        timestamp_offset: data.timestampOffset,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create suggestion: ${error.message}`);
    return this.mapToSuggestion(suggestion);
  }

  async getById(id: string): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get suggestion: ${error.message}`);
    }

    return this.mapToSuggestion(data);
  }

  async getByCallId(callId: string): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('call_id', callId)
      .order('timestamp_offset', { ascending: true });

    if (error) throw new Error(`Failed to get suggestions: ${error.message}`);
    return data.map(this.mapToSuggestion);
  }

  async update(id: string, data: UpdateSuggestionData): Promise<Suggestion> {
    const serviceSupabase = getServiceSupabase();
    
    const { data: suggestion, error } = await serviceSupabase
      .from('suggestions')
      .update({
        was_followed: data.wasFollowed,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update suggestion: ${error.message}`);
    return this.mapToSuggestion(suggestion);
  }

  async delete(id: string): Promise<void> {
    const serviceSupabase = getServiceSupabase();
    
    const { error } = await serviceSupabase
      .from('suggestions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete suggestion: ${error.message}`);
  }

  private mapToSuggestion(data: any): Suggestion {
    return {
      id: data.id,
      callId: data.call_id,
      priority: data.priority,
      text: data.text,
      reasoning: data.reasoning,
      historicalSuccessRate: data.historical_success_rate,
      similarCaseIds: data.similar_case_ids,
      wasFollowed: data.was_followed,
      timestampOffset: data.timestamp_offset,
      createdAt: new Date(data.created_at),
    };
  }
}

export const suggestionsRepository = new SuggestionsRepository();
