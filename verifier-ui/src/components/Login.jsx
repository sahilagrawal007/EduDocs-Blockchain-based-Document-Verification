import React from 'react';
import { Shield, Mail, Lock, Key, Loader2 } from 'lucide-react';

const Login = ({ email, setEmail, password, setPassword, isFirstLogin, setIsFirstLogin, hardhatKey, setHardhatKey, handleLogin, isLoggingIn }) => {
  return (
    <div className="login-container">
      <div className="login-brand animate-slide-down">
        <div className="logo-container">
          <Shield className="logo-icon-svg" size={32} />
        </div>
        <h1>EduDocs</h1>
        <p className="subtitle">Decentralized Academic Trust Network</p>
      </div>

      <div className="login-card animate-pop-in">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your secure portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                placeholder="name@university.edu" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isLoggingIn}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={isLoggingIn}
              />
            </div>
          </div>
          
          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="firstLogin" 
              checked={isFirstLogin} 
              onChange={e => setIsFirstLogin(e.target.checked)} 
              disabled={isLoggingIn}
            />
            <label htmlFor="firstLogin">This is my first login</label>
          </div>
          
          {isFirstLogin && (
            <div className="form-group animate-fade-in">
              <label>Hardhat Cryptographic Key</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Key size={18} />
                </span>
                <input 
                  type="password" 
                  placeholder="0x..." 
                  value={hardhatKey} 
                  onChange={e => setHardhatKey(e.target.value)} 
                  required 
                  disabled={isLoggingIn}
                />
              </div>
              <p className="helper-text">
                Required once for cryptographic signing authority setup.
              </p>
            </div>
          )}
          
          <button type="submit" className="login-button" disabled={isLoggingIn}>
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Authenticating Portal...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      <div className="login-footer animate-fade-in delay-2">
        <p>Secured by Blockchain Ledger Verification Protocol</p>
      </div>
    </div>
  );
};

export default Login;
