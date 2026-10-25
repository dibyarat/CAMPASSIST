import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { Loader2, Mail, Lock, User, Hash, MapPin, AlertCircle, ArrowRight, Building2, BookOpen, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { apiClient } from '../../services/apiClient';
import logoIcon from '../../assets/logo-icon.png';

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
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

    const fetchDepartments = async () => {
      try {
        const data = await apiClient('/departments');
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (err) {
        console.warn('Failed to fetch departments directly, will infer from sections', err);
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
    fetchDepartments();
    fetchSections();
  }, []);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rollNumber: '',
    department: '',
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

  const institutionSections = useMemo(() => {
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

  const availableDepartments = useMemo(() => {
    const deptMap = new Map<string, { id?: string; name: string; code?: string }>();

    // 1. First add departments linked through this institution's sections
    institutionSections.forEach((sec) => {
      if (sec.department?.name) {
        deptMap.set(sec.department.name.toUpperCase(), {
          id: sec.department.id,
          name: sec.department.name,
          code: sec.department.code,
        });
      }
    });

    // 2. If no institution sections have department relations, include master departments
    if (deptMap.size === 0 && departments.length > 0) {
      departments.forEach((dept) => {
        if (dept.name) {
          deptMap.set(dept.name.toUpperCase(), {
            id: dept.id,
            name: dept.name,
            code: dept.code,
          });
        }
      });
    }

    return Array.from(deptMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, institutionSections]);

  const availableSections = useMemo(() => {
    if (!formData.department) {
      return institutionSections;
    }
    const filtered = institutionSections.filter((sec) => {
      const secDeptName = sec.department?.name || '';
      const secDeptCode = sec.department?.code || '';
      return (
        secDeptName.toUpperCase() === formData.department.toUpperCase() ||
        secDeptCode.toUpperCase() === formData.department.toUpperCase()
      );
    });
    return filtered.length > 0 ? filtered : institutionSections;
  }, [institutionSections, formData.department]);

  useEffect(() => {
    if (availableDepartments.length > 0) {
      const isValid = availableDepartments.some(
        (dept) => dept.name.toUpperCase() === formData.department.toUpperCase()
      );
      if (!isValid) {
        setFormData((prev) => ({ ...prev, department: availableDepartments[0].name }));
      }
    } else {
      setFormData((prev) => ({ ...prev, department: '' }));
    }
  }, [availableDepartments]);

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
          department: formData.department,
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
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 group" aria-label="CampAssist Home">
          <img src={logoIcon} alt="CampAssist Logo" className="h-12 w-12 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-wordmark text-3xl font-extrabold flex items-center">
            <span className="text-[#19A3E9]">Camp</span><span className="text-[#D946A8]">Assist</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Or{' '}
          <Link to="/login" className="font-semibold text-[#19A3E9] hover:text-[#D946A8] transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass py-8 px-4 sm:rounded-3xl sm:px-10 border border-[var(--color-border)] shadow-xl">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-3 text-rose-400 items-start">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleRegister}>
            <div>
              <label htmlFor="reg-fullname" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[var(--color-muted)]" />
                </div>
                <input
                  id="reg-fullname"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--color-muted)]" />
                </div>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--color-muted)]" />
                </div>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-institution" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Institution Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-[var(--color-muted)]" />
                </div>
                <select
                  id="reg-institution"
                  name="institutionCode"
                  required
                  value={formData.institutionCode}
                  onChange={handleChange}
                  className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs appearance-none cursor-pointer"
                >
                  {institutions.length === 0 && <option value="" className="bg-[#1B1733] text-white">Loading institutions...</option>}
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.code} className="bg-[#1B1733] text-white">
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--color-muted)]">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="reg-department" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <BookOpen className="h-5 w-5 text-[var(--color-muted)]" />
                </div>
                <select
                  id="reg-department"
                  name="department"
                  required={availableDepartments.length > 0}
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs appearance-none cursor-pointer"
                >
                  {availableDepartments.length === 0 ? (
                    <option value="" className="bg-[#1B1733] text-white">
                      {institutions.length === 0 ? 'Loading departments...' : 'General / All Departments'}
                    </option>
                  ) : (
                    <>
                      <option value="" className="bg-[#1B1733] text-white">Select a department...</option>
                      {availableDepartments.map((dept, idx) => (
                        <option key={dept.id || idx} value={dept.name} className="bg-[#1B1733] text-white">
                          {dept.name} {dept.code ? `(${dept.code})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--color-muted)]">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-rollnumber" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Roll Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-[var(--color-muted)]" />
                  </div>
                  <input
                    id="reg-rollnumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs"
                    placeholder="21BCS001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-section" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">Section</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-[var(--color-muted)]" />
                  </div>
                  <select
                    id="reg-section"
                    name="section"
                    required={availableSections.length > 0}
                    disabled={availableSections.length === 0}
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--glass-sub-surface)] text-[var(--color-text)] focus:outline-none focus:border-[#19A3E9] focus:ring-2 focus:ring-[#19A3E9]/20 transition text-sm shadow-xs appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableSections.length === 0 ? (
                      <option value="" disabled className="bg-[#1B1733] text-white">
                        {institutions.length === 0 ? 'Loading...' : 'No sections available'}
                      </option>
                    ) : (
                      <>
                        <option value="" disabled className="bg-[#1B1733] text-white">Select a section...</option>
                        {availableSections.map(sec => (
                          <option key={sec.id} value={sec.name} className="bg-[#1B1733] text-white">{sec.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--color-muted)]">
                    <ChevronDown className="h-4 w-4" />
                  </div>
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







