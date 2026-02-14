import { callsRepository } from '@/lib/database/calls';
import { CallOutcome, Sentiment } from '@/types';

describe('Database Operations', () => {
  it('should create and retrieve a call', async () => {
    const callData = {
      agentId: 'test-agent',
      customerId: 'test-customer',
      startTime: new Date(),
    };
    
    const call = await callsRepository.create(callData);
    
    expect(call.id).toBeDefined();
    expect(call.agentId).toBe(callData.agentId);
    expect(call.customerId).toBe(callData.customerId);
    
    const retrieved = await callsRepository.getById(call.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(call.id);
  });
  
  it('should update call with outcome', async () => {
    const call = await callsRepository.create({
      agentId: 'test-agent',
      customerId: 'test-customer',
      startTime: new Date(),
    });
    
    const updated = await callsRepository.update(call.id, {
      outcome: CallOutcome.SUCCESSFUL,
      overallSentiment: Sentiment.POSITIVE,
    });
    
    expect(updated.outcome).toBe(CallOutcome.SUCCESSFUL);
    expect(updated.overallSentiment).toBe(Sentiment.POSITIVE);
  });
});
