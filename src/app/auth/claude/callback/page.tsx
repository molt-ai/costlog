'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { exchangeCodeForTokens } from '@/lib/claude-oauth';
import { storage } from '@/lib/storage';

function ClaudeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      
      if (errorParam) {
        setStatus('error');
        setError(searchParams.get('error_description') || 'Authorization denied');
        return;
      }
      
      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }
      
      // Retrieve stored verifier and state
      const storedVerifier = sessionStorage.getItem('claude_oauth_verifier');
      const storedState = sessionStorage.getItem('claude_oauth_state');
      
      if (!storedVerifier || !storedState) {
        setStatus('error');
        setError('OAuth session expired. Please try again.');
        return;
      }
      
      if (state !== storedState) {
        setStatus('error');
        setError('Invalid state parameter. Possible CSRF attack.');
        return;
      }
      
      try {
        // Get the redirect URI (current origin + this path)
        const redirectUri = `${window.location.origin}/auth/claude/callback`;
        
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, storedVerifier, redirectUri);
        
        // Save to storage
        storage.saveClaudeMaxOAuth({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (tokens.expiresIn * 1000),
          orgId: tokens.orgId,
          enabled: true,
        });
        
        // Clean up session storage
        sessionStorage.removeItem('claude_oauth_verifier');
        sessionStorage.removeItem('claude_oauth_state');
        
        setStatus('success');
        
        // Redirect to settings after a short delay
        setTimeout(() => {
          router.push('/settings?claude_connected=true');
        }, 2000);
        
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Failed to complete authentication');
      }
    };
    
    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Connecting to Claude...</h1>
            <p className="text-[#666] text-sm">Please wait while we complete authentication.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Connected!</h1>
            <p className="text-[#666] text-sm">Claude Max has been successfully connected. Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Connection Failed</h1>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClaudeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <ClaudeCallbackContent />
    </Suspense>
  );
}
