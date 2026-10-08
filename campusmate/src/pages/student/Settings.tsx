import React, { useState } from 'react';
import { User, Bell, Shield, Camera, Save } from 'lucide-react';

import { apiClient } from '../../services/apiClient';

export const Settings = () => {
  const [profile, setProfile] = React.useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'Profile' | 'Notifications' | 'Security'>('Profile');

  React.useEffect(() => {
    let isMounted = true;

    apiClient('/users/me')
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        const nameParts = (data?.profile?.fullName || '').trim().split(/\s+/).filter(Boolean);
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' '));
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
      const updatedProfile = await apiClient('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName }),
      });
      setProfile((current: any) => ({
        ...current,
        profile: { ...current?.profile, ...updatedProfile, fullName },
      }));
      setSaveMessage('Profile saved.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setSavingProfile(false);
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
                  <label className="text-sm font-semibold text-slate-700">Semester</label>
                  <input type="text" value={profile?.profile?.semester || ''} readOnly aria-readonly="true" placeholder="Not provided" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none font-medium" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Communication Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Email Notifications</h4>
                    <p className="text-sm text-slate-500 font-medium">Receive daily summaries and critical alerts via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 backdrop-blur-xl after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">SMS Alerts</h4>
                    <p className="text-sm text-slate-500 font-medium">Get text messages for class cancellations.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 backdrop-blur-xl after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Update Password</h3>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button onClick={saveProfile} disabled={activeTab !== 'Profile' || loadingProfile || savingProfile || !profile} className="flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50">
              <Save size={18} /> {savingProfile ? 'Saving...' : saveMessage || 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

