import { GoogleGenerativeAI } from '@google/generative-ai';
import { Call, ConversationalTurn, EmotionalMetric, TurningPoint } from '@/types';

export interface CallSummary {
  overview: string;
  keyTopics: string[];
  emotionalTrajectory: string;
  criticalMoments: string[];
  outcome: string;
  agentPerformance: {
    strengths: string[];
    improvements: string[];
  };
  recommendations: string[];
}

export class SummaryGenerator {
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
  
  async generateSummary(
    call: Call,
    turns: ConversationalTurn[],
    emotions: EmotionalMetric[],
    turningPoints?: TurningPoint[]
  ): Promise<CallSummary> {
    const model = this.getModel();
    
    // Build conversation transcript
    const transcript = turns.map(t => 
      `[${t.speaker.toUpperCase()}]: ${t.transcript}`
    ).join('\n');
    
    // Calculate emotion averages
    const avgEmotions = this.calculateAverageEmotions(emotions);
    
    const prompt = `
Analyze this customer support call and generate a comprehensive summary.

CALL DETAILS:
- Duration: ${call.durationSeconds || 0} seconds
- Outcome: ${call.outcome || 'unknown'}
- Overall Sentiment: ${call.overallSentiment || 'unknown'}

TRANSCRIPT:
${transcript}

EMOTIONAL METRICS:
- Average Anger: ${avgEmotions.anger.toFixed(0)}%
- Average Frustration: ${avgEmotions.frustration.toFixed(0)}%
- Average Satisfaction: ${avgEmotions.satisfaction.toFixed(0)}%

${turningPoints && turningPoints.length > 0 ? `
TURNING POINTS:
${turningPoints.map(tp => `- ${tp.description}`).join('\n')}
` : ''}

Provide a JSON response with this structure:
{
  "overview": "2-3 sentence summary of the call",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "emotionalTrajectory": "Description of how emotions evolved",
  "criticalMoments": ["moment1", "moment2"],
  "outcome": "What was the final result",
  "agentPerformance": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "recommendations": ["recommendation1", "recommendation2"]
}

Only respond with valid JSON, no additional text.
`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Summary generation error:', error);
      
      // Return basic summary if AI fails
      return {
        overview: `Call lasted ${call.durationSeconds || 0} seconds with ${call.outcome || 'unknown'} outcome.`,
        keyTopics: ['General inquiry'],
        emotionalTrajectory: `Average satisfaction: ${avgEmotions.satisfaction.toFixed(0)}%`,
        criticalMoments: [],
        outcome: call.outcome || 'Unknown',
        agentPerformance: {
          strengths: [],
          improvements: []
        },
        recommendations: []
      };
    }
  }
  
  private calculateAverageEmotions(emotions: EmotionalMetric[]) {
    if (emotions.length === 0) {
      return { anger: 0, frustration: 0, satisfaction: 0, neutral: 0 };
    }
    
    const sum = emotions.reduce((acc, e) => ({
      anger: acc.anger + e.anger,
      frustration: acc.frustration + e.frustration,
      satisfaction: acc.satisfaction + e.satisfaction,
      neutral: acc.neutral + e.neutral,
    }), { anger: 0, frustration: 0, satisfaction: 0, neutral: 0 });
    
    return {
      anger: sum.anger / emotions.length,
      frustration: sum.frustration / emotions.length,
      satisfaction: sum.satisfaction / emotions.length,
      neutral: sum.neutral / emotions.length,
    };
  }
}

export const summaryGenerator = new SummaryGenerator();
