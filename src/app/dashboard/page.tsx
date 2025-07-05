'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MessageSender from '@/components/MessageSender';
import ScheduledMessagesList from '@/components/ScheduledMessagesList';
import SentMessagesList from '@/components/SentMessagesList';
import { useSession } from '@/lib/useSession';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');

  if (!loading && !user) {
    console.log('Dashboard: Not authenticated, redirecting to /login');
    router.push('/login');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/signout', { method: 'POST' });
    } catch (e) {
    }
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SlackConnect</h1>
                <p className="text-sm text-slate-600">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.slackUserId || 'Slack User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.email || 'slack@example.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex space-x-4 mt-2">
            <button
              className={`px-6 py-2 rounded-t-lg font-medium text-base focus:outline-none transition-colors border-b-2 ${activeTab === 'scheduled' ? 'border-purple-600 text-purple-700 bg-[#f6f6f6]' : 'border-transparent text-slate-500 bg-transparent hover:bg-slate-100'}`}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled Messages
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-medium text-base focus:outline-none transition-colors border-b-2 ${activeTab === 'sent' ? 'border-purple-600 text-purple-700 bg-[#f6f6f6]' : 'border-transparent text-slate-500 bg-transparent hover:bg-slate-100'}`}
              onClick={() => setActiveTab('sent')}
            >
              Sent Messages
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to your SlackConnect Dashboard!
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                <span className="font-semibold text-purple-700">Send and schedule messages to your Slack channels directly from this dashboard.</span> Easily manage your workspace communications, view analytics, and configure your settings—all in one place.
              </p>
            </div>
          </div>
          <div id="tabbed-messages">
            {activeTab === 'scheduled' ? (
              <>
                <MessageSender onMessageSent={() => setRefreshTrigger(prev => prev + 1)} />
                <ScheduledMessagesList refreshTrigger={refreshTrigger} />
              </>
            ) : (
              <SentMessagesList refreshTrigger={refreshTrigger} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 