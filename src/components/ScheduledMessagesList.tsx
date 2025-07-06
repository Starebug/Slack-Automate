'use client';

import { useState, useEffect } from 'react';

interface ScheduledMessage {
  id: string;
  messageId: string;
  text: string;
  channelId: string;
  scheduledTime: string;
  status: 'queued' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  attempts: Array<{
    timestamp: string;
    status: 'success' | 'failure';
    error?: string;
    response?: Record<string, unknown>;
  }>;
}

interface ScheduledMessagesListProps {
  refreshTrigger?: number;
}

export default function ScheduledMessagesList({ refreshTrigger }: ScheduledMessagesListProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledMessages();
  }, [refreshTrigger]);

  const fetchScheduledMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/messages/scheduled');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scheduled messages');
      }
      
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (messageId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return;
    }

    setCancellingId(messageId);
    try {
      const response = await fetch(`/api/messages/scheduled?id=${messageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel message');
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'cancelled' as const }
          : msg
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel message');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'sent':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' UTC';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const queuedMessages = messages.filter(msg => msg.status === 'queued');

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading scheduled messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Messages</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchScheduledMessages}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {queuedMessages.length === 0 ? (
        <div className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center min-h-[40px] w-full">
          <div className="text-slate-500 text-base mx-auto">No scheduled messages</div>
        </div>
      ) : (
        queuedMessages.map((message) => (
          <div
            key={message.id}
            className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center justify-between min-h-[40px] w-full"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center mb-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                  {getStatusIcon(message.status)}
                  <span className="ml-1 capitalize">{message.status}</span>
                </span>
                <span className="ml-2 text-xs text-slate-500">Channel: {message.channelId}</span>
              </div>
              <div className="text-slate-900 font-medium mb-0.5">{truncateText(message.text, 60)}</div>
              <div className="text-xs text-slate-500">Scheduled: {formatDateTime(message.scheduledTime)}</div>
              <div className="text-xs text-slate-400">Created: {formatDateTime(message.createdAt)}</div>
            </div>
            {message.status === 'queued' && (
              <button
                onClick={() => handleCancel(message.id)}
                disabled={cancellingId === message.id}
                className="ml-4 p-2 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Delete scheduled message"
              >
                {cancellingId === message.id ? (
                  <svg className="animate-spin h-5 w-5 text-red-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
} 