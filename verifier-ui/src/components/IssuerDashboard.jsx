import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Building, Mail, Database, FileText, Key, Search, User, 
  LogOut, ExternalLink, Download, Trash2, Loader2, CheckCircle2, AlertTriangle 
} from 'lucide-react';

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
  setHardhatKey,
  isIssuing,
  isVerifying,
  isRevoking,
  token,
  fetchIssuedDocuments,
  showModal
}) => {
  const navigate = useNavigate();

  // Dynamic mount fetch to prevent stale data glitches
  useEffect(() => {
    if (token && fetchIssuedDocuments) {
      fetchIssuedDocuments(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-slide-down">
        <div className="header-brand">
          <div className="header-logo">
            <Shield size={22} className="logo-svg" />
          </div>
          <h1>EduDocs</h1>
        </div>
        <div className="header-actions">
          <div className="user-badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div className="avatar-sm">
              <Building size={14} />
            </div>
            <span>Issuer Portal</span>
          </div>
          <button onClick={() => navigate('/profile')} className="btn-primary-muted">
            Profile & Key
          </button>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={14} style={{ marginRight: '6px' }} />
            Sign Out
          </button>
        </div>
      </header>
      
      <div className="dashboard-layout grid-2-col">
        {/* Issuance Section */}
        <section className="dashboard-section card-white animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
          {isIssuing && (
            <div className="issuing-visual-overlay">
              <div className="blockchain-animation">
                <div className="chain-node node-1"></div>
                <div className="chain-node node-2"></div>
                <div className="chain-node node-3"></div>
                <div className="chain-line"></div>
              </div>
              <h3>Securing Document Asset</h3>
              <p>Hashing document and anchoring cryptographic signature to Ethereum virtual ledger...</p>
            </div>
          )}

          <h2>Mint Secure Credentials</h2>
          <p className="section-subtitle">Anchor new certificates or identity assets cryptographically to the immutable blockchain ledger.</p>
          
          <form onSubmit={handleIssue} className="dashboard-form">
            <div className="form-group">
              <label>Recipient Identifier (E-mail)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  placeholder="student@university.edu" 
                  value={credentialText} 
                  onChange={e => setCredentialText(e.target.value)} 
                  required 
                  disabled={isIssuing}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Verification Contract (Smart Contract Address)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Database size={16} />
                </span>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  value={contractAddress} 
                  onChange={e => setContractAddress(e.target.value)} 
                  required 
                  disabled={isIssuing}
                />
              </div>
            </div>
            
            <div className="drop-zone" style={{ marginBottom: '24px' }}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={e => setFile(e.target.files[0])} 
                disabled={isIssuing}
              />
              <span className="drop-zone-icon">
                <FileText size={36} className="text-primary" />
              </span>
              {file ? (
                <p className="drop-zone-text text-highlight">{file.name}</p>
              ) : (
                <>
                  <p className="drop-zone-text">Click or drag certificate PDF here</p>
                  <p className="drop-zone-subtext">PDF only, max 10MB</p>
                </>
              )}
            </div>

            {/* If hardhatKey is not present, render a secure manual key input field */}
            {!hardhatKey && (
              <div className="form-group animate-fade-in" style={{ marginBottom: '24px' }}>
                <label style={{ color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Cryptographic Signing Key Required
                </label>
                <div className="input-wrapper warning-wrapper">
                  <span className="input-icon">
                    <Key size={16} />
                  </span>
                  <input 
                    type="password" 
                    placeholder="Paste your 0x... private key here" 
                    value={hardhatKey || ''} 
                    onChange={e => setHardhatKey(e.target.value)} 
                    required 
                    disabled={isIssuing}
                  />
                </div>
                <p className="helper-text warning-text">
                  Your session does not have a linked wallet key. Please link it in your Profile or paste it above to sign blockchain transactions.
                </p>
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isIssuing}>
              {isIssuing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Anchoring Cryptography...</span>
                </div>
              ) : (
                <span>Sign and Mint Document</span>
              )}
            </button>
          </form>
        </section>

        {/* Verification Preview Section */}
        <section className="dashboard-section card-white delay-1 animate-fade-in">
          <h2>Ledger Verification Audit</h2>
          <p className="section-subtitle">Perform a real-time decentralized audit to confirm provenance and document integrity.</p>
          
          <form onSubmit={handleVerify} className="dashboard-form">
            <div className="form-group">
              <label>Audit Contract Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Database size={16} />
                </span>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  value={verifyContractAddress} 
                  onChange={e => setVerifyContractAddress(e.target.value)} 
                  required 
                  disabled={isVerifying}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Recipient Identity (Owner Email)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <User size={16} />
                </span>
                <input 
                  type="email" 
                  placeholder="student@university.edu" 
                  value={verifyCredentialText} 
                  onChange={e => setVerifyCredentialText(e.target.value)} 
                  required 
                  disabled={isVerifying}
                />
              </div>
            </div>
            
            <div className="drop-zone mini" style={{ marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={e => setVerifyFile(e.target.files[0])} 
                required 
                disabled={isVerifying}
              />
              {isVerifying ? (
                <div className="scanner-container">
                  <div className="scanner-line"></div>
                  <Loader2 className="animate-spin text-primary" size={24} style={{ marginBottom: '12px' }} />
                  <p className="drop-zone-text scanner-pulse">Hashing & Verifying Document...</p>
                  <p className="drop-zone-subtext">Executing cryptographic proof on ledger</p>
                </div>
              ) : (
                <>
                  <span className="drop-zone-icon" style={{ fontSize: '24px' }}>
                    <Search size={24} className="text-primary" />
                  </span>
                  {verifyFile ? (
                    <p className="drop-zone-text text-highlight">{verifyFile.name}</p>
                  ) : (
                    <p className="drop-zone-text">Click to select PDF for verification</p>
                  )}
                </>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', background: '#475569' }} disabled={isVerifying}>
              {isVerifying ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Scanning Block Record...</span>
                </div>
              ) : (
                <span>Verify Ledger Authenticity</span>
              )}
            </button>
          </form>
          
          {verifyResult && !isVerifying && (
            <div className={`result-card animate-pop-in ${verifyResult.includes('✅') ? 'success' : 'error'}`}>
              <div className="result-icon">
                {verifyResult.includes('✅') ? <CheckCircle2 className="success-icon" size={24} /> : <AlertTriangle className="error-icon" size={24} />}
              </div>
              <div className="result-content">
                <h3>{verifyResult.includes('✅') ? 'Ledger Proof: Valid' : 'Ledger Proof: Invalid'}</h3>
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
            <h2>History of Issued Credentials</h2>
            <span className="status-badge success">{issuedDocuments ? issuedDocuments.length : 0} Total Anchored Assets</span>
          </div>
          <p className="section-subtitle">Audit trails of all records cryptographically linked to the blockchain by your institution.</p>
          
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Recipient Identity</th>
                  <th>Document Asset</th>
                  <th>Credential ID</th>
                  <th>Issuance Date</th>
                  <th style={{ textAlign: 'center' }}>Secure Access</th>
                  <th style={{ textAlign: 'center' }}>Ledger Status</th>
                  <th style={{ textAlign: 'center' }}>Revocation Action</th>
                </tr>
              </thead>
              <tbody>
                {(!issuedDocuments || issuedDocuments.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="empty-state-cell">
                      No documents anchored by this profile yet.
                    </td>
                  </tr>
                ) : (
                  issuedDocuments.map((doc, i) => (
                    <tr key={i} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="recipient-avatar">
                            <User size={14} />
                          </div>
                          <span style={{ fontWeight: '600' }}>{doc.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} className="text-secondary" />
                          <span>{doc.originalName}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="credential-id-badge" 
                          title="Click to copy for revoking" 
                          onClick={async () => { 
                            setRevokeCredentialId(doc.credentialId); 
                            if (showModal) {
                              await showModal("Credential ID Copied", "The unique cryptographic credential key has been populated in your Revocation Panel input.");
                            } else {
                              alert('Credential ID copied to input field!'); 
                            }
                          }}
                        >
                          {doc.credentialId.substring(0, 10)}...{doc.credentialId.substring(doc.credentialId.length - 8)}
                        </span>
                      </td>
                      <td>{new Date(doc.issuedAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        {doc.documentUrl ? (
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="link-action">
                              <ExternalLink size={12} /> Preview
                            </a>
                            <a href={doc.documentUrl.replace('/upload/', '/upload/fl_attachment/')} target="_blank" rel="noopener noreferrer" className="link-action download">
                              <Download size={12} /> Download
                            </a>
                          </div>
                        ) : (
                          <span className="local-storage-badge">Local Storage Only</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {doc.revoked ? (
                          <span className="status-badge danger">Revoked</span>
                        ) : (
                          <span className="status-badge success">Active</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!doc.revoked ? (
                          <button 
                            onClick={() => handleRevoke(null, doc.credentialId)}
                            className="btn-revoke"
                            disabled={isRevoking}
                          >
                            <Trash2 size={12} style={{ marginRight: '4px' }} />
                            Revoke
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>-</span>
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
