import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmotionalMetrics, ConversationContext, Suggestion } from '@/types';
import { callsRepository } from '@/lib/database';

export class SuggestionEngine {
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
  
  async generateSuggestions(
    callId: string,
    emotions: EmotionalMetrics,
    context: ConversationContext,
    transcript?: string
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    
    // Rule-based triggers
    if (emotions.anger > 60) {
      suggestions.push({
        id: `${callId}-anger-high`,
        callId,
        priority: 'high',
        text: 'Customer is showing high anger. Consider offering immediate escalation or compensation.',
        reasoning: `Anger level at ${emotions.anger.toFixed(0)}%. Historical data shows this often leads to churn.`,
        timestampOffset: emotions.timestamp,
        createdAt: new Date(),
      });
    }
    
    if (emotions.frustration > 50 && context.trajectory === 'escalating') {
      suggestions.push({
        id: `${callId}-frustration-escalating`,
        callId,
        priority: 'high',
        text: 'Frustration is building and conversation is escalating. Acknowledge their concerns and provide a clear action plan.',
        reasoning: `Frustration at ${emotions.frustration.toFixed(0)}% with escalating trajectory.`,
        timestampOffset: emotions.timestamp,
        createdAt: new Date(),
      });
    }
    
    if (emotions.satisfaction < 30 && context.urgency > 70) {
      suggestions.push({
        id: `${callId}-low-satisfaction-urgent`,
        callId,
        priority: 'high',
        text: 'Low satisfaction with high urgency. Prioritize quick resolution and set clear expectations.',
        reasoning: `Satisfaction at ${emotions.satisfaction.toFixed(0)}% with urgency level ${context.urgency}/100.`,
        timestampOffset: emotions.timestamp,
        createdAt: new Date(),
      });
    }
    
    if (context.trajectory === 'improving' && emotions.satisfaction > 60) {
      suggestions.push({
        id: `${callId}-positive-momentum`,
        callId,
        priority: 'medium',
        text: 'Great job! Customer satisfaction is improving. Continue with current approach.',
        reasoning: `Positive trajectory with ${emotions.satisfaction.toFixed(0)}% satisfaction.`,
        timestampOffset: emotions.timestamp,
        createdAt: new Date(),
      });
    }
    
    // LLM-based contextual suggestions
    if (transcript && (emotions.anger > 40 || emotions.frustration > 40)) {
      try {
        const llmSuggestion = await this.generateLLMSuggestion(
          callId,
          emotions,
          context,
          transcript
        );
        if (llmSuggestion) {
          suggestions.push(llmSuggestion);
        }
      } catch (error) {
        console.error('LLM suggestion generation failed:', error);
      }
    }
    
    return suggestions;
  }
  
  private async generateLLMSuggestion(
    callId: string,
    emotions: EmotionalMetrics,
    context: ConversationContext,
    transcript: string
  ): Promise<Suggestion | null> {
    const model = this.getModel();
    
    const prompt = `
You are an AI assistant helping customer support agents. Based on the current call state, provide ONE specific, actionable suggestion.

CURRENT STATE:
- Anger: ${emotions.anger.toFixed(0)}%
- Frustration: ${emotions.frustration.toFixed(0)}%
- Satisfaction: ${emotions.satisfaction.toFixed(0)}%
- Trajectory: ${context.trajectory}
- Sentiment: ${context.sentiment}
- Topics: ${context.topics.join(', ')}

RECENT TRANSCRIPT:
${transcript.slice(-500)} 

Provide a JSON response:
{
  "text": "Specific action the agent should take",
  "reasoning": "Why this suggestion is relevant"
}

Only respond with valid JSON, no additional text.
`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `${callId}-llm-${Date.now()}`,
        callId,
        priority: 'medium',
        text: parsed.text,
        reasoning: parsed.reasoning,
        timestampOffset: emotions.timestamp,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('LLM suggestion error:', error);
      return null;
    }
  }
}

export const suggestionEngine = new SuggestionEngine();
