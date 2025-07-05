import { useState, useEffect } from 'react';

interface SessionUser {
  slackUserId: string;
  slackTeamId: string;
  slackTeamName: string;
  slackScopes: string;
  slackBotUserId: string;
  slackAppId: string;
  email: string;
  slackUserAccessToken: string;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading };
} 