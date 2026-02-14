'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CallWithDetails {
  id: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  outcome?: string;
  summary?: string;
  emotions?: {
    anger: number;
    frustration: number;
    satisfaction: number;
    neutral: number;
  };
  transcript?: string;
  suggestions?: Array<{
    text: string;
    priority: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    activeCalls: 0,
    avgSatisfaction: 0,
    successRate: 0,
    avgAnger: 0,
    avgFrustration: 0,
  });
  const [recentCalls, setRecentCalls] = useState<CallWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallWithDetails | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setStats({
        totalCalls: data.totalCalls,
        activeCalls: 0,
        avgSatisfaction: data.avgSatisfaction,
        successRate: data.successRate,
        avgAnger: data.avgAnger || 0,
        avgFrustration: data.avgFrustration || 0,
      });
      setRecentCalls(data.recentCalls || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Monitoring Dashboard</h1>
              <p className="text-sm text-gray-500">Real-time emotion intelligence & analytics</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/live"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🔴 Start Live Monitoring
              </Link>
              <Link
                href="/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📁 Upload Recording
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
              </div>
              <span className="text-2xl">📞</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-green-600">{stats.avgSatisfaction}%</p>
              </div>
              <span className="text-2xl">😊</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Anger</p>
                <p className="text-2xl font-bold text-red-600">{stats.avgAnger}%</p>
              </div>
              <span className="text-2xl">😠</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Frustration</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgFrustration}%</p>
              </div>
              <span className="text-2xl">😤</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-100">AI Powered</p>
                <p className="text-sm font-bold">Gemini 2.5</p>
              </div>
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/live" className="block">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🎙️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Live Call Monitoring</h3>
                  <p className="text-green-100">Monitor Google Meet calls in real-time</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Real-time emotion detection</li>
                <li>✓ Live agent suggestions</li>
                <li>✓ Instant transcription</li>
              </ul>
            </div>
          </Link>

          <Link href="/upload" className="block">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📁</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Upload Recording</h3>
                  <p className="text-blue-100">Analyze recorded calls</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Post-call analysis</li>
                <li>✓ Detailed insights</li>
                <li>✓ Historical patterns</li>
              </ul>
            </div>
          </Link>
        </div>

        {/* Recent Calls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            ) : recentCalls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-6xl mb-4 block">📊</span>
                <p className="text-lg">No calls yet</p>
                <p className="text-sm">Start monitoring or upload a recording to see analytics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Call #{call.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(call.startTime).toLocaleString()}
                        </p>
                        {call.summary && (
                          <p className="text-sm text-gray-700 mt-2">{call.summary}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {call.outcome && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            call.outcome === 'successful' ? 'bg-green-100 text-green-800' :
                            call.outcome === 'escalated' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {call.outcome}
                          </span>
                        )}
                        {call.durationSeconds && (
                          <span className="text-sm text-gray-500">
                            {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
