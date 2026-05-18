import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, Building, Key, Eye, EyeOff, Loader2, 
  CheckCircle2, AlertTriangle, LogOut, ArrowLeft, FileText 
} from 'lucide-react';

const Profile = ({ 
    email, 
    role, 
    issuedDocuments, 
    myDocuments, 
    handleLogout,
    handleRevoke,
    hardhatKey,
    setHardhatKey,
    token
}) => {
    const navigate = useNavigate();
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleLinkKey = async (e) => {
        e.preventDefault();
        if (!keyInput.trim()) return alert("Please enter your private key.");
        setLoading(true);
        setMessage('');
        setIsError(false);
        try {
            const res = await fetch('http://localhost:3000/api/profile/hardhat-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, hardhatKey: keyInput.trim() })
            });
            const data = await res.json();
            if (data.error) {
                setMessage(data.error);
                setIsError(true);
            } else {
                setMessage(data.message);
                setHardhatKey(keyInput.trim());
                setKeyInput('');
            }
        } catch(err) {
            setMessage("Failed to link cryptographic key.");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

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
                    <button onClick={() => navigate(-1)} className="btn-primary-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={14} />
                        <span>Return Dashboard</span>
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                        <LogOut size={14} style={{ marginRight: '6px' }} />
                        Sign Out
                    </button>
                </div>
            </header>
            
            <div className="dashboard-layout">
                <section className="dashboard-section card-white animate-fade-in full-span">
                    <h2>User Account Profile</h2>
                    <p className="section-subtitle">Securely manage identity linkages, wallet addresses, and cryptographic authorization tokens.</p>
                    
                    <div className="profile-details-card">
                        <div className="detail-item">
                            <span className="detail-label">Identity Email Address</span>
                            <span className="detail-value">{email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Ledger Privilege Role</span>
                            <span className="detail-value text-capitalize">
                                {role === 'issuer' ? 'Institutional Certificate Issuer' : role === 'normal_user' ? 'Standard Academic Student / Verifier' : role}
                            </span>
                        </div>
                    </div>

                    {/* Cryptographic Wallet Key Management */}
                    <div className="wallet-config-panel">
                        <h3 className="panel-title">
                            <Key size={18} className="text-primary" />
                            <span>Cryptographic Wallet Signature Configuration</span>
                        </h3>
                        <p className="panel-description">
                            EduDocs relies on a local Hardhat network key to execute secure block anchors and cryptographic signatures. To protect your keys across sessions without leaving vulnerable browser-cache fingerprints, credentials are encrypted and stored in your profile ledger.
                        </p>

                        {hardhatKey ? (
                            <div className="key-status-box linked">
                                <div className="status-header">
                                    <CheckCircle2 size={18} className="text-success" />
                                    <span>Cryptographic Authority Key Linked to Database Profile</span>
                                </div>
                                <div className="key-reveal-wrapper">
                                    <span className="key-code">
                                        {showKey ? hardhatKey : `${hardhatKey.substring(0, 8)}••••••••••••••••••••••••••••••••••••••••••••••••${hardhatKey.substring(hardhatKey.length - 8)}`}
                                    </span>
                                    <button 
                                        onClick={() => setShowKey(!showKey)} 
                                        className="btn-action-outline" 
                                        style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        <span>{showKey ? 'Hide Key' : 'Reveal'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="key-status-box missing animate-pulse-subtle">
                                <div className="status-header">
                                    <AlertTriangle size={18} className="text-warning" />
                                    <span>Cryptographic Wallet Key Missing from Profile</span>
                                </div>
                                <p className="key-help-alert">
                                    Your institutional identity is not configured to authorize ledger mints. Paste the 0x... private key supplied by your system operator to setup signing permission.
                                </p>
                                <form onSubmit={handleLinkKey} className="key-link-form">
                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                        <span className="input-icon">
                                            <Key size={16} />
                                        </span>
                                        <input 
                                            type={showKey ? 'text' : 'password'}
                                            placeholder="Paste your 0x... private key here" 
                                            value={keyInput}
                                            onChange={e => setKeyInput(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowKey(!showKey)} 
                                            className="btn-action-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            <span>{showKey ? 'Hide' : 'Show'}</span>
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-primary" 
                                            disabled={loading}
                                            style={{ minWidth: '130px' }}
                                        >
                                            {loading ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                                    <Loader2 className="animate-spin" size={14} />
                                                    <span>Linking...</span>
                                                </div>
                                            ) : (
                                                <span>Link to Profile</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                                {message && (
                                    <p className={`status-msg ${isError ? 'error' : 'success'}`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {role === 'normal_user' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '24px' }}>
                                <h3>Secured Academic Assets</h3>
                                <span className="status-badge success">{myDocuments ? myDocuments.length : 0} Total Assets</span>
                            </div>
                            <div className="table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Issuer Source</th>
                                            <th>Document Name</th>
                                            <th>Credential ID</th>
                                            <th>Issuance Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!myDocuments || myDocuments.length === 0) ? (
                                            <tr>
                                                <td colSpan="4" className="empty-state-cell">
                                                    No credentials anchored to your profile ledger.
                                                </td>
                                            </tr>
                                        ) : (
                                            myDocuments.map((doc, i) => (
                                                <tr key={i} className="table-row">
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                          <div className="recipient-avatar" style={{ background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Building size={12} />
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
                                                        <span className="credential-id-badge">
                                                            {doc.credentialId}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(doc.issuedAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Profile;
