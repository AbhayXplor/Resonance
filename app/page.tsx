'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">📞</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CallSense</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link
                href="/live"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-blue-700">Real-time AI Analysis</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Every Call Into a
              <span className="text-blue-600"> Winning Conversation</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI-powered emotion detection and real-time coaching for customer support teams. 
              Reduce escalations by 40% and boost satisfaction scores instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/live"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg shadow-blue-600/20"
              >
                Start Free Trial
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg hover:border-gray-300 transition-colors font-semibold text-lg"
              >
                View Demo
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900">40%</div>
              <div className="text-sm text-gray-600 mt-1">Fewer Escalations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">2.5s</div>
              <div className="text-sm text-gray-600 mt-1">Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600 mt-1">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600 mt-1">Live Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI tools that help your team handle every customer interaction with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">😠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Emotion Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time analysis of customer emotions. Detect anger, frustration, and satisfaction 
                as the conversation unfolds.
              </p>
            </div>

            <div className="p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live Transcription</h3>
              <p className="text-gray-600 leading-relaxed">
                Instant speech-to-text with speaker identification. Never miss a word with 
                95% accuracy transcription.
              </p>
            </div>

            <div className="p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Coaching</h3>
              <p className="text-gray-600 leading-relaxed">
                Get intelligent response suggestions in real-time. Handle difficult situations 
                with AI-powered guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Industry
            </h2>
            <p className="text-xl text-gray-600">
              From customer support to healthcare, CallSense adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🏢</div>
              <h4 className="font-bold text-gray-900 mb-2">Customer Support</h4>
              <p className="text-sm text-gray-600">Reduce escalations and improve CSAT scores</p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">💼</div>
              <h4 className="font-bold text-gray-900 mb-2">Sales Teams</h4>
              <p className="text-sm text-gray-600">Close more deals with emotion insights</p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🏥</div>
              <h4 className="font-bold text-gray-900 mb-2">Healthcare</h4>
              <p className="text-sm text-gray-600">Better patient communication and care</p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🎓</div>
              <h4 className="font-bold text-gray-900 mb-2">Education</h4>
              <p className="text-sm text-gray-600">Enhanced student support services</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Calls?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of teams using CallSense to deliver exceptional customer experiences
          </p>
          <Link
            href="/live"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg shadow-blue-600/20"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">📞</span>
              </div>
              <span className="text-lg font-bold text-gray-900">CallSense</span>
            </div>
            <div className="text-sm text-gray-600">
              © 2024 CallSense. Powered by Gemini 2.5 Flash, Groq Whisper & Supabase
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
