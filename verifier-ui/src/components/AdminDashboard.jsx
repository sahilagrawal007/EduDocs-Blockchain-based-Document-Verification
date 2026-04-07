import React from 'react';

const AdminDashboard = ({ 
  newEmail, setNewEmail, 
  newPassword, setNewPassword, 
  newRole, setNewRole, 
  usersList, handleCreateUser, 
  handleChangePassword, handleDeleteUser, 
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
                <div className="avatar-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>⚡</div>
                <span>Admin</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>
      
      <div className="dashboard-layout">
        <section className="dashboard-section card-white animate-fade-in">
          <h2>Create New Credentials</h2>
          <p className="section-desc">Add new users or issuers to the verification ecosystem.</p>
          
          <form onSubmit={handleCreateUser} className="dashboard-form">
            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input 
                      type="email" 
                      placeholder="user@example.com" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      required 
                    />
                </div>
              </div>
              <div className="form-group">
                <label>Temporary Password</label>
                <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                    />
                </div>
              </div>
            </div>
            
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group">
                <label>Access Role</label>
                <div className="input-wrapper">
                    <span className="input-icon" style={{ zIndex: 1 }}>👤</span>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="custom-select">
                      <option value="issuer">Issuer (University/Organization)</option>
                      <option value="normal_user">Normal User (Student/Graduate)</option>
                    </select>
                </div>
              </div>
              <div className="form-group">
                <button type="submit" className="btn-primary" style={{ width: '100%', height: '44px' }}>Create Account</button>
              </div>
            </div>
          </form>
        </section>

        <section className="dashboard-section card-white delay-1 animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2>User Management</h2>
            <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{usersList.length} Active Users</span>
          </div>
          
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No users managed yet.</td></tr>
                ) : (
                  usersList.map(u => (
                    <tr key={u.id} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', background: '#f1f5f9', color: '#475569', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                              {u.email[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500' }}>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ 
                            background: u.role === 'master_admin' ? '#fef2f2' : u.role === 'issuer' ? '#f5f3ff' : '#ecfdf5',
                            color: u.role === 'master_admin' ? '#dc2626' : u.role === 'issuer' ? '#7c3aed' : '#059669'
                        }}>
                          {u.role === 'master_admin' ? 'Master Admin' : u.role.split('_').join(' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>Active</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role !== 'master_admin' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                              onClick={() => handleChangePassword(u.id)} 
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                              title="Reset Password"
                            >
                              🔑
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                              title="Revoke Access"
                            >
                              🗑️
                            </button>
                          </div>
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

export default AdminDashboard;
