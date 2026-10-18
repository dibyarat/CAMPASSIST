import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { Loader2, Mail, Lock, User, Hash, MapPin, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { apiClient } from '../../services/apiClient';
import logoIcon from '../../assets/logo-icon.png';

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await apiClient('/institutions');
        if (Array.isArray(data)) {
          setInstitutions(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, institutionCode: data[0].code }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch institutions', err);
      }
    };

    const fetchSections = async () => {
      try {
        const data = await apiClient('/sections');
        if (Array.isArray(data)) {
          setSections(data);
        }
      } catch (err) {
        console.error('Failed to fetch sections', err);
      }
    };

    fetchInstitutions();
    fetchSections();
  }, []);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rollNumber: '',
    section: '',
    role: 'STUDENT',
    institutionCode: ''
  });

  const selectedInstitution = useMemo(() => {
    if (!formData.institutionCode) return null;
    return institutions.find(
      (inst) => inst.code?.toUpperCase() === formData.institutionCode?.toUpperCase()
    ) || null;
  }, [institutions, formData.institutionCode]);

  const availableSections = useMemo(() => {
    if (!formData.institutionCode) return [];
    return sections.filter((sec) => {
      if (sec.institution?.code) {
        return sec.institution.code.toUpperCase() === formData.institutionCode.toUpperCase();
      }
      if (selectedInstitution?.id && sec.institutionId) {
        return sec.institutionId === selectedInstitution.id;
      }
      return false;
    });
  }, [sections, formData.institutionCode, selectedInstitution]);

  useEffect(() => {
    if (availableSections.length > 0) {
      const isValid = availableSections.some((sec) => sec.name === formData.section);
      if (!isValid) {
        setFormData((prev) => ({ ...prev, section: availableSections[0].name }));
      }
    } else {
      setFormData((prev) => ({ ...prev, section: '' }));
    }
  }, [availableSections, formData.section]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.institutionCode) {
      setError('Please select an institution.');
      return;
    }

    if (availableSections.length > 0 && !formData.section) {
      setError('Please select a valid section for your institution.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const accessToken = await userCredential.user.getIdToken();

      // 2. We have the user JWT now. Call our backend to initialize the profile
      await apiClient('/users/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          rollNumber: formData.rollNumber,
          section: formData.section,
          institutionCode: formData.institutionCode
        })
      });

      // 3. Registration complete, redirect to dashboard
      localStorage.setItem('userFullName', formData.fullName || 'User');
      localStorage.setItem('userRole', formData.role);
      trackEvent('signup', { method: 'email', role: formData.role });
      if (formData.role === 'CR') navigate('/cr');
      else navigate('/student');

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none blur-[120px] bg-[var(--glow-blue)]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none blur-[120px] bg-[var(--glow-pink)]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <img src={logoIcon} alt="CampAssist Logo" className="h-12 w-12 object-contain" />
          <span className="font-wordmark text-3xl font-extrabold flex items-center">
            <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Or{' '}
          <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass py-8 px-4 sm:rounded-3xl sm:px-10 border border-[var(--color-border)] shadow-xl">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700 items-start">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Institution Code</label>
                <div className="mt-1 relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  name="institutionCode"
                  required
                  value={formData.institutionCode}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                >
                  {institutions.length === 0 && <option value="">Loading institutions...</option>}
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.code}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
                </div>
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Roll Number</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="21BCS001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Section</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="section"
                    required={availableSections.length > 0}
                    disabled={availableSections.length === 0}
                    value={formData.section}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {availableSections.length === 0 ? (
                      <option value="" disabled>
                        {institutions.length === 0 ? 'Loading institutions...' : 'No sections available for this institution'}
                      </option>
                    ) : (
                      <>
                        <option value="" disabled>Select a section...</option>
                        {availableSections.map(sec => (
                          <option key={sec.id} value={sec.name}>{sec.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
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
                  <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};







