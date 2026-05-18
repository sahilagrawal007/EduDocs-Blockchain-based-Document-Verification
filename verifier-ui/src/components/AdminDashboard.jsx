import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, Mail, Lock, PlusCircle, Trash2, Key, LogOut, Loader2, 
  Upload, Download, FileSpreadsheet, Activity, ShieldCheck, CheckCircle2,
  Users
} from 'lucide-react';

const AdminDashboard = ({ 
  newEmail, setNewEmail,
  newPassword, setNewPassword,
  newRole, setNewRole,
  usersList = [],
  handleCreateUser,
  handleChangePassword,
  handleDeleteUser,
  handleLogout,
  token,
  isCreatingUser = false,
  fetchUsers,
  showModal
}) => {
  const navigate = useNavigate();
  const [bulkRole, setBulkRole] = useState('issuer');
  const [parsedEmails, setParsedEmails] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic mount fetch to prevent stale data glitches
  useEffect(() => {
    if (token && fetchUsers) {
      fetchUsers(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await handleCreateUser(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      // Extract all valid emails using regex
      const matches = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
      const uniqueEmails = [...new Set(matches.map(email => email.trim().toLowerCase()))];
      
      setParsedEmails(uniqueEmails);
      setImportStatus(`Detected ${uniqueEmails.length} valid email address(es) from your file.`);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (parsedEmails.length === 0) {
      if (showModal) {
        await showModal("Selection Required", "Please select a valid CSV/TXT file with emails first.");
      } else {
        alert("Please select a valid CSV/TXT file with emails first.");
      }
      return;
    }

    setImporting(true);
    setImportStatus("Provisioning user accounts, generating secure passwords, sending welcome emails...");

    try {
      const res = await fetch('http://localhost:3000/api/auth/bulk_create_users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterAdminToken: token,
          emails: parsedEmails,
          role: bulkRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setImportStatus(`Import Error: ${data.error}`);
      } else {
        setImportStatus(data.message);
        if (showModal) {
          await showModal("Bulk Import Completed", data.message);
        } else {
          alert(data.message);
        }
        if (fetchUsers) {
          fetchUsers(token);
        }
      }
    } catch (err) {
      setImportStatus("Network error during bulk import.");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Emails\r\nstudent1@university.edu\r\nstudent2@university.edu\r\nstudent3@university.edu\r\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "edudocs_bulk_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="user-badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div className="avatar-sm">
              <User size={14} />
            </div>
            <span>Master Admin</span>
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
      
      <div className="dashboard-layout grid-2-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Manual User Creation */}
          <section className="dashboard-section card-white animate-fade-in">
            <h2>Provision Single Account</h2>
            <p className="section-subtitle">Add new credentials or administrative operators to the network manually.</p>
            
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-group">
                <label>Institutional Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    placeholder="operator@university.edu" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    required 
                    disabled={isSubmitting || isCreatingUser}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Temporary Secure Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    disabled={isSubmitting || isCreatingUser}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Access Privilege Role</label>
                <div className="input-wrapper">
                  <span className="input-icon" style={{ zIndex: 1 }}>
                    <User size={16} />
                  </span>
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)}
                    disabled={isSubmitting || isCreatingUser}
                    className="modern-select"
                  >
                    <option value="issuer">Document Issuer Authority</option>
                    <option value="normal_user">Standard Student / Verifier</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isSubmitting || isCreatingUser}>
                {(isSubmitting || isCreatingUser) ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Provisioning User...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <PlusCircle size={16} />
                    <span>Generate Platform Account</span>
                  </div>
                )}
              </button>
            </form>
          </section>

          {/* Bulk Import Section */}
          <section className="dashboard-section card-white animate-fade-in delay-1">
            <h2>Bulk Import Credentials (.csv / .txt)</h2>
            <p className="section-subtitle">
              Upload a list of academic emails exported from your SIS. The platform automatically sets up accounts, configures keys, and dispatches credential setup payloads. You can download a{' '}
              <span 
                onClick={downloadSampleCSV} 
                className="link-anchor"
                style={{ fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Sample Template File Here
              </span>.
            </p>
            
            <div className="dashboard-form">
              <div className="form-group">
                <label>Assigned Privilege for Imported Batch</label>
                <div className="input-wrapper">
                  <span className="input-icon" style={{ zIndex: 1 }}>
                    <Users size={16} />
                  </span>
                  <select 
                    value={bulkRole} 
                    onChange={e => setBulkRole(e.target.value)}
                    className="modern-select"
                    disabled={importing}
                  >
                    <option value="issuer">Document Issuer Authority</option>
                    <option value="normal_user">Standard Student / Verifier</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Batch Email Registry File</label>
                <div className="drop-zone mini" style={{ padding: '16px', background: 'var(--input-bg)' }}>
                  <input 
                    type="file" 
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <Upload size={18} className="text-secondary" />
                    <span className="drop-zone-text" style={{ fontSize: '13px' }}>Select .CSV or .TXT registry</span>
                  </div>
                </div>
              </div>

              {importStatus && (
                <div className="info-callout">
                  <Activity size={14} style={{ marginRight: '6px' }} />
                  <span>{importStatus}</span>
                </div>
              )}

              {parsedEmails.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <button 
                    type="button" 
                    onClick={handleBulkImport} 
                    className="btn-primary" 
                    disabled={importing}
                    style={{ width: '100%', background: '#10b981', borderColor: '#10b981' }}
                  >
                    {importing ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Anchoring Batch Accounts...</span>
                      </div>
                    ) : (
                      <span>Import {parsedEmails.length} Users Now</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Managed Users directory */}
        <section className="dashboard-section card-white delay-2 animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2>Managed Directory</h2>
            <span className="status-badge success">{usersList ? usersList.length : 0} Active Operators</span>
          </div>
          <p className="section-subtitle">Browse all credentials, verify blockchain activity status, reset passwords, or suspend access keys.</p>
          
          <div className="table-container" style={{ maxHeight: '680px', overflowY: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Identity / Email</th>
                  <th>Privilege</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Key Operations</th>
                </tr>
              </thead>
              <tbody>
                {(!usersList || usersList.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="empty-state-cell">
                      No managed operator profiles in directory.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u, i) => (
                    <tr key={i} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="recipient-avatar" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {u.email && u.email[0] ? u.email[0].toUpperCase() : '?'}
                          </div>
                          <span style={{ fontWeight: '500' }}>{u.email || 'Operator Account'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'master_admin' ? 'Master Admin' : u.role === 'issuer' ? 'Issuer' : 'Verifier'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} className="text-success" />
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Secured</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {u.role !== 'master_admin' ? (
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleChangePassword(u.id)}
                              className="btn-action-outline"
                              title="Update Password"
                            >
                              <Key size={12} style={{ marginRight: '4px' }} />
                              Reset Pass
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn-revoke"
                              title="Suspend Operations"
                            >
                              <Trash2 size={12} style={{ marginRight: '4px' }} />
                              De-auth
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>System Root</span>
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
