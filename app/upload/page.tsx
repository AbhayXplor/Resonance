'use client';

import { useState } from 'react';
import Link from 'next/link';
import AudioUpload from '@/components/AudioUpload';

export default function UploadPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setResult(null);
    
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }
    
    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Upload Call Recording</h1>
              <p className="text-sm text-gray-500">Analyze recorded calls with AI</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AudioUpload onUpload={handleUpload} />
        
        {result && (
          <div className="mt-8 space-y-6">
            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">💡 AI Suggestions</h2>
                <div className="space-y-3">
                  {result.suggestions.map((suggestion: any, idx: number) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        suggestion.priority === 'high' ? 'bg-red-50 border-red-200' :
                        suggestion.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          suggestion.priority === 'high' ? 'bg-red-600 text-white' :
                          suggestion.priority === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {suggestion.priority.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">{suggestion.text}</p>
                          <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">📋 Call Summary</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p className="text-gray-700">{result.summary.overview}</p>
                  </div>
                  
                  {result.summary.keyTopics && result.summary.keyTopics.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.summary.keyTopics.map((topic: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.summary.emotionalTrajectory && (
                    <div>
                      <h3 className="font-semibold mb-2">Emotional Trajectory</h3>
                      <p className="text-gray-700">{result.summary.emotionalTrajectory}</p>
                    </div>
                  )}
                  
                  {result.summary.recommendations && result.summary.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {result.summary.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Transcript</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded">
                    {result.transcript}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Emotional Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Anger</div>
                      <div className="text-2xl font-bold text-red-600">
                        {result.emotions.anger.toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Frustration</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {result.emotions.frustration.toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Satisfaction</div>
                      <div className="text-2xl font-bold text-green-600">
                        {result.emotions.satisfaction.toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Neutral</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.emotions.neutral.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Conversation Context</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div>
                      <span className="font-medium">Trajectory:</span>{' '}
                      <span className="capitalize">{result.context.trajectory}</span>
                    </div>
                    <div>
                      <span className="font-medium">Sentiment:</span>{' '}
                      <span className="capitalize">{result.context.sentiment}</span>
                    </div>
                    <div>
                      <span className="font-medium">Intent:</span> {result.context.intent}
                    </div>
                    <div>
                      <span className="font-medium">Topics:</span>{' '}
                      {result.context.topics.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> {result.context.urgency}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
