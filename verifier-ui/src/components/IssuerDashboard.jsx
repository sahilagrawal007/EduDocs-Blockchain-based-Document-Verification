import React from 'react';

const IssuerDashboard = ({ 
  contractAddress, setContractAddress, 
  credentialText, setCredentialText, 
  file, setFile, 
  handleIssue, 
  verifyContractAddress, setVerifyContractAddress, 
  verifyCredentialText, setVerifyCredentialText, 
  verifyFile, setVerifyFile, 
  handleVerify, 
  verifyResult, 
  handleLogout 
}) => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-slide-down">
        <div className="header-brand">
          <div className="header-logo">🛡️</div>
          <h1>EduDocs</h1>
        </div>
        <div className="header-actions">
            <div className="user-badge">
                <div className="avatar-sm" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🏛️</div>
                <span>Issuer</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>
      
      <div className="dashboard-layout grid-2-col">
        {/* Issuance Section */}
        <section className="dashboard-section card-white animate-fade-in">
          <h2>Mint Credentials</h2>
          <p className="section-subtitle">Securely issue documents to the blockchain ledger.</p>
          
          <form onSubmit={handleIssue} className="dashboard-form">
            <div className="form-group">
                <label>Recipient Identifer (E-mail)</label>
                <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input 
                      type="email" 
                      placeholder="recipient@example.com" 
                      value={credentialText} 
                      onChange={e => setCredentialText(e.target.value)} 
                      required 
                    />
                </div>
            </div>
            
            <div className="form-group">
                <label>Contract Endpoint (Smart Contract)</label>
                <div className="input-wrapper">
                    <span className="input-icon">📑</span>
                    <input 
                      type="text" 
                      placeholder="0x..." 
                      value={contractAddress} 
                      onChange={e => setContractAddress(e.target.value)} 
                      required 
                    />
                </div>
            </div>
            
            <div className="drop-zone" style={{ marginBottom: '24px' }}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={e => setFile(e.target.files[0])} 
              />
              <span className="drop-zone-icon">📄</span>
              {file ? (
                <p className="drop-zone-text" style={{ color: '#6366f1' }}>{file.name}</p>
              ) : (
                <>
                    <p className="drop-zone-text">Click to select document</p>
                    <p className="drop-zone-subtext">PDF only, max 10MB</p>
                </>
              )}
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Sign and Issue
            </button>
          </form>
        </section>

        {/* Verification Preview Section */}
        <section className="dashboard-section card-white delay-1 animate-fade-in">
          <h2>Independent Verification</h2>
          <p className="section-subtitle">Confirm document integrity with the ledger.</p>
          
          <form onSubmit={handleVerify} className="dashboard-form">
            <div className="form-group">
                <label>Contract Address</label>
                <div className="input-wrapper">
                    <span className="input-icon">⛓️</span>
                    <input 
                      type="text" 
                      placeholder="0x..." 
                      value={verifyContractAddress} 
                      onChange={e => setVerifyContractAddress(e.target.value)} 
                      required 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Recipient Identity</label>
                <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input 
                      type="email" 
                      placeholder="recipient@example.com" 
                      value={verifyCredentialText} 
                      onChange={e => setVerifyCredentialText(e.target.value)} 
                      required 
                    />
                </div>
            </div>
            
            <div className="drop-zone mini" style={{ marginBottom: '24px', padding: '24px' }}>
                <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={e => setVerifyFile(e.target.files[0])} 
                    required 
                />
                <span className="drop-zone-icon" style={{ fontSize: '24px' }}>🔍</span>
                {verifyFile ? (
                    <p className="drop-zone-text" style={{ fontSize: '14px', color: '#6366f1' }}>{verifyFile.name}</p>
                ) : (
                    <p className="drop-zone-text" style={{ fontSize: '14px' }}>Select PDF to Verify</p>
                )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', background: '#64748b' }}>Verify Provenance</button>
          </form>
          
          {verifyResult && (
            <div className={`result-card animate-pop-in ${verifyResult.includes('✅') ? 'success' : 'error'}`}>
               <div className="result-icon">
                 {verifyResult.includes('✅') ? '✅' : '❌'}
               </div>
               <div className="result-content">
                   <h3>{verifyResult.includes('✅') ? 'Verified' : 'Validation Failed'}</h3>
                   <p className="result-details">{verifyResult}</p>
               </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default IssuerDashboard;
