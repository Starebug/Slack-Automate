'use client'
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { jwtDecode } from 'jwt-decode';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = getCookie('slackconnect_token');
    if (token) {
      try {
        jwtDecode(token);
        router.push('/dashboard');
        return;
      } catch (e) {
        console.log('Error decoding token:', e);
      }
    }
    router.push('/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
