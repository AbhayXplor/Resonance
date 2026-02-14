import { EmotionalMetrics } from '@/types';

export interface HumeEmotionResponse {
  emotions: Array<{
    name: string;
    score: number;
  }>;
  confidence: number;
}

export class EmotionAnalyzer {
  private apiKey: string | null = null;
  private apiUrl = 'https://api.hume.ai/v0/batch/jobs';
  
  constructor() {
    // Lazy initialization
  }
  
  private getApiKey(): string {
    if (!this.apiKey) {
      const apiKey = process.env.HUME_AI_API_KEY;
      if (!apiKey) {
        throw new Error('HUME_AI_API_KEY is not set');
      }
      this.apiKey = apiKey;
    }
    return this.apiKey;
  }
  
  async analyze(audioBuffer: Buffer): Promise<EmotionalMetrics> {
    try {
      // Upload audio and create job
      const jobId = await this.createJob(audioBuffer);
      
      // Poll for results
      const result = await this.pollJobResults(jobId);
      
      // Parse emotions
      return this.parseEmotions(result);
    } catch (error) {
      console.error('Emotion analysis error:', error);
      throw new Error(`Failed to analyze emotions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async createJob(audioBuffer: Buffer): Promise<string> {
    // Convert buffer to base64 for API
    const base64Audio = audioBuffer.toString('base64');
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: {
          prosody: {}
        },
        files: [{
          data: base64Audio,
          content_type: 'audio/wav'
        }]
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hume API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    return data.job_id;
  }
  
  private async pollJobResults(jobId: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.apiUrl}/${jobId}`, {
        headers: {
          'X-Hume-Api-Key': this.getApiKey(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.state === 'COMPLETED') {
        return data.predictions;
      } else if (data.state === 'FAILED') {
        throw new Error('Emotion analysis job failed');
      }
      
      // Wait 1 second before next poll (reduced from 2s)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Return empty instead of throwing
    console.warn('Emotion analysis timed out, returning defaults');
    return null;
  }
  
  private parseEmotions(humeResponse: any): EmotionalMetrics {
    if (!humeResponse || !humeResponse[0] || !humeResponse[0].results) {
      // Return neutral emotions if no response
      return {
        anger: 0,
        frustration: 0,
        satisfaction: 50,
        neutral: 50,
        confidence: 0.5,
        timestamp: Date.now(),
      };
    }
    
    const predictions = humeResponse[0].results.predictions;
    if (!predictions || predictions.length === 0) {
      return {
        anger: 0,
        frustration: 0,
        satisfaction: 50,
        neutral: 50,
        confidence: 0.5,
        timestamp: Date.now(),
      };
    }
    
    const emotions = predictions[0].emotions;
    
    return {
      anger: this.findEmotion(emotions, 'Anger'),
      frustration: this.findEmotion(emotions, 'Annoyance'),
      satisfaction: this.findEmotion(emotions, 'Joy'),
      neutral: this.findEmotion(emotions, 'Calmness'),
      confidence: predictions[0].confidence || 0.8,
      timestamp: Date.now(),
    };
  }
  
  private findEmotion(emotions: Array<{ name: string; score: number }>, emotionName: string): number {
    const emotion = emotions.find(e => e.name === emotionName);
    return emotion ? emotion.score * 100 : 0;
  }
  
  async analyzeFromFile(file: File): Promise<EmotionalMetrics> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return this.analyze(buffer);
  }
}

export const emotionAnalyzer = new EmotionAnalyzer();
