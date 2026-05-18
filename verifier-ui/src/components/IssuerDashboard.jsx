import React from 'react';
import { useNavigate } from 'react-router-dom';

const IssuerDashboard = ({ 
  contractAddress, setContractAddress, 
  credentialText, setCredentialText, 
  file, setFile, 
  revokeCredentialId, setRevokeCredentialId,
  issuedDocuments,
  handleIssue, 
  handleRevoke,
  verifyContractAddress, setVerifyContractAddress, 
  verifyCredentialText, setVerifyCredentialText, 
  verifyFile, setVerifyFile, 
  handleVerify, 
  verifyResult, 
  handleLogout,
  hardhatKey,
  setHardhatKey
}) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-slide-down">
        <div className="header-brand">
          <div className="header-logo">🛡️</div>
          <h1>EduDocs</h1>
        </div>
        <div className="header-actions">
            <div className="user-badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                <div className="avatar-sm" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🏛️</div>
                <span>Issuer</span>
            </div>
            <button onClick={() => navigate('/profile')} className="btn-primary" style={{ background: '#64748b', padding: '10px 16px' }}>Profile</button>
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

            {/* If hardhatKey is not present, render a secure manual key input field */}
            {!hardhatKey && (
              <div className="form-group animate-fade-in" style={{ marginBottom: '24px' }}>
                  <label style={{ color: '#b45309', fontWeight: 'bold' }}>⚠️ Hardhat Private Key (Required for signing)</label>
                  <div className="input-wrapper" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
                      <span className="input-icon">🔑</span>
                      <input 
                        type="password" 
                        placeholder="Paste your 0x... private key here" 
                        value={hardhatKey || ''} 
                        onChange={e => setHardhatKey(e.target.value)} 
                        required 
                      />
                  </div>
                  <p className="helper-text" style={{ fontSize: '12px', color: '#92400e', marginTop: '6px', marginLeft: '4px' }}>
                    Your session does not have a linked cryptographic key. Please enter it manually to sign blockchain transactions.
                  </p>
              </div>
            )}
            
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

      <div className="dashboard-layout" style={{ marginTop: '24px' }}>
        {/* Issued Documents Section */}
        <section className="dashboard-section card-white animate-fade-in full-span">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>Documents Issued By You</h2>
              <span className="status-badge success">{issuedDocuments ? issuedDocuments.length : 0} Documents</span>
          </div>
          <p className="section-subtitle">A record of all the credentials you have minted.</p>
          
          <div className="table-container">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th>Recipient Identity</th>
                        <th>Document Type</th>
                        <th>Credential ID</th>
                        <th>Issuance Date</th>
                        <th style={{ textAlign: 'center' }}>Document</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {(!issuedDocuments || issuedDocuments.length === 0) ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>You haven't issued any documents yet.</td></tr>
                    ) : (
                        issuedDocuments.map((doc, i) => (
                            <tr key={i} className="table-row">
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', background: '#f5f3ff', color: '#8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                                        <span style={{ fontWeight: '600' }}>{doc.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📄</span>
                                        <span>{doc.originalName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', wordBreak: 'break-all', display: 'inline-block', maxWidth: '150px', cursor: 'pointer' }} title="Click to copy for revoking" onClick={() => { setRevokeCredentialId(doc.credentialId); alert('Copied to Revoke input!'); }}>
                                        {doc.credentialId.substring(0, 10)}...{doc.credentialId.substring(doc.credentialId.length - 8)}
                                    </span>
                                </td>
                                <td>{new Date(doc.issuedAt).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'center' }}>
                                    {doc.documentUrl ? (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>Preview</a>
                                            <a href={doc.documentUrl.replace('/upload/', '/upload/fl_attachment/')} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>Download</a>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Local Storage</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {doc.revoked ? (
                                        <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>Revoked</span>
                                    ) : (
                                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>Active</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {!doc.revoked ? (
                                        <button 
                                            onClick={() => handleRevoke(null, doc.credentialId)}
                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            Revoke
                                        </button>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IssuerDashboard;
