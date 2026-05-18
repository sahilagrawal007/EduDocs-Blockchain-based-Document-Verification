import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
                    <div className="header-logo">🛡️</div>
                    <h1>EduDocs</h1>
                </div>
                <div className="header-actions">
                    <button onClick={() => navigate(-1)} className="btn-primary" style={{ background: '#64748b', padding: '10px 16px' }}>
                        Dashboard
                    </button>
                    <button onClick={handleLogout} className="btn-logout">Sign Out</button>
                </div>
            </header>
            
            <div className="dashboard-layout">
                <section className="dashboard-section card-white animate-fade-in full-span">
                    <h2>User Profile</h2>
                    <p className="section-subtitle">View your account details and credentials history.</p>
                    
                    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '48px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Email Address</p>
                            <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{email}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Account Role</p>
                            <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a', textTransform: 'capitalize' }}>
                                {role === 'issuer' ? 'Institution Issuer' : role === 'normal_user' ? 'Student / Verified User' : role}
                            </p>
                        </div>
                    </div>

                    {/* Cryptographic Wallet Key Management */}
                    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>🔒 Cryptographic Wallet Configuration</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
                            EduDocs uses a local Hardhat network private key to sign and verify blockchain transactions. To support logging in seamlessly from any device without storing credentials in browser storage, keys are securely synced directly with your database profile.
                        </p>

                        {hardhatKey ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>✅</span>
                                    <strong style={{ color: '#166534', fontSize: '14px' }}>Cryptographic Token Linked to Database Profile</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '14px', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, wordBreak: 'break-all' }}>
                                        {showKey ? hardhatKey : `${hardhatKey.substring(0, 6)}••••••••••••••••••••••••••••••••••••••••••••••••${hardhatKey.substring(hardhatKey.length - 4)}`}
                                    </span>
                                    <button 
                                        onClick={() => setShowKey(!showKey)} 
                                        className="btn-primary" 
                                        style={{ background: '#64748b', padding: '8px 16px', fontSize: '12px', minWidth: '80px' }}
                                    >
                                        {showKey ? 'Hide' : 'Reveal'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>⚠️</span>
                                    <strong style={{ color: '#92400e', fontSize: '14px' }}>Cryptographic Token Missing</strong>
                                </div>
                                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#b45309' }}>
                                    Your account does not have a private key linked yet. Please paste the "Hasdnet Free Token (Private Key)" received in your welcome email to enable issuing/revoking documents.
                                </p>
                                <form onSubmit={handleLinkKey} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <input 
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="Paste your 0x... private key here" 
                                        value={keyInput}
                                        onChange={e => setKeyInput(e.target.value)}
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '250px' }}
                                        required
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowKey(!showKey)} 
                                            className="btn-primary" 
                                            style={{ background: '#64748b', padding: '10px 14px', fontSize: '13px' }}
                                        >
                                            {showKey ? 'Hide' : 'Show'}
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-primary" 
                                            disabled={loading}
                                            style={{ padding: '10px 20px', fontSize: '13px' }}
                                        >
                                            {loading ? 'Linking...' : 'Link to Profile'}
                                        </button>
                                    </div>
                                </form>
                                {message && (
                                    <p style={{ margin: '10px 0 0 0', fontSize: '13px', fontWeight: '600', color: isError ? '#dc2626' : '#16a34a' }}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {role === 'normal_user' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '24px' }}>
                                <h3 style={{ margin: 0 }}>My Secured Identity Assets</h3>
                                <span className="status-badge success">{myDocuments ? myDocuments.length : 0} Documents</span>
                            </div>
                            <div className="table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Issuer Source</th>
                                            <th>Document Type</th>
                                            <th>Credential ID</th>
                                            <th>Issuance Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!myDocuments || myDocuments.length === 0) ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No documents attached to this wallet yet.</td></tr>
                                        ) : (
                                            myDocuments.map((doc, i) => (
                                                <tr key={i} className="table-row">
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '24px', height: '24px', background: '#f5f3ff', color: '#8b5cf6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🏛️</div>
                                                            <span style={{ fontWeight: '600' }}>{doc.issuer}</span>
                                                        </div>
                                                    </td>
                                                    <td>{doc.originalName}</td>
                                                    <td>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>
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
