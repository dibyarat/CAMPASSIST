import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { apiClient } from '../../services/apiClient';
import logoIcon from '../../assets/logo-icon.png';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile from our backend to know their role
      const profile = await apiClient('/users/me');
      
      localStorage.setItem('userFullName', profile.profile?.fullName || 'User');
      localStorage.setItem('userRole', profile.role);
      trackEvent('login', { method: 'email', role: profile.role });
      if (profile.role === 'CR') navigate('/cr');
      else if (profile.role === 'DEVELOPER') navigate('/developer');
      else navigate('/student');

    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResetMode(true);
    setResetEmail(email);
    setResetError('');
    setResetSuccess('');
    setError('');
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setResetError('');
    setResetSuccess('');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      trackEvent('password_reset_request', { method: 'email' });
      setResetSuccess(`If an account exists with this email address, a password reset link has been sent to ${targetEmail}. Please check your inbox (and spam folder).`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        // Prevent account enumeration: return uniform success message
        setResetSuccess(`If an account exists with this email address, a password reset link has been sent to ${targetEmail}. Please check your inbox (and spam folder).`);
      } else if (code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please wait a moment before trying again.');
      } else {
        setResetError(err.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <img src={logoIcon} alt="CampAssist Logo" className="h-12 w-12 object-contain" />
          <span className="font-wordmark text-3xl font-extrabold flex items-center">
            <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
          </span>
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
          {isResetMode ? 'Reset your password' : 'Sign in to CampAssist'}
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          {isResetMode ? 'Enter your registered email to receive a recovery link' : 'Continue to your campus account'}
        </p>
        {!isResetMode && (
          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            Or{' '}
            <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">
              create a new account
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="overflow-hidden glass py-8 px-4 sm:rounded-3xl sm:px-10 border border-[var(--color-border)] shadow-xl">
          <div className="h-1.5 rounded-full mb-8" style={{ background: 'var(--gradient-brand)' }} />
          
          {isResetMode ? (
            resetSuccess ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex gap-3 text-emerald-800 items-start">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div className="text-sm font-medium">
                    <p>{resetSuccess}</p>
                    <p className="mt-2 text-xs text-emerald-700">Follow the link in your email to set a new password, then return here to sign in.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full flex justify-center py-3 px-4 border border-[var(--color-border)] rounded-xl shadow-sm text-sm font-semibold text-[var(--color-text)] bg-[var(--glass-sub-surface)] hover:bg-white/10 transition"
                >
                  Return to Sign in
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                {resetError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-3 text-rose-400 items-start">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Registered Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[var(--color-muted)]" />
                    </div>
                    <input
                      name="resetEmail"
                      type="email"
                      required
                      autoFocus
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      background: 'var(--gradient-brand)',
                      boxShadow: '0 4px 18px rgba(113, 64, 216, 0.35)',
                    }}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-full text-sm font-bold text-white hover:scale-[1.01] hover:shadow-lg focus:outline-none transition disabled:opacity-70 cursor-pointer"
                  >
                    {resetLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                      <>Send Reset Link <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full flex justify-center py-2.5 px-4 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition"
                  >
                    ← Back to Sign in
                  </button>
                </div>
              </form>
            )
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-3 text-rose-400 items-start">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[var(--color-muted)]" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[var(--color-muted)]" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#8758F5] focus:ring-[#8758F5] border-[var(--color-border)] rounded bg-[var(--glass-sub-surface)]"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-[var(--color-muted)]">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handleOpenReset}
                      className="font-medium text-xs sm:text-sm text-[#19A3E9] hover:text-[#D946A8] transition cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: 'var(--gradient-brand)',
                      boxShadow: '0 4px 18px rgba(113, 64, 216, 0.35)',
                    }}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-full text-sm font-bold text-white hover:scale-[1.01] hover:shadow-lg focus:outline-none transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                      <>Sign in <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


