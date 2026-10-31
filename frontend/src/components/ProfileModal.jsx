import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { X, User, Mail, ShieldCheck, Calendar, Lock, LogOut, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function ProfileModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  if (!isOpen || !isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Non-blocking fallback
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      dispatch(logout());
      onClose();
    }
  };

  const displayName = user?.name || 'Investor';
  const displayEmail = user?.email || 'user@example.com';
  const initial = (displayName || displayEmail)[0].toUpperCase();
  const isVerified = user?.isEmailVerified !== false;

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent Member';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md flex flex-col rounded-2xl shadow-2xl overflow-hidden border"
        style={{ 
          background: 'var(--bg-card)', 
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b" 
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                Account Profile
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Manage your MarketPulse trading account
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* User Card */}
          <div 
            className="flex items-center gap-4 p-4 rounded-xl border"
            style={{ 
              background: 'var(--bg-primary)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </h4>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 size={11} />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs truncate text-[var(--text-muted)] mt-0.5">
                {displayEmail}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  {user?.role === 'admin' ? 'Administrator' : 'Verified Investor'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Overview */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Account Information
            </h5>

            <div 
              className="rounded-xl border divide-y overflow-hidden"
              style={{ 
                background: 'var(--bg-primary)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              {/* Email item */}
              <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Mail size={14} className="text-[var(--text-muted)]" />
                  <span>Email Status</span>
                </span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>{isVerified ? 'Verified' : 'Pending Verification'}</span>
                </span>
              </div>

              {/* Status item */}
              <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <ShieldCheck size={14} className="text-[var(--text-muted)]" />
                  <span>Account Status</span>
                </span>
                <span className="font-medium text-emerald-500">
                  {user?.status === 'suspended' ? 'Suspended' : 'Active'}
                </span>
              </div>

              {/* Member Since item */}
              <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar size={14} className="text-[var(--text-muted)]" />
                  <span>Member Since</span>
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {formattedDate}
                </span>
              </div>

              {/* Security item */}
              <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Lock size={14} className="text-[var(--text-muted)]" />
                  <span>Security & 2FA</span>
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {user?.isTwoFactorEnabled ? '2FA Enabled' : 'Standard Password'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center transition-all shadow-sm active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
