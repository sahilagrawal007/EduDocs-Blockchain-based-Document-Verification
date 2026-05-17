import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = ({ 
    email, 
    role, 
    issuedDocuments, 
    myDocuments, 
    handleLogout,
    handleRevoke
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
                    
                    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '48px', border: '1px solid #e2e8f0' }}>
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
