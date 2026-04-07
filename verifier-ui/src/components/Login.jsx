import React from 'react';

const Login = ({ email, setEmail, password, setPassword, isFirstLogin, setIsFirstLogin, hardhatKey, setHardhatKey, handleLogin }) => {
  return (
    <div className="login-container">
      <div className="login-brand animate-slide-down">
        <div className="logo-container">
            <span className="logo-icon">🛡️</span>
        </div>
        <h1>EduDocs</h1>
        <p className="subtitle">Blockchain-Based Certificate Verification</p>
      </div>

      <div className="login-card animate-pop-in">
        <div className="login-header">
          <h2>Welcome back</h2>
          <p>Sign in to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input 
                  type="email" 
                  placeholder="name@university.edu" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
            </div>
          </div>
          
          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="firstLogin" 
              checked={isFirstLogin} 
              onChange={e => setIsFirstLogin(e.target.checked)} 
            />
            <label htmlFor="firstLogin">This is my first login</label>
          </div>
          
          {isFirstLogin && (
            <div className="form-group animate-fade-in">
              <label>Hardhat Private Key</label>
              <div className="input-wrapper">
                  <span className="input-icon">🔑</span>
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    value={hardhatKey} 
                    onChange={e => setHardhatKey(e.target.value)} 
                    required 
                  />
              </div>
              <p className="helper-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', marginLeft: '4px' }}>
                Required for first-time issuer/admin setup
              </p>
            </div>
          )}
          
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </div>

      <div className="login-footer animate-fade-in delay-2">
        <p>Secured by blockchain technology</p>
      </div>
    </div>
  );
};

export default Login;
