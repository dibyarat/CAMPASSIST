import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { apiClient } from '../../services/apiClient';
import logoMark from '../../assets/logo-mark.svg';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-pink-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <img src={logoMark} alt="" className="h-14 w-14 object-contain" />
          <span className="brand-wordmark text-3xl font-extrabold">CampAssist</span>
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Sign in to CampAssist
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Continue to your campus account
        </p>
        <p className="mt-4 text-center text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-[var(--brand-blue)] hover:text-[var(--brand-purple)]">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="overflow-hidden bg-white/95 py-8 px-4 shadow-xl shadow-slate-200/60 sm:rounded-2xl sm:px-10 border border-slate-200">
          <div className="h-1.5 rounded-full bg-gradient-primary mb-8" />
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700 items-start">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] sm:text-sm"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] sm:text-sm"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[var(--brand-blue)] hover:text-[var(--brand-purple)]">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-blue)] transition disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>Sign in <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


