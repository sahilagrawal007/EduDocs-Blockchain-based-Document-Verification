import React from 'react';
import { Shield, Mail, Lock, Key, Loader2 } from 'lucide-react';

const Login = ({ email, setEmail, password, setPassword, isFirstLogin, setIsFirstLogin, hardhatKey, setHardhatKey, handleLogin, isLoggingIn }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
         style={{ background: 'radial-gradient(circle at 50% 0%, #f8fafc 0%, #cbd5e1 100%)' }}>
      
      {/* Brand */}
      <div className="text-center mb-8 animate-slide-down">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4
                        shadow-[0_10px_15px_-3px_rgba(99,102,241,0.35)]">
          <Shield size={32} className="text-white" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">EduDocs</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Decentralized Academic Trust Network</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass border border-slate-200 rounded-3xl shadow-2xl px-10 py-10 animate-pop-in">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to access your secure portal</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600 tracking-wide">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="email" placeholder="name@university.edu"
                value={email} onChange={e => setEmail(e.target.value)}
                required disabled={isLoggingIn}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                           text-slate-900 text-sm font-medium placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           disabled:opacity-50 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600 tracking-wide">Password</label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required disabled={isLoggingIn}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                           text-slate-900 text-sm font-medium placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           disabled:opacity-50 transition"
              />
            </div>
          </div>

          {/* First Login Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox" id="firstLogin"
              checked={isFirstLogin} onChange={e => setIsFirstLogin(e.target.checked)}
              disabled={isLoggingIn}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm text-slate-600 font-medium">This is my first login</span>
          </label>

          {/* Hardhat Key (first login only) */}
          {isFirstLogin && (
            <div className="flex flex-col gap-2 animate-fade-in">
              <label className="text-sm font-semibold text-slate-600 tracking-wide">Hardhat Cryptographic Key</label>
              <div className="relative flex items-center">
                <Key size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="password" placeholder="0x..."
                  value={hardhatKey} onChange={e => setHardhatKey(e.target.value)}
                  required disabled={isLoggingIn}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-300 bg-amber-50
                             text-slate-900 text-sm font-medium placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400
                             disabled:opacity-50 transition"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Required once for cryptographic signing authority setup.</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                       bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                       shadow-[0_4px_14px_-1px_rgba(79,70,229,0.3)]
                       hover:shadow-[0_8px_20px_-2px_rgba(79,70,229,0.4)]
                       transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                       hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoggingIn ? (
              <><Loader2 className="animate-spin" size={18} /><span>Authenticating...</span></>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400 font-medium animate-fade-in delay-200">
        Secured by Blockchain Ledger Verification Protocol
      </p>
    </div>
  );
};

export default Login;
