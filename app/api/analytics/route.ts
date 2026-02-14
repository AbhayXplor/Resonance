import { NextResponse } from 'next/server';
import { callsRepository } from '@/lib/database';

export async function GET() {
  try {
    const calls = await callsRepository.list({}, 100);
    
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.outcome === 'successful').length;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    
    // Calculate average satisfaction (mock for now)
    const avgSatisfaction = 75;
    
    return NextResponse.json({
      totalCalls,
      successRate: Math.round(successRate),
      avgSatisfaction,
      recentCalls: calls.slice(0, 10),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
