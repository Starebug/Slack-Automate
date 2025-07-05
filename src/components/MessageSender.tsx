'use client';

import { useState, useEffect } from 'react';
import BoxCard from './BoxCard';

interface Channel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
  topic: string;
  purpose: string;
  created: number;
}

interface MessageSenderProps {
  onMessageSent?: () => void;
}

export default function MessageSender({ onMessageSent }: MessageSenderProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      setError(null);
      
      const response = await fetch('/api/slack/channels');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channels');
      }
      
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel || !message.trim()) {
      setError('Please select a channel and enter a message');
      return;
    }

    if (isScheduled && !scheduledTime) {
      setError('Please select a scheduled time');
      return;
    }

    if (isScheduled && new Date(scheduledTime) <= new Date()) {
      setError('Scheduled time must be in the future');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          message: message.trim(),
          scheduledTime: isScheduled ? scheduledTime : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(
        isScheduled 
          ? `Message scheduled successfully for ${new Date(scheduledTime).toLocaleString()}`
          : 'Message sent successfully!'
      );
      
      setMessage('');
      setSelectedChannel('');
      setIsScheduled(false);
      setScheduledTime('');
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('token_expired') || errorMessage.includes('Unable to get valid access token')) {
        setError('Your Slack connection has expired. Please sign out and sign in again to refresh your connection.');
      } else if (errorMessage.includes('missing_scope')) {
        setError('Your Slack app needs additional permissions. Please sign out and sign in again to grant the required permissions.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDateTime.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-transparent">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Send Message</h3>
        <p className="text-sm text-slate-600">
          Send a message to any channel in your Slack workspace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-slate-700 mb-2">
            Select Channel
          </label>
          <BoxCard leftContent={null} mainContent={
            <select
              id="channel"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-transparent px-4 py-2 border-none outline-none focus:ring-0 text-base"
              required
              style={{ boxShadow: 'none' }}
            >
              <option value="" className='bg-[#f3f3f3] rounded-md border-1'>Choose a channel...</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id} className='bg-[#f3f3f3] rounded-md border-1'>
                  #{channel.name} {channel.topic && `- ${channel.topic}`}
                </option>
              ))}
            </select>
          } />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
            Message
          </label>
          <BoxCard leftContent={null} mainContent={
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-transparent px-4 py-2 border-none outline-none focus:ring-0 text-base resize-none"
              placeholder="Type your message here..."
              required
              style={{ boxShadow: 'none' }}
            />
          } />
          <div className="mt-1 text-sm text-slate-500">
            {message.length} characters
          </div>
        </div>

        <BoxCard
          leftContent={null}
          mainContent={
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="schedule"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
              />
              <label htmlFor="schedule" className="text-sm font-medium text-slate-700">
                Schedule for later
              </label>
            </div>
          }
        />

        {isScheduled && (
          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-slate-700 mb-2">
              Scheduled Time
            </label>
            <BoxCard leftContent={null} mainContent={
              <input
                type="datetime-local"
                id="scheduledTime"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinDateTime()}
                className="w-full bg-transparent px-4 py-2 border-none outline-none focus:ring-0 text-base"
                required
                style={{ boxShadow: 'none' }}
              />
            } />
          </div>
        )}

        {error && (
          <BoxCard leftContent={null} mainContent={
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          } />
        )}

        {success && (
          <BoxCard leftContent={null} mainContent={
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          } />
        )}

        <button
          type="submit"
          disabled={isLoading || isLoadingChannels}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isScheduled ? 'Scheduling...' : 'Sending...'}
            </div>
          ) : (
            isScheduled ? 'Schedule Message' : 'Send Message'
          )}
        </button>
      </form>
    </div>
  );
} 