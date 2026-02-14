import { supabase, getServiceSupabase } from '../supabase';
import { ConversationalTurn } from '@/types';

export interface CreateTurnData {
  callId: string;
  turnNumber: number;
  speaker: 'agent' | 'customer';
  transcript: string;
  confidence: number;
  timestampOffset: number;
}

export class ConversationalTurnsRepository {
  async create(data: CreateTurnData): Promise<ConversationalTurn> {
    const serviceSupabase = getServiceSupabase();
    
    const { data: turn, error } = await serviceSupabase
      .from('conversational_turns')
      .insert({
        call_id: data.callId,
        turn_number: data.turnNumber,
        speaker: data.speaker,
        transcript: data.transcript,
        confidence: data.confidence,
        timestamp_offset: data.timestampOffset,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create turn: ${error.message}`);
    return this.mapToTurn(turn);
  }

  async getById(id: string): Promise<ConversationalTurn | null> {
    const { data, error } = await supabase
      .from('conversational_turns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get turn: ${error.message}`);
    }

    return this.mapToTurn(data);
  }

  async getByCallId(callId: string): Promise<ConversationalTurn[]> {
    const { data, error } = await supabase
      .from('conversational_turns')
      .select('*')
      .eq('call_id', callId)
      .order('turn_number', { ascending: true });

    if (error) throw new Error(`Failed to get turns: ${error.message}`);
    return data.map(this.mapToTurn);
  }

  async delete(id: string): Promise<void> {
    const serviceSupabase = getServiceSupabase();
    
    const { error } = await serviceSupabase
      .from('conversational_turns')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete turn: ${error.message}`);
  }

  private mapToTurn(data: any): ConversationalTurn {
    return {
      id: data.id,
      callId: data.call_id,
      turnNumber: data.turn_number,
      speaker: data.speaker,
      transcript: data.transcript,
      confidence: data.confidence,
      timestampOffset: data.timestamp_offset,
      createdAt: new Date(data.created_at),
    };
  }
}

export const conversationalTurnsRepository = new ConversationalTurnsRepository();
