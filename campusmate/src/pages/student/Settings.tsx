import React, { useState } from 'react';
import { User, Bell, Shield, Camera, Save, Sparkles, MessageSquare, Trash2 } from 'lucide-react';

import { updatePassword as fbUpdatePassword, signOut as fbSignOut } from 'firebase/auth';
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
      setSaveMessage('Profile and communication tone saved.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setSavingProfile(false);
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
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : 'Unable to update your password.');
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
  const department = profile?.student?.section?.department?.name || profile?.profile?.department || '';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2 bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-100 shadow-sm h-max">
          <button 
            onClick={() => setActiveTab('Profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User size={18} /> Edit Profile
          </button>
          <button 
            onClick={() => setActiveTab('Notifications')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('Security')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {activeTab === 'Profile' && (
            <div className="space-y-8">
              {loadingProfile && <p role="status" className="text-sm text-slate-500">Loading account details...</p>}
              {profileError && <p role="alert" className="text-sm text-red-700">{profileError}</p>}
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-50">
                    {profile?.profile?.avatarUrl ? (
                      <img src={profile.profile.avatarUrl} alt={`${fullName || 'Account'} profile`} className="w-full h-full object-cover" />
                    ) : fullName ? (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&size=128`} alt={`${fullName} avatar`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><User size={32} /></div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{loadingProfile ? 'Loading profile' : fullName || 'Name not set'}</h3>
                  <p className="text-slate-500 font-medium">{profile?.email || (loadingProfile ? '' : 'Email not available')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={loadingProfile || savingProfile} autoComplete="given-name" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium disabled:opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={loadingProfile || savingProfile} autoComplete="family-name" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium disabled:opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" value={profile?.email || ''} readOnly aria-readonly="true" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Roll Number</label>
                  <input type="text" value={profile?.profile?.rollNumber || ''} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Section</label>
                  <input type="text" value={assignedSection} readOnly aria-readonly="true" placeholder="Not assigned" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <input type="text" value={department} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Institution</label>
                  <input type="text" value={profile?.Institution?.name || profile?.Institution?.code || ''} readOnly aria-readonly="true" placeholder="Not assigned" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Semester</label>
                  <input type="text" value={profile?.profile?.semester || ''} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Living Arrangement</label>
                  <select
                    value={studentType}
                    onChange={(e) => setStudentType(e.target.value as any)}
                    disabled={loadingProfile || savingProfile}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-400 outline-none transition font-medium"
                  >
                    <option value="DAY_SCHOLAR">🎒 Day Scholar</option>
                    <option value="HOSTELLER">🏠 Hosteller (Hostel Resident)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Gender (Optional)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loadingProfile || savingProfile}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-400 outline-none transition font-medium"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Boy">Boy / Male</option>
                    <option value="Girl">Girl / Female</option>
                    <option value="Another identity">Another identity</option>
                  </select>
                </div>
              </div>

              {/* Communication Style / Message Tone Preference */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      Communication Style / Message Tone
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose how CampAssist speaks to you across attendance alerts, timetable reminders, and campus nudges.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto text-xs px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 flex items-center gap-1.5 shadow-sm">
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
                            ? 'opacity-60 bg-slate-50/70 border-dashed border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-white/90 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tone.emoji}</span> {tone.label}
                            </span>
                            {tone.disabled ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                                Coming Soon
                              </span>
                            ) : isSelected ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                            ) : null}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 mb-1">{tone.tagline}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">{tone.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Preview Card */}
                {(() => {
                  const activeTone = TONE_OPTIONS.find((t) => t.id === tonePreference) || TONE_OPTIONS[0];
                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 border border-blue-100/90 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                          <span>{activeTone.emoji}</span> Live Tone Preview — {activeTone.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">Sample Attendance Warning</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 italic">
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
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Notification Preferences</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['classUpdates', 'Class updates', 'Room changes and cancellations'],
                  ['attendance', 'Attendance', 'Attendance reminders and alerts'],
                  ['announcements', 'Announcements', 'Section and institution announcements']
                ].map(([key, label, description]) => (
                  <label key={key} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200">
                    <input
                      type="checkbox"
                      checked={notificationPreferences[key as keyof typeof notificationPreferences]}
                      onChange={event => setNotificationPreferences(current => ({ ...current, [key]: event.target.checked }))}
                      className="mb-3 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="block text-sm font-bold text-slate-800">{label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Changes are stored in this browser session. Connect the preference API to persist them across devices.</p>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-10">
              <form onSubmit={updatePassword} className="space-y-8">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Update Password</h3>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">New Password</label>
                    <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={savingPassword} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium disabled:opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                    <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={savingPassword} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium disabled:opacity-60" />
                  </div>
                </div>
                {securityError && <p role="alert" className="text-sm text-red-700">{securityError}</p>}
                {securityMessage && <p role="status" className="text-sm text-emerald-700">{securityMessage}</p>}
                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button type="submit" disabled={savingPassword} className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50">
                    <Save size={18} /> {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Account Deletion */}
              <div className="border-t border-rose-100 pt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rose-900">Danger Zone</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Permanently delete your CampusAssist account and all associated data.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-800 leading-relaxed space-y-2">
                  <p className="font-semibold text-rose-900">
                    Warning: This action is irreversible and cannot be undone.
                  </p>
                  <p>
                    Deleting your account permanently removes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-rose-700">
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-300 text-rose-700 font-bold hover:bg-rose-50 transition text-sm"
                  >
                    <Trash2 size={16} /> Delete My Account
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl border-2 border-rose-300 bg-white space-y-4 shadow-sm">
                    <div className="space-y-1">
                      <label htmlFor="confirm-delete-input" className="block text-xs font-bold text-slate-700">
                        To confirm deletion, please type <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono">DELETE_MY_ACCOUNT</code> below:
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
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:border-rose-500 outline-none"
                      />
                    </div>

                    {deleteError && (
                      <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
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
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition"
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
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {saveMessage ? (
                <p role="status" className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {saveMessage}
                </p>
              ) : profileError ? (
                <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl">
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

