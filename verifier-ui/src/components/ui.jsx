// Shared Tailwind UI primitives used across all dashboards
import React from 'react';
import { Loader2 } from 'lucide-react';

/* ── Dashboard wrapper ───────────────────── */
export const PageWrapper = ({ children }) => (
  <div className="min-h-screen"
    style={{ background: 'radial-gradient(circle at 50% 0%, #f8fafc 0%, #cbd5e1 100%)' }}>
    <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
  </div>
);

/* ── Top header bar ──────────────────────── */
export const DashHeader = ({ logo, title, children }) => (
  <header className="flex items-center justify-between mb-8 px-6 py-4
                     glass border border-slate-200 rounded-2xl shadow-sm animate-slide-down">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center
                      shadow-[0_4px_12px_rgba(99,102,241,0.3)] text-white shrink-0">
        {logo}
      </div>
      <h1 className="font-heading text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
    </div>
    <div className="flex items-center gap-3">{children}</div>
  </header>
);

/* ── User badge (role pill) ──────────────── */
export const UserBadge = ({ icon, label }) => (
  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200
               bg-slate-50 text-slate-600 text-sm font-semibold">
    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">
      {icon}
    </span>
    {label}
  </div>
);

/* ── Button variants ─────────────────────── */
export const BtnPrimary = ({ children, onClick, type = 'button', disabled, className = '' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                shadow-[0_4px_14px_-1px_rgba(79,70,229,0.25)]
                hover:shadow-[0_8px_20px_-2px_rgba(79,70,229,0.35)]
                transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${className}`}>
    {children}
  </button>
);

export const BtnMuted = ({ children, onClick }) => (
  <button onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200
               bg-slate-50/60 text-slate-600 text-sm font-semibold
               hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition">
    {children}
  </button>
);

export const BtnOutline = ({ children, onClick, disabled, title }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200
               text-slate-500 text-xs font-semibold bg-transparent
               hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition
               disabled:opacity-50 disabled:cursor-not-allowed">
    {children}
  </button>
);

export const BtnRevoke = ({ children, onClick, disabled, title }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200
               bg-red-50 text-red-600 text-xs font-semibold
               hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition
               disabled:opacity-50 disabled:cursor-not-allowed">
    {children}
  </button>
);

export const BtnLogout = ({ children, onClick }) => (
  <button onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200
               bg-red-50 text-red-600 text-sm font-semibold
               hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition">
    {children}
  </button>
);

/* ── White card ──────────────────────────── */
export const Card = ({ children, className = '' }) => (
  <div className={`glass border border-slate-200 rounded-2xl shadow-card
                   hover:shadow-cardHover hover:border-indigo-200 transition-all duration-300 p-8 ${className}`}>
    {children}
  </div>
);

/* ── Section heading ─────────────────────── */
export const SectionTitle = ({ children, badge }) => (
  <div className="flex items-center justify-between mb-2">
    <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">{children}</h2>
    {badge}
  </div>
);

export const SectionSubtitle = ({ children }) => (
  <p className="text-sm text-slate-500 leading-relaxed mb-7">{children}</p>
);

/* ── Form field ──────────────────────────── */
export const Field = ({ label, icon, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
          {icon}
        </span>
      )}
      {children}
    </div>
  </div>
);

export const inputCls = (warn = false) =>
  `w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400
   outline-none transition
   ${warn
    ? 'border border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
    : 'border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}
   disabled:opacity-50 disabled:cursor-not-allowed`;

/* ── Drop zone ───────────────────────────── */
export const DropZone = ({ mini = false, children, onChange, accept, required, disabled }) => (
  <div className={`relative flex flex-col items-center justify-center gap-2 text-center
                   border-2 border-dashed border-indigo-200 rounded-2xl bg-slate-50/80
                   hover:border-indigo-500 hover:bg-indigo-50/40 transition cursor-pointer
                   ${mini ? 'py-5 rounded-xl min-h-[90px]' : 'py-10 min-h-[130px]'}`}>
    <input type="file" accept={accept} onChange={onChange}
      required={required} disabled={disabled}
      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
    {children}
  </div>
);

/* ── Badge ───────────────────────────────── */
export const Badge = ({ variant = 'success', children }) => {
  const cls = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-red-50   text-red-600   border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }[variant] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    issuer: { label: 'Issuer', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    normal_user: { label: 'Verifier', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    master_admin: { label: 'Master Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    super_admin: { label: 'Super Admin', cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const { label, cls } = map[role] || { label: role, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {label}
    </span>
  );
};

/* ── Table primitives ────────────────────── */
export const Table = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
    <table className="w-full min-w-[600px] border-collapse">{children}</table>
  </div>
);

export const Th = ({ children, center }) => (
  <th className={`px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest
                  border-b border-slate-200 bg-slate-50/90 whitespace-nowrap
                  ${center ? 'text-center' : 'text-left'}`}>
    {children}
  </th>
);

export const Td = ({ children, center }) => (
  <td className={`px-5 py-4 text-sm text-slate-800 border-b border-slate-100 align-middle
                  ${center ? 'text-center' : 'text-left'}`}>
    {children}
  </td>
);

export const EmptyRow = ({ cols, message }) => (
  <tr>
    <td colSpan={cols}
      className="text-center px-6 py-14 text-sm text-slate-400 italic border-b border-slate-100">
      {message}
    </td>
  </tr>
);

export const RecipientAvatar = ({ icon, bgCls = 'bg-indigo-100 text-indigo-600' }) => (
  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${bgCls}`}>
    {icon}
  </span>
);

export const CredBadge = ({ id, onClick }) => (
  <button onClick={onClick}
    className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200
               hover:border-indigo-400 hover:text-indigo-700 transition whitespace-nowrap">
    {id?.substring(0, 10)}...{id?.substring(id.length - 8)}
  </button>
);

export const LinkAction = ({ href, download, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                 border transition
                 ${download
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
    {children}
  </a>
);

export const BtnProof = ({ onClick }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500
               text-xs font-semibold hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition">
    View Audit Proof
  </button>
);

/* ── Verification result card ────────────── */
export const ResultCard = ({ result }) => {
  if (!result) return null;
  const ok = result.includes('✅');
  return (
    <div className={`mt-6 flex gap-4 items-start p-5 rounded-2xl border animate-pop-in
                     ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <span className="text-2xl mt-0.5">{ok ? '✅' : '❌'}</span>
      <div>
        <p className={`font-heading text-sm font-bold mb-1 ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
          {ok ? 'Authenticity Passed' : 'Authenticity Failed'}
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">{result}</p>
      </div>
    </div>
  );
};

/* ── Loading spinner overlay ─────────────── */
export const IssuingOverlay = () => (
  <div className="absolute inset-0 z-10 rounded-2xl glass flex flex-col items-center justify-center gap-4
                  animate-fade-in border border-slate-200">
    <div className="flex items-center gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white
                                shadow-[0_0_14px_rgba(99,102,241,0.4)]
                                animate-[pulseNode_1.2s_infinite]"
          style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </div>
    <p className="font-heading font-bold text-slate-800 text-lg">Securing Document Asset</p>
    <p className="text-sm text-slate-500">Anchoring cryptographic signature to blockchain...</p>
  </div>
);

/* ── Spinner button content ──────────────── */
export const SpinLabel = ({ label }) => (
  <span className="flex items-center justify-center gap-2">
    <Loader2 className="animate-spin" size={16} />
    {label}
  </span>
);

/* ── Info callout strip ──────────────────── */
export const InfoCallout = ({ children }) => (
  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium leading-relaxed">
    {children}
  </div>
);
