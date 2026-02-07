'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isConfigured) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Team features not configured</h1>
          <p className="text-[#888] text-sm mb-6">
            To enable team features, set up Supabase and add your credentials to .env.local
          </p>
          <Link href="/" className="btn btn-secondary">
            Continue in local mode
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const action = isSignUp ? signUp : signIn;
    const { error } = await action(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-[#888] text-sm mt-1">
            {isSignUp ? 'Start tracking your AI spend' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-[#666] block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder-[#444] focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#666] block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder-[#444] focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white font-medium text-sm rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-[#666] mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        {/* Local mode link */}
        <div className="text-center mt-8 pt-6 border-t border-white/[0.06]">
          <Link href="/" className="text-xs text-[#555] hover:text-[#888]">
            Continue without account →
          </Link>
        </div>
      </div>
    </div>
  );
}
