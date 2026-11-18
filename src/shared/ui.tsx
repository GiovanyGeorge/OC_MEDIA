/**
 * Shared UI Components — OC Media Platform
 * Phase 3: Reusable components for admin and member dashboards.
 */

import React, { type ReactNode, useState } from 'react';
import { X, AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { useI18n } from '../lib/i18n';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`bg-brand-card border border-brand-border rounded-2xl ${
        padding ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'blue' | 'cyan' | 'orange' | 'emerald' | 'red' | 'yellow' | 'slate';
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-brand-blue bg-blue-500/10 border-blue-500/20',
    cyan: 'text-brand-cyan bg-cyan-500/10 border-cyan-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 truncate">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-brand-dark rounded-2xl border border-brand-border w-full ${maxWidth} shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}) {
  const { t } = useI18n();
  if (!isOpen) return null;

  const btnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-brand-blue hover:bg-brand-blueHover text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark rounded-2xl border border-brand-border w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 ${btnClass}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Spinner
// ---------------------------------------------------------------------------
export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      {text && <p className="text-xs text-slate-400">{text}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-brand-border flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
      <h4 className="text-sm font-bold text-slate-300">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-xs">{description}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
export type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let toastListeners: ((toasts: ToastData[]) => void)[] = [];
let currentToasts: ToastData[] = [];

function notifyListeners() {
  toastListeners.forEach(fn => fn([...currentToasts]));
}

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    notifyListeners();
  }, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  const bgMap: Record<ToastType, string> = {
    success: 'bg-emerald-600/90 border-emerald-500/30',
    error: 'bg-red-600/90 border-red-500/30',
    info: 'bg-brand-blue/90 border-blue-500/30',
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white border shadow-lg animate-fadeIn ${bgMap[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export function Badge({
  children,
  color = 'blue',
}: {
  children: ReactNode;
  color?: 'blue' | 'cyan' | 'orange' | 'emerald' | 'red' | 'yellow' | 'slate';
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/15 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${colorMap[color]}`}>
      {children}
    </span>
  );
}
