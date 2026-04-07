import React from 'react';

const UserDashboard = ({ 
  myDocuments, 
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
                <div className="avatar-sm">👤</div>
                <span>User</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>
      
      <div className="dashboard-layout">
        {/* Document List Section */}
        <section className="dashboard-section card-white animate-fade-in full-span">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>My Secured Identity Assets</h2>
              <span className="status-badge success">{myDocuments.length} Documents</span>
          </div>
          <p className="section-subtitle">These documents have been cryptographically anchored to your identity on the blockchain.</p>
          
          <div className="table-container">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th>Issuer Source</th>
                        <th>Document Type</th>
                        <th>Issuance Date</th>
                        <th style={{ textAlign: 'right' }}>Receipt & Proof</th>
                    </tr>
                </thead>
                <tbody>
                    {myDocuments.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No documents attached to this wallet yet.</td></tr>
                    ) : (
                        myDocuments.map((doc, i) => (
                            <tr key={i} className="table-row">
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', background: '#f5f3ff', color: '#8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px' }}>🏛️</div>
                                        <span style={{ fontWeight: '600' }}>{doc.issuer}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📄</span>
                                        <span>{doc.originalName}</span>
                                    </div>
                                </td>
                                <td>{new Date(doc.issuedAt).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        onClick={() => alert("TX Hash Proof: " + doc.txHash)} 
                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        View Proof
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
        </section>

        <div className="grid-2-col">
            {/* Self-Verification Section */}
            <section className="dashboard-section card-white delay-1 animate-fade-in">
              <h2>Provenance Audit</h2>
              <p className="section-subtitle">Perform a real-time audit of any document's integrity.</p>
              
              <form onSubmit={handleVerify} className="dashboard-form">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>Verification Contract</label>
                    <div className="input-wrapper">
                        <span className="input-icon">📑</span>
                        <input 
                          type="text" 
                          placeholder="0x..." 
                          value={verifyContractAddress} 
                          onChange={e => setVerifyContractAddress(e.target.value)} 
                          required 
                        />
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Verified Identity (Your Email)</label>
                    <div className="input-wrapper">
                        <span className="input-icon">✉️</span>
                        <input 
                          type="email" 
                          placeholder="name@email.com" 
                          value={verifyCredentialText} 
                          onChange={e => setVerifyCredentialText(e.target.value)} 
                          required 
                        />
                    </div>
                </div>
                
                <div className="drop-zone" style={{ marginBottom: '24px' }}>
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={e => setVerifyFile(e.target.files[0])} 
                        required 
                    />
                    <span className="drop-zone-icon">📤</span>
                    {verifyFile ? (
                        <p className="drop-zone-text" style={{ color: '#6366f1' }}>{verifyFile.name}</p>
                    ) : (
                        <>
                            <p className="drop-zone-text">Drop PDF for Audit</p>
                            <p className="drop-zone-subtext">PDF files only, max 10MB</p>
                        </>
                    )}
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Execute Audit</button>
              </form>
            </section>
            
            <section className="dashboard-section">
                {verifyResult && (
                    <div className={`result-card animate-pop-in ${verifyResult.includes('✅') ? 'success' : 'error'}`}>
                       <div className="result-icon">
                         {verifyResult.includes('✅') ? '✅' : '❌'}
                       </div>
                       <div className="result-content">
                           <h3>{verifyResult.includes('✅') ? 'Audit Passed' : 'Audit Failed'}</h3>
                           <p className="result-details">{verifyResult}</p>
                       </div>
                    </div>
                )}
            </section>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
