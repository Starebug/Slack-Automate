import { useState, useEffect } from 'react';

interface SentMessage {
  id: string;
  messageId: string;
  text: string;
  channelId: string;
  type: 'immediate' | 'scheduled';
  status: 'sent';
  createdAt: string;
  sentAt: string;
  attempts: Array<{
    timestamp: string;
    status: 'success' | 'failure';
    error?: string;
    response?: Record<string, unknown>;
  }>;
}

interface SentMessagesListProps {
  refreshTrigger?: number;
}

export default function SentMessagesList({ refreshTrigger }: SentMessagesListProps) {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentMessages();
  }, [refreshTrigger]);

  const fetchSentMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/messages/sent');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sent messages');
      }
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center min-h-[40px] w-full">
        <div className="text-slate-500 text-base mx-auto">Loading sent messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center min-h-[40px] w-full">
        <div className="text-red-500 text-base mx-auto">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {messages.length === 0 ? (
        <div className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center min-h-[40px] w-full">
          <div className="text-slate-500 text-base mx-auto">No sent messages</div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className="bg-[#f6f6f6] rounded-full shadow-[0_4px_0_0_#23272f] border border-slate-200 pl-10 pr-4 py-2 flex items-center justify-between min-h-[40px] w-full"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center mb-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {message.type === 'immediate' ? 'Sent' : 'Scheduled & Sent'}
                </span>
                <span className="ml-2 text-xs text-slate-500">Channel: {message.channelId}</span>
              </div>
              <div className="text-slate-900 font-medium mb-0.5">{truncateText(message.text, 60)}</div>
              <div className="text-xs text-slate-500">Sent: {formatDateTime(message.sentAt)}</div>
              <div className="text-xs text-slate-400">Created: {formatDateTime(message.createdAt)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 