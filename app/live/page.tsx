'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function LiveMonitoring() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [emotions, setEmotions] = useState({
    anger: 0,
    frustration: 0,
    satisfaction: 0,
    neutral: 0,
  });
  const [transcript, setTranscript] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  const startCapture = async () => {
    try {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('Screen sharing requires HTTPS or localhost.');
        return;
      }

      // Step 1: Get screen/tab audio (customer voice from Meet)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      
      const displayAudioTracks = displayStream.getAudioTracks();
      if (displayAudioTracks.length === 0) {
        alert('⚠️ No audio from screen share! Make sure to check "Share tab audio"');
        displayStream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Step 2: Get microphone audio (your voice)
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      
      console.log('Both audio sources captured');
      
      // Generate call ID as UUID
      const newCallId = crypto.randomUUID();
      setCallId(newCallId);
      
      // Create AudioContext to mix both streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      // Add display audio (customer)
      const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks));
      displaySource.connect(destination);
      
      // Add microphone audio (agent)
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
      
      console.log('Audio streams mixed');
      
      // Set up MediaRecorder with mixed audio
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      
      console.log('MediaRecorder created:', {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', {
          size: event.data.size,
          type: event.data.type
        });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Chunk added. Total chunks:', audioChunksRef.current.length);
        }
      };
      
      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
      };
      
      // Use 5 second chunks for faster transcription
      mediaRecorder.start(5000);
      console.log('MediaRecorder started with 5s timeslice');
      setIsCapturing(true);
      
      // Process audio every 5 seconds
      processingIntervalRef.current = setInterval(async () => {
        if (audioChunksRef.current.length > 0) {
          await processAudioChunk(newCallId);
        }
      }, 5000);
      
      // Handle stream end
      displayStream.getTracks().forEach(track => {
        track.onended = () => {
          stopCapture();
          audioContext.close();
          micStream.getTracks().forEach(t => t.stop());
        };
      });
      
    } catch (error: any) {
      console.error('Capture error:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('❌ Permission denied! Please allow screen sharing and microphone access.');
      } else if (error.name === 'NotSupportedError') {
        alert('❌ Not supported! Try Chrome or Edge.');
      } else {
        alert(`❌ Failed: ${error.message}`);
      }
    }
  };

  const processAudioChunk = async (currentCallId: string) => {
    if (audioChunksRef.current.length === 0 || processing) {
      console.log('Skipping processing:', { 
        hasChunks: audioChunksRef.current.length > 0, 
        processing 
      });
      return;
    }
    
    console.log('Processing audio chunk:', {
      chunkCount: audioChunksRef.current.length,
      callId: currentCallId
    });
    
    setProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      audioChunksRef.current = [];
      
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('callId', currentCallId);
      
      console.log('Sending to /api/live...');
      const response = await fetch('/api/live', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        // Update emotions
        if (data.emotions) {
          const newEmotions = {
            anger: Math.round(data.emotions.anger),
            frustration: Math.round(data.emotions.frustration),
            satisfaction: Math.round(data.emotions.satisfaction),
            neutral: Math.round(data.emotions.neutral),
          };
          setEmotions(newEmotions);
          setEmotionHistory(prev => [...prev, { ...newEmotions, timestamp: Date.now() }].slice(-20));
        }
        
        // Update transcript
        if (data.transcript) {
          console.log('Adding transcript:', data.transcript);
          setTranscript(prev => [...prev, data.transcript]);
        }
        
        // Update suggestions - map API format to display format
        if (data.suggestions && data.suggestions.length > 0) {
          const formattedSuggestions = data.suggestions.map((s: any) => ({
            suggestion_text: s.text,
            trigger_reason: s.reasoning,
            priority: s.priority,
          }));
          setSuggestions(prev => [...formattedSuggestions, ...prev].slice(0, 5));
        }
      } else {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const stopCapture = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setIsCapturing(false);
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
              <h1 className="text-2xl font-bold text-gray-900">Live Call Monitoring</h1>
              <p className="text-sm text-gray-500">Monitor Google Meet calls in real-time</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isCapturing ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎙️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Live Monitoring</h2>
              <p className="text-gray-600 mb-8">
                Monitor your Google Meet call in real-time with AI-powered emotion detection and agent suggestions.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">📋 How it works:</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li>1. <strong>Start your Google Meet call</strong> in another tab</li>
                  <li>2. Click <strong>"Start Monitoring"</strong> below</li>
                  <li>3. <strong>Share your Meet tab</strong> and check <strong>"Share tab audio"</strong></li>
                  <li>4. <strong>Allow microphone access</strong> when prompted (for your voice)</li>
                  <li>5. System captures BOTH customer (from Meet) and agent (your mic)</li>
                  <li>6. See real-time emotions and AI suggestions</li>
                </ol>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>💡 Tip:</strong> The system analyzes customer emotions and suggests better responses for you in real-time!
                  </p>
                </div>
              </div>

              <button
                onClick={startCapture}
                className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                🔴 Start Monitoring
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Bar */}
            <div className="bg-green-600 text-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <span className="font-semibold">LIVE MONITORING ACTIVE</span>
                    <p className="text-xs text-green-100 mt-1">
                      🎤 Capturing audio • 🤖 Gemini analyzing emotions • 💡 AI generating suggestions
                    </p>
                  </div>
                </div>
                <button
                  onClick={stopCapture}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Stop Monitoring
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Emotions Panel */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Real-Time Emotions</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Anger</span>
                      <span className="font-semibold text-red-600">{emotions.anger}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${emotions.anger}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Frustration</span>
                      <span className="font-semibold text-orange-600">{emotions.frustration}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full transition-all"
                        style={{ width: `${emotions.frustration}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Satisfaction</span>
                      <span className="font-semibold text-green-600">{emotions.satisfaction}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${emotions.satisfaction}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Neutral</span>
                      <span className="font-semibold text-blue-600">{emotions.neutral}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${emotions.neutral}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Live Transcript</h4>
                  <div className="bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto">
                    {transcript.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Waiting for audio...</p>
                    ) : (
                      <div className="space-y-2">
                        {transcript.map((text, idx) => (
                          <p key={idx} className="text-sm text-gray-700">{text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions Panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">💡 AI Suggestions</h3>
                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-500 italic">Waiting for call data...</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          suggestion.priority === 'high'
                            ? 'bg-red-50 border-red-200'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`font-semibold text-xs uppercase ${
                              suggestion.priority === 'high'
                                ? 'text-red-600'
                                : suggestion.priority === 'medium'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {suggestion.priority}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 font-medium mb-1">
                              {suggestion.suggestion_text}
                            </p>
                            <p className="text-xs text-gray-500">{suggestion.trigger_reason}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
