import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, Building, FileText, ExternalLink, Download, 
  Database, Mail, Search, LogOut, CheckCircle2, AlertTriangle, Loader2 
} from 'lucide-react';

const UserDashboard = ({ 
  myDocuments, 
  verifyContractAddress, setVerifyContractAddress, 
  verifyCredentialText, setVerifyCredentialText, 
  verifyFile, setVerifyFile, 
  handleVerify, 
  verifyResult, 
  handleLogout,
  isVerifying,
  token,
  fetchMyDocuments,
  showModal
}) => {
  const navigate = useNavigate();

  // Dynamic mount fetch to prevent stale data glitches
  useEffect(() => {
    if (token && fetchMyDocuments) {
      fetchMyDocuments(token);
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
              <User size={14} />
            </div>
            <span>User Portal</span>
          </div>
          <button onClick={() => navigate('/profile')} className="btn-primary-muted">
            My Profile
          </button>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={14} style={{ marginRight: '6px' }} />
            Sign Out
          </button>
        </div>
      </header>
      
      <div className="dashboard-layout">
        {/* Document List Section */}
        <section className="dashboard-section card-white animate-fade-in full-span">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2>Secured Identity & Academic Assets</h2>
            <span className="status-badge success">{myDocuments.length} Verified Records</span>
          </div>
          <p className="section-subtitle">These credentials have been cryptographically anchored directly to your unique academic profile on the public ledger.</p>
          
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Issuer Source</th>
                  <th>Document Asset</th>
                  <th>Credential ID</th>
                  <th>Issuance Date</th>
                  <th style={{ textAlign: 'center' }}>Secure Access</th>
                  <th style={{ textAlign: 'right' }}>Ledger Proof</th>
                </tr>
              </thead>
              <tbody>
                {myDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      No documents associated with your profile on this network.
                    </td>
                  </tr>
                ) : (
                  myDocuments.map((doc, i) => (
                    <tr key={i} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="recipient-avatar" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                            <Building size={14} />
                          </div>
                          <span style={{ fontWeight: '600' }}>{doc.issuer}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} className="text-secondary" />
                          <span>{doc.originalName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="credential-id-badge" title={doc.credentialId}>
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
                          <span className="local-storage-badge">Local Storage</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => alert("TX Hash Proof: " + doc.txHash)} 
                          className="btn-proof"
                        >
                          View Audit Proof
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
            <h2>Independent Provenance Audit</h2>
            <p className="section-subtitle">Perform a local and blockchain-synchronized validation audit of any credentials PDF.</p>
            
            <form onSubmit={handleVerify} className="dashboard-form">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Verification Contract</label>
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
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Owner Academic Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    placeholder="name@email.com" 
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
                      <p className="drop-zone-text">Click or drop certificate PDF for validation</p>
                    )}
                  </>
                )}
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isVerifying}>
                {isVerifying ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Analyzing Blockchain Blocks...</span>
                  </div>
                ) : (
                  <span>Execute Audit</span>
                )}
              </button>
            </form>
          </section>
          
          <section className="dashboard-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {verifyResult && !isVerifying && (
              <div className={`result-card animate-pop-in ${verifyResult.includes('✅') ? 'success' : 'error'}`} style={{ marginTop: 0 }}>
                <div className="result-icon">
                  {verifyResult.includes('✅') ? <CheckCircle2 className="success-icon" size={28} /> : <AlertTriangle className="error-icon" size={28} />}
                </div>
                <div className="result-content">
                  <h3>{verifyResult.includes('✅') ? 'Audit Result: Authenticity Passed' : 'Audit Result: Authenticity Failed'}</h3>
                  <p className="result-details" style={{ fontSize: '15px' }}>{verifyResult}</p>
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
