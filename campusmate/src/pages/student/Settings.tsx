import React, { useState } from 'react';
import { User, Bell, Shield, Camera, Save, Sparkles, MessageSquare, Trash2, Mail, Loader2 } from 'lucide-react';

import { updatePassword as fbUpdatePassword, sendPasswordResetEmail, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';

export interface ToneOption {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  preview: string;
  disabled?: boolean;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'buddy',
    label: 'Buddy',
    emoji: '🤝',
    tagline: 'Friendly, encouraging & casual',
    description: 'A loyal classmate cheering you on without any pressure.',
    preview: '“Hey buddy, attendance is looking good! Keep it up.”',
  },
  {
    id: 'bro',
    label: 'Bro Mode',
    emoji: '🔥',
    tagline: 'Playful, energetic & hustle-oriented',
    description: 'Straight-talking gym-bro energy to keep your head in the game.',
    preview: '“Bro, attendance is slipping. Get to class and lock in!”',
  },
  {
    id: 'baddie',
    label: 'Baddie',
    emoji: '💅',
    tagline: 'Confident, empowering & sharp',
    description: 'Unapologetic, stylish motivation to stay serving every single day.',
    preview: '“Your attendance is serving, baddie. Keep that energy!”',
  },
  {
    id: 'queen',
    label: 'Queen Energy',
    emoji: '👑',
    tagline: 'Supportive, regal & uplifting',
    description: 'Elevated affirmations reminding you to protect your crown and GPA.',
    preview: '“You’re ruling this semester, queen. Don’t drop your crown!”',
  },
  {
    id: 'genz',
    label: 'Gen-Z Slang',
    emoji: '⚡',
    tagline: 'Slang-heavy, ultra-casual & funny',
    description: 'Packed with real slang: no cap, fr, valid, lock in, cooked, and W’s.',
    preview: '“No cap, your attendance is so valid rn. Don’t get cooked!”',
  },
  {
    id: 'meme',
    label: 'Funny / Meme Mode',
    emoji: '🎭',
    tagline: 'Ironic, dramatic & self-aware',
    description: 'Hilarious gaming, anime and campus survival meme references.',
    preview: '“Attendance at 76%? You are living on the edge of the anime protagonist plot armor.”',
  },
  {
    id: 'hype',
    label: 'Hype Mode',
    emoji: '🚀',
    tagline: 'High-energy coach & pure hype',
    description: 'Caps-lock motivation and unstoppable momentum for champions.',
    preview: '“LET’S GOOO! You’re crushing it! Keep the streak alive!”',
  },
  {
    id: 'supportive',
    label: 'Soft & Supportive',
    emoji: '🌸',
    tagline: 'Gentle, reassuring & calm',
    description: 'Low-stress, comforting nudges that prioritize your mental well-being.',
    preview: '“Take a deep breath, you’re doing your best and that’s more than enough. You got this.”',
  },
  {
    id: 'neutral',
    label: 'Professional / Neutral',
    emoji: '👔',
    tagline: 'Objective, clean & formal',
    description: 'Academic reporting with clear percentages and zero fluff.',
    preview: '“Current attendance stands at 82%. You meet the institutional threshold.”',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    emoji: '🎯',
    tagline: 'Very short, punchy & direct',
    description: 'No adjectives, no chatter. Just the numbers that matter.',
    preview: '“82% attendance. On track.”',
  },
  {
    id: 'custom',
    label: 'Custom Style',
    emoji: '✨',
    tagline: 'Your custom AI voice',
    description: 'Train your custom vocabulary and tone parameters.',
    preview: 'Coming Soon — Personalize custom vocabulary and humor thresholds.',
    disabled: true,
  },
];

export const Settings = () => {
  const [profile, setProfile] = React.useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentType, setStudentType] = useState<'HOSTELLER' | 'DAY_SCHOLAR'>('DAY_SCHOLAR');
  const [gender, setGender] = useState('Prefer not to say');
  const [tonePreference, setTonePreference] = useState('buddy');
  const [department, setDepartment] = useState('');
  const [departmentsList, setDepartmentsList] = useState<string[]>([
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Chemical Engineering',
    'Artificial Intelligence & Data Science'
  ]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [activeTab, setActiveTab] = useState<'Profile' | 'Notifications' | 'Security'>('Profile');
  const [notificationPreferences, setNotificationPreferences] = useState({
    classUpdates: true,
    attendance: true,
    announcements: true
  });

  React.useEffect(() => {
    let isMounted = true;

    apiClient('/departments')
      .then((data) => {
        if (!isMounted || !Array.isArray(data)) return;
        const names = data.map((d: any) => d.name || d.code).filter(Boolean);
        if (names.length > 0) {
          setDepartmentsList(prev => Array.from(new Set([...names, ...prev])));
        }
      })
      .catch((err) => console.warn('Could not fetch departments for selector:', err));

    apiClient('/users/me')
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        const nameParts = (data?.profile?.fullName || '').trim().split(/\s+/).filter(Boolean);
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' '));
        const rawType = data?.profile?.studentType || data?.profile?.residency || data?.studentType;
        if (rawType) {
          setStudentType(String(rawType).toUpperCase().includes('HOSTEL') ? 'HOSTELLER' : 'DAY_SCHOLAR');
        }
        const rawGender = data?.profile?.gender || data?.gender || data?.academicIdentity?.gender;
        if (rawGender) {
          setGender(rawGender);
        }
        const rawTone = data?.profile?.tonePreference || data?.tonePreference || data?.academicIdentity?.tonePreference;
        if (rawTone) {
          setTonePreference(rawTone);
        }
        const rawDept = data?.student?.section?.department?.name || data?.profile?.department || data?.department || '';
        if (rawDept) {
          setDepartment(rawDept);
        }
        setProfileError('');
      })
      .catch((error) => {
        if (isMounted) setProfileError(error instanceof Error ? error.message : 'Unable to load your account.');
      })
      .finally(() => {
        if (isMounted) setLoadingProfile(false);
      });

    return () => { isMounted = false; };
  }, []);

  const saveProfile = async () => {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName) {
      setProfileError('Enter your first or last name before saving.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setSaveMessage('');
    try {
      const payload = {
        fullName,
        studentType,
        residency: studentType === 'HOSTELLER' ? 'HOSTELER' : 'DAY_SCHOLAR',
        gender,
        tonePreference,
        department: department.trim(),
      };
      const updatedProfile = await apiClient('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setProfile((current: any) => ({
        ...current,
        profile: { ...current?.profile, ...updatedProfile, ...payload },
        tonePreference,
      }));
      setSaveMessage('Profile and department preferences saved.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  const handleSendResetEmail = async () => {
    if (!auth.currentUser?.email) {
      setSecurityError('No email associated with current account session.');
      return;
    }
    setSendingResetEmail(true);
    setSecurityError('');
    setSecurityMessage('');
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setSecurityMessage(`Password reset link sent to ${auth.currentUser.email}! Check your inbox (and spam folder).`);
    } catch (error: any) {
      setSecurityError(error instanceof Error ? error.message : 'Unable to send password reset email.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSecurityError('');
    setSecurityMessage('');
    if (newPassword.length < 8) {
      setSecurityError('Use a password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('The passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (auth.currentUser) {
        await fbUpdatePassword(auth.currentUser, newPassword);
      } else {
        throw new Error('Please sign in again before updating your password.');
      }
      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage('Password updated.');
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        setSecurityError('Direct password update requires a recent sign in. Please sign out and sign in again, or click "Send reset link to my email" below.');
      } else {
        setSecurityError(error instanceof Error ? error.message : 'Unable to update your password.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setDeleteError('Confirmation mismatch. Please type DELETE_MY_ACCOUNT exactly as shown to confirm.');
      return;
    }
    setDeletingAccount(true);
    setDeleteError('');
    try {
      const res: any = await authService.deleteAccount('DELETE_MY_ACCOUNT');
      if (res?.errors && res.errors.length > 0) {
        setDeleteError(`Account deletion reported warnings: ${res.errors.join('; ')}`);
        setDeletingAccount(false);
        return;
      }
      if (res && res.success === false) {
        setDeleteError('Failed to delete account. Please try again or contact support.');
        setDeletingAccount(false);
        return;
      }
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Sign out error:', e);
      }
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('token') || err?.message?.toLowerCase().includes('unauthorized') || err?.message?.toLowerCase().includes('expired')) {
        setDeleteError('Your session has expired. Please sign in again before deleting your account.');
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
      }
      setDeletingAccount(false);
    }
  };

  const fullName = profile?.profile?.fullName?.trim() || '';
  const assignedSection = profile?.student?.section?.name || profile?.profile?.section || '';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center glass p-6 rounded-2xl border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Account Settings</h1>
          <p className="text-[var(--color-muted)] font-medium mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2 glass rounded-2xl p-4 border border-[var(--color-border)] h-max">
          <button 
            onClick={() => setActiveTab('Profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Profile' ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30' : 'text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)]'
            }`}
          >
            <User size={18} /> Edit Profile
          </button>
          <button 
            onClick={() => setActiveTab('Notifications')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Notifications' ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30' : 'text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)]'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('Security')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Security' ? 'bg-[rgba(25,163,233,0.15)] text-[#19A3E9] border border-[#19A3E9]/30' : 'text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text)]'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 glass rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
          {activeTab === 'Profile' && (
            <div className="space-y-8">
              {loadingProfile && <p role="status" className="text-sm text-[var(--color-muted)]">Loading account details...</p>}
              {profileError && <p role="alert" className="text-sm text-red-500">{profileError}</p>}
              <div className="flex items-center gap-6 pb-6 border-b border-[var(--color-border)]">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-black/5 dark:ring-white/10">
                    {profile?.profile?.avatarUrl ? (
                      <img src={profile.profile.avatarUrl} alt={`${fullName || 'Account'} profile`} className="w-full h-full object-cover" />
                    ) : fullName ? (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=7140D8&color=fff&size=128`} alt={`${fullName} avatar`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-[var(--color-muted)]"><User size={32} /></div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[var(--color-text)]">{loadingProfile ? 'Loading profile' : fullName || 'Name not set'}</h3>
                  <p className="text-[var(--color-muted)] font-medium">{profile?.email || (loadingProfile ? '' : 'Email not available')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">First Name</label>
                  <input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={loadingProfile || savingProfile} autoComplete="given-name" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium disabled:opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Last Name</label>
                  <input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={loadingProfile || savingProfile} autoComplete="family-name" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium disabled:opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Email</label>
                  <input type="email" value={profile?.email || ''} readOnly aria-readonly="true" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-muted)] opacity-80 cursor-not-allowed outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Roll Number</label>
                  <input type="text" value={profile?.profile?.rollNumber || ''} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-muted)] opacity-80 cursor-not-allowed outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Section</label>
                  <input type="text" value={assignedSection} readOnly aria-readonly="true" placeholder="Not assigned" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-muted)] opacity-80 cursor-not-allowed outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Department</label>
                  <div className="space-y-2">
                    <select
                      value={departmentsList.includes(department) ? department : (department ? 'OTHER' : '')}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') {
                          if (departmentsList.includes(department)) setDepartment('');
                        } else {
                          setDepartment(e.target.value);
                        }
                      }}
                      disabled={loadingProfile || savingProfile}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium"
                    >
                      <option value="">Select your department</option>
                      {departmentsList.map((deptName) => (
                        <option key={deptName} value={deptName}>
                          {deptName}
                        </option>
                      ))}
                      <option value="OTHER">Other / Custom Department</option>
                    </select>
                    {(!departmentsList.includes(department) && department !== '') && (
                      <input
                        type="text"
                        placeholder="Type custom department name"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={loadingProfile || savingProfile}
                        className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium placeholder-[var(--color-muted)]"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Institution</label>
                  <input type="text" value={profile?.Institution?.name || profile?.Institution?.code || ''} readOnly aria-readonly="true" placeholder="Not assigned" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-muted)] opacity-80 cursor-not-allowed outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Semester</label>
                  <input type="text" value={profile?.profile?.semester || ''} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-muted)] opacity-80 cursor-not-allowed outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Living Arrangement</label>
                  <select
                    value={studentType}
                    onChange={(e) => setStudentType(e.target.value as any)}
                    disabled={loadingProfile || savingProfile}
                    className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium"
                  >
                    <option value="DAY_SCHOLAR">🎒 Day Scholar</option>
                    <option value="HOSTELLER">🏠 Hosteller (Hostel Resident)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Gender (Optional)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loadingProfile || savingProfile}
                    className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Boy">Boy / Male</option>
                    <option value="Girl">Girl / Female</option>
                    <option value="Another identity">Another identity</option>
                  </select>
                </div>
              </div>

              {/* Communication Style / Message Tone Preference */}
              <div className="pt-6 border-t border-[var(--color-border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      Communication Style / Message Tone
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Choose how CampAssist speaks to you across attendance alerts, timetable reminders, and campus nudges.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto text-xs px-3 py-1 bg-[rgba(25,163,233,0.15)] text-[#19A3E9] font-bold rounded-xl border border-[#19A3E9]/30 flex items-center gap-1.5 shadow-sm">
                    <span>{TONE_OPTIONS.find(t => t.id === tonePreference)?.emoji || '🤝'}</span>
                    Active: {TONE_OPTIONS.find(t => t.id === tonePreference)?.label || 'Buddy'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TONE_OPTIONS.map((tone) => {
                    const isSelected = tonePreference === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        disabled={tone.disabled || loadingProfile || savingProfile}
                        onClick={() => !tone.disabled && setTonePreference(tone.id)}
                        className={`text-left p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                          tone.disabled
                            ? 'opacity-60 glass border-dashed border-[var(--color-border)] cursor-not-allowed'
                            : isSelected
                            ? 'bg-[rgba(25,163,233,0.15)] border-[#19A3E9] ring-2 ring-[#19A3E9]/20 shadow-sm'
                            : 'glass border-[var(--color-border)] hover:border-[#19A3E9]/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
                              <span>{tone.emoji}</span> {tone.label}
                            </span>
                            {tone.disabled ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md glass text-[var(--color-muted)] border border-[var(--color-border)]">
                                Coming Soon
                              </span>
                            ) : isSelected ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#19A3E9] ring-4 ring-[#19A3E9]/20" />
                            ) : null}
                          </div>
                          <p className="text-[11px] font-semibold text-[var(--color-muted)] mb-1">{tone.tagline}</p>
                          <p className="text-[11px] text-[var(--color-muted)] leading-snug">{tone.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Preview Card */}
                {(() => {
                  const activeTone = TONE_OPTIONS.find((t) => t.id === tonePreference) || TONE_OPTIONS[0];
                  return (
                    <div className="p-4 rounded-2xl glass border border-[var(--color-border)] shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#19A3E9] flex items-center gap-1.5">
                          <span>{activeTone.emoji}</span> Live Tone Preview — {activeTone.label}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)] font-medium">Sample Attendance Warning</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text)] italic">
                        {activeTone.preview}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-4">Notification Preferences</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['classUpdates', 'Class updates', 'Room changes and cancellations'],
                  ['attendance', 'Attendance', 'Attendance reminders and alerts'],
                  ['announcements', 'Announcements', 'Section and institution announcements']
                ].map(([key, label, description]) => (
                  <label key={key} className="cursor-pointer rounded-xl border border-[var(--color-border)] glass p-4 transition hover:border-[#19A3E9]/60">
                    <input
                      type="checkbox"
                      checked={notificationPreferences[key as keyof typeof notificationPreferences]}
                      onChange={event => setNotificationPreferences(current => ({ ...current, [key]: event.target.checked }))}
                      className="mb-3 h-4 w-4 rounded border-[var(--color-border)] text-[#19A3E9] focus:ring-[#19A3E9]"
                    />
                    <span className="block text-sm font-bold text-[var(--color-text)]">{label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--color-muted)]">{description}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--color-muted)]">Changes are stored in this browser session. Connect the preference API to persist them across devices.</p>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-10">
              <form onSubmit={updatePassword} className="space-y-8">
                <h3 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-4">Update Password</h3>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-semibold text-[var(--color-text)]">New Password</label>
                    <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={savingPassword} className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium disabled:opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-semibold text-[var(--color-text)]">Confirm New Password</label>
                    <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={savingPassword} className="w-full p-3 rounded-xl border border-[var(--color-border)] glass text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition font-medium disabled:opacity-60" />
                  </div>
                </div>
                {securityError && <p role="alert" className="text-sm text-red-500">{securityError}</p>}
                {securityMessage && <p role="status" className="text-sm text-emerald-500">{securityMessage}</p>}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={sendingResetEmail}
                    className="text-sm font-medium text-[#19A3E9] hover:text-[var(--brand-purple)] transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {sendingResetEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {sendingResetEmail ? 'Sending link...' : 'Send reset link to my email'}
                  </button>

                  <button type="submit" disabled={savingPassword} className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50">
                    <Save size={18} /> {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Account Deletion */}
              <div className="border-t border-rose-500/20 pt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rose-500">Danger Zone</h3>
                    <p className="text-sm text-[var(--color-muted)] mt-0.5">
                      Permanently delete your CampusAssist account and all associated data.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 leading-relaxed space-y-2">
                  <p className="font-semibold text-rose-400">
                    Warning: This action is irreversible and cannot be undone.
                  </p>
                  <p>
                    Deleting your account permanently removes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-rose-300">
                    <li>Student profile, enrollment, and academic records in PostgreSQL</li>
                    <li>Timetable entries, attendance records, and section assignments</li>
                    <li>Notifications, reminder preferences, and feedback history</li>
                    <li>Firebase Authentication login credentials and active sessions</li>
                  </ul>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setDeleteConfirmation('');
                      setDeleteError('');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 font-bold hover:bg-rose-500/10 transition text-sm"
                  >
                    <Trash2 size={16} /> Delete My Account
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl border-2 border-rose-500/40 glass space-y-4 shadow-sm">
                    <div className="space-y-1">
                      <label htmlFor="confirm-delete-input" className="block text-xs font-bold text-[var(--color-text)]">
                        To confirm deletion, please type <code className="bg-white/10 px-1.5 py-0.5 rounded text-rose-400 font-mono">DELETE_MY_ACCOUNT</code> below:
                      </label>
                      <input
                        id="confirm-delete-input"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => {
                          setDeleteConfirmation(e.target.value);
                          if (deleteError) setDeleteError('');
                        }}
                        placeholder="DELETE_MY_ACCOUNT"
                        disabled={deletingAccount}
                        className="w-full p-2.5 rounded-xl border border-rose-500/30 glass font-mono text-sm focus:border-rose-500 text-[var(--color-text)] outline-none"
                      />
                    </div>

                    {deleteError && (
                      <p role="alert" className="text-xs font-medium text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/30">
                        {deleteError}
                      </p>
                    )}

                    <div className="flex items-center gap-3 justify-end pt-2">
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmation('');
                          setDeleteError('');
                        }}
                        className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:bg-white/5 font-semibold text-sm transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deletingAccount || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 transition text-sm shadow-sm"
                      >
                        {deletingAccount ? 'Deleting Account...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
              {saveMessage ? (
                <p role="status" className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {saveMessage}
                </p>
              ) : profileError ? (
                <p role="alert" className="text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl">
                  {profileError}
                </p>
              ) : <div />}
              <button
                onClick={saveProfile}
                disabled={loadingProfile || savingProfile || !profile}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                <Save size={18} /> {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

