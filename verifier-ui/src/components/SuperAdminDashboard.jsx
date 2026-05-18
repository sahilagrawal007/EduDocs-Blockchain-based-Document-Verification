import React, { useState, useEffect } from 'react';
import { 
    Users, Building, FileText, Activity, 
    PlusCircle, Trash2, Shield, Settings,
    BarChart3, PieChart, ArrowLeft, Edit3, Check, X,
    Calendar, TrendingUp
} from 'lucide-react';

export default function SuperAdminDashboard({ token, handleLogout, showModal }) {
    const [stats, setStats] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [newOrgName, setNewOrgName] = useState('');
    
    // View state
    const [activeTab, setActiveTab] = useState('analytics');
    
    // Tenant drill-down states
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [orgStats, setOrgStats] = useState(null);
    const [orgUsers, setOrgUsers] = useState([]);
    const [unassignedUsers, setUnassignedUsers] = useState([]);
    
    // User creation inside tenant
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('master_admin');

    // Inline editing states
    const [editingUser, setEditingUser] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');

    const displayModal = showModal || (async (title, msg, confirmBtn = false) => {
        if (confirmBtn) return window.confirm(msg);
        window.alert(msg);
        return true;
    });

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchOrganizations();
        }
    }, [token]);

    useEffect(() => {
        if (selectedOrg) {
            fetchOrgDetails(selectedOrg.id);
        }
    }, [selectedOrg]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/analytics/system?token=${token}`);
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/organizations?token=${token}`);
            const data = await res.json();
            if (data.organizations) setOrganizations(data.organizations);
        } catch (err) {
            console.error("Failed to fetch organizations");
        }
    };

    const fetchOrgDetails = async (orgId) => {
        try {
            // Fetch organization analytics
            const statsRes = await fetch(`http://localhost:3000/api/analytics/organization/${orgId}?token=${token}`);
            const statsData = await statsRes.json();
            if (statsData.stats) setOrgStats(statsData.stats);

            // Fetch all users to filter assigned and unassigned
            const usersRes = await fetch(`http://localhost:3000/api/users?masterAdminToken=${token}`);
            const usersData = await usersRes.json();
            if (usersData.users) {
                // Filter users strictly belonging to this organization
                const filtered = usersData.users.filter(u => u.organization_id === orgId);
                setOrgUsers(filtered);

                // Filter users with no organization (unassigned) and exclude super admins
                const unassigned = usersData.users.filter(u => !u.organization_id && u.role !== 'super_admin');
                setUnassignedUsers(unassigned);
            }
        } catch (err) {
            console.error("Failed to fetch organization details", err);
        }
    };

    const handleCreateOrganization = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, name: newOrgName })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Notification', data.error);
            else {
                await displayModal('Success', 'Organization created successfully on the network ledger!');
                setNewOrgName('');
                fetchOrganizations();
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to configure new SaaS organization tenant.');
        }
    };

    const handleCreateOrgUser = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/auth/create_master_admin';
            let payload = { 
                token, 
                email: newAdminEmail, 
                password: newAdminPassword,
                organization_id: selectedOrg.id 
            };

            // If Super Admin is provisioning standard user or issuer
            if (newAdminRole !== 'master_admin') {
                endpoint = '/api/auth/create_user';
                payload = {
                    masterAdminToken: token,
                    email: newAdminEmail,
                    password: newAdminPassword,
                    role: newAdminRole
                };
            }

            const res = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.error) await displayModal('Provisioning Alert', data.error);
            else {
                if (data.credentials) {
                    await displayModal('Account Generated', `User Created Successfully!\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}\nHardhat Key: ${data.credentials.hardhat_key || 'N/A'}`);
                } else {
                    await displayModal('Success', data.message);
                }
                setNewAdminEmail('');
                setNewAdminPassword('');
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to provision organization user credentials.');
        }
    };

    const handleAssignUser = async (userId) => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    masterAdminToken: token,
                    organization_id: selectedOrg.id 
                })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', 'User successfully added to organization directory!');
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to map user to tenant organization.');
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await displayModal('Verify Deletion', 'Are you sure you want to permanently delete this user account from the registry?', true);
        if (!confirmed) return;
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterAdminToken: token })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', data.message);
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to delete selected user account.');
        }
    };

    const handleStartEdit = (user) => {
        setEditingUser(user.id);
        setEditEmail(user.email);
        setEditPassword('');
        setEditRole(user.role);
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleSaveUserEdit = async (userId) => {
        try {
            const payload = {
                masterAdminToken: token,
                email: editEmail,
                role: editRole
            };
            if (editPassword) {
                payload.password = editPassword;
            }

            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', 'User details updated successfully!');
                setEditingUser(null);
                fetchOrgDetails(selectedOrg.id);
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to update administrative profile.');
        }
    };

    return (
        <div className="dashboard-layout super-admin-theme animate-pop-in">
            {/* Sidebar */}
            <aside className="sidebar premium-glass">
                <div className="sidebar-header">
                    <Shield className="brand-icon pulse-animation" />
                    <h2>EduDocs Core</h2>
                    <span className="badge-super">SUPER ADMIN</span>
                </div>
                
                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('analytics'); setSelectedOrg(null); }}
                    >
                        <Activity size={20} />
                        System Analytics
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'organizations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('organizations')}
                    >
                        <Building size={20} />
                        Organizations (SaaS)
                    </button>
                </nav>
                
                <div className="sidebar-footer">
                    <button className="btn-logout modern-btn outline" onClick={handleLogout}>
                        Sign Out Core
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {!selectedOrg ? (
                    <>
                        <header className="topbar">
                            <h1>Super Admin Control Center</h1>
                            <p className="subtitle">Global visibility and tenant management</p>
                        </header>

                        <div className="content-area scroll-fade">
                            
                            {activeTab === 'analytics' && stats && (
                                <div className="analytics-view fade-in-up">
                                    <h2 className="section-title"><BarChart3 className="icon" /> Global System Overview</h2>
                                    
                                    <div className="stats-grid premium">
                                        <div className="stat-card glass-panel orange-glow">
                                            <Building className="stat-icon" />
                                            <div className="stat-info">
                                                <h3>Total Organizations</h3>
                                                <p className="stat-number">{stats.totalOrganizations}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="stat-card glass-panel purple-glow">
                                            <Shield className="stat-icon" />
                                            <div className="stat-info">
                                                <h3>Master Admins</h3>
                                                <p className="stat-number">{stats.totalMasterAdmins}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="stat-card glass-panel blue-glow">
                                            <Users className="stat-icon" />
                                            <div className="stat-info">
                                                <h3>Active Issuers</h3>
                                                <p className="stat-number">{stats.totalIssuers}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="stat-card glass-panel green-glow">
                                            <FileText className="stat-icon" />
                                            <div className="stat-info">
                                                <h3>Total Documents</h3>
                                                <p className="stat-number">{stats.totalDocuments}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Combined Tenant Comparison Graph */}
                                    <div className="combined-analytics glass-panel mt-3">
                                        <h3><Building className="icon" /> Combined Tenant Comparison (Documents Issued)</h3>
                                        <p className="help-text">Comparative analysis of decentralized documents issued by each registered SaaS tenant.</p>
                                        {stats.organizationsBreakdown && stats.organizationsBreakdown.length > 0 ? (
                                            <div className="tenant-comparison-chart mt-3">
                                                {stats.organizationsBreakdown.map(org => {
                                                    const percent = stats.totalDocuments > 0 ? (org.documentsCount / stats.totalDocuments) * 100 : 0;
                                                    return (
                                                        <div key={org.id} className="comparison-row">
                                                            <div className="comparison-label">
                                                                <span className="org-name">{org.name}</span>
                                                                <span className="org-value">{org.documentsCount} docs ({percent.toFixed(1)}%)</span>
                                                            </div>
                                                            <div className="comparison-bar-container">
                                                                <div 
                                                                    className="comparison-bar" 
                                                                    style={{ width: `${Math.max(percent, 2)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="empty-state">No tenant comparative data available.</p>
                                        )}
                                    </div>

                                    {/* Platform Role Breakdown & Activity Wave */}
                                    <div className="split-view mt-3">
                                        <div className="glass-panel" style={{ flex: 1.2 }}>
                                            <h3><Users className="icon" /> Platform Role Allocation</h3>
                                            <p className="help-text">Distribution of active accounts globally mapped across all organizations.</p>
                                            <div className="role-distribution mt-3">
                                                <div className="role-progress-bar">
                                                    <div 
                                                        className="role-segment super-admin-segment" 
                                                        style={{ width: `${(stats.totalMasterAdmins / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                        title="Master Admins"
                                                    ></div>
                                                    <div 
                                                        className="role-segment issuer-segment" 
                                                        style={{ width: `${(stats.totalIssuers / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                        title="Issuers"
                                                    ></div>
                                                    <div 
                                                        className="role-segment user-segment" 
                                                        style={{ width: `${(stats.totalUsers / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                        title="Users"
                                                    ></div>
                                                </div>
                                                <div className="role-legend mt-3">
                                                    <div className="legend-item"><span className="dot ma"></span> Master Admins ({stats.totalMasterAdmins})</div>
                                                    <div className="legend-item"><span className="dot issuer"></span> Active Issuers ({stats.totalIssuers})</div>
                                                    <div className="legend-item"><span className="dot user"></span> Verifiers / Users ({stats.totalUsers})</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-panel" style={{ flex: 0.8 }}>
                                            <h3><Activity className="icon" /> Network Sync Status</h3>
                                            <p className="help-text">Live check of block sync and API response integrity.</p>
                                            <div className="glowing-sine-wave-container mt-3">
                                                <div className="pulse-circle"></div>
                                                <span className="pulse-text">Sync: Node Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'organizations' && (
                                <div className="organizations-view fade-in-up">
                                    <div className="split-view">
                                        <div className="form-section glass-panel">
                                            <h2 className="section-title"><PlusCircle className="icon" /> New SaaS Tenant</h2>
                                            <form onSubmit={handleCreateOrganization} className="modern-form">
                                                <div className="form-group">
                                                    <label>Organization / University Name</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Stanford University"
                                                        value={newOrgName}
                                                        onChange={(e) => setNewOrgName(e.target.value)}
                                                        required 
                                                    />
                                                </div>
                                                <button type="submit" className="modern-btn primary full-width">
                                                    Create Organization
                                                </button>
                                            </form>
                                        </div>
                                        
                                        <div className="list-section glass-panel">
                                            <h2 className="section-title">Active Organizations</h2>
                                            <p className="help-text">Click on any organization to manage its users and view its specific analytics.</p>
                                            <div className="tenant-list">
                                                {organizations.length === 0 ? (
                                                    <p className="empty-state">No organizations created yet.</p>
                                                ) : (
                                                    organizations.map(org => (
                                                        <div 
                                                            key={org.id} 
                                                            className="tenant-card clickable-card"
                                                            onClick={() => setSelectedOrg(org)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="tenant-icon">{org.name.charAt(0)}</div>
                                                            <div className="tenant-details">
                                                                <h4>{org.name}</h4>
                                                                <span className="tenant-id">ID: {org.id.slice(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Organization Detail View (Drill down)
                    <div className="org-detail-view fade-in-up">
                        <header className="topbar flex-row-align">
                            <button className="back-btn" onClick={() => setSelectedOrg(null)}>
                                <ArrowLeft size={20} />
                                Back to Organizations
                            </button>
                            <div className="org-header-info">
                                <h1>{selectedOrg.name}</h1>
                                <span className="badge-org-id">Tenant ID: {selectedOrg.id}</span>
                            </div>
                        </header>

                        {orgStats && (
                            <>
                                <div className="stats-grid premium mt-2">
                                    <div className="stat-card glass-panel purple-glow">
                                        <Shield className="stat-icon" />
                                        <div className="stat-info">
                                            <h3>Master Admins</h3>
                                            <p className="stat-number">{orgStats.totalMasterAdmins}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card glass-panel blue-glow">
                                        <Users className="stat-icon" />
                                        <div className="stat-info">
                                            <h3>Active Issuers</h3>
                                            <p className="stat-number">{orgStats.totalIssuers}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card glass-panel green-glow">
                                        <FileText className="stat-icon" />
                                        <div className="stat-info">
                                            <h3>Documents Issued</h3>
                                            <p className="stat-number">{orgStats.totalDocuments}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Individual Organization Weekly Issuance Trend Graph */}
                                {orgStats.activityTrend && (
                                    <div className="glass-panel mt-3">
                                        <h3><Calendar className="icon" /> Individual Document Issuance Trend (Last 7 Days)</h3>
                                        <p className="help-text">Visual analysis of document activities strictly related to this tenant over the past week.</p>
                                        <div className="org-trend-chart mt-3">
                                            {orgStats.activityTrend.map((t, idx) => {
                                                const maxVal = Math.max(...orgStats.activityTrend.map(x => x.count), 1);
                                                const heightPercent = (t.count / maxVal) * 100;
                                                return (
                                                    <div key={idx} className="trend-bar-wrapper">
                                                        <div className="trend-bar-container">
                                                            <div 
                                                                className="trend-bar" 
                                                                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                                title={`${t.count} documents`}
                                                            >
                                                                {t.count > 0 && <span className="trend-bar-value">{t.count}</span>}
                                                            </div>
                                                        </div>
                                                        <span className="trend-bar-label">{t.date}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="split-view mt-4">
                            {/* Left column: Provisioning, Assigning & Resource Structure */}
                            <div className="form-section flex-col-gap">
                                {/* Provision User form directly inside Organization context */}
                                <div className="glass-panel">
                                    <h2 className="section-title"><PlusCircle className="icon" /> Provision User</h2>
                                    <p className="help-text">Directly add a new administrator, issuer, or user to this organization.</p>
                                    <form onSubmit={handleCreateOrgUser} className="modern-form">
                                        <div className="form-group">
                                            <label>User Role</label>
                                            <select 
                                                value={newAdminRole}
                                                onChange={(e) => setNewAdminRole(e.target.value)}
                                                required
                                            >
                                                <option value="master_admin">Master Admin</option>
                                                <option value="issuer">Issuer (Blockchain Wallet)</option>
                                                <option value="user">Standard User (Verifier)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input 
                                                type="email" 
                                                placeholder="user@university.edu"
                                                value={newAdminEmail}
                                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Secure Password</label>
                                            <input 
                                                type="password" 
                                                placeholder="Min 6 characters"
                                                value={newAdminPassword}
                                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                                required 
                                            />
                                        </div>
                                        <button type="submit" className="modern-btn primary full-width gradient-btn">
                                            Provision Account
                                        </button>
                                    </form>
                                </div>

                                {/* Tenant Resource Structure Progress Bars */}
                                {orgStats && (
                                    <div className="glass-panel">
                                        <h3><TrendingUp className="icon" /> Tenant Account Structure</h3>
                                        <p className="help-text">Distribution of credentials provisioned strictly for this tenant.</p>
                                        <div className="tenant-structure-list mt-3">
                                            <div className="tenant-structure-row">
                                                <div className="structure-metric">
                                                    <span>Master Admins</span>
                                                    <strong>{orgStats.totalMasterAdmins}</strong>
                                                </div>
                                                <div className="structure-bar-container">
                                                    <div className="structure-bar ma-bar" style={{ width: `${(orgStats.totalMasterAdmins / (orgStats.totalMasterAdmins + orgStats.totalIssuers + orgStats.totalUsers || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="tenant-structure-row mt-3">
                                                <div className="structure-metric">
                                                    <span>Active Issuers</span>
                                                    <strong>{orgStats.totalIssuers}</strong>
                                                </div>
                                                <div className="structure-bar-container">
                                                    <div className="structure-bar issuer-bar" style={{ width: `${(orgStats.totalIssuers / (orgStats.totalMasterAdmins + orgStats.totalIssuers + orgStats.totalUsers || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="tenant-structure-row mt-3">
                                                <div className="structure-metric">
                                                    <span>Standard Users</span>
                                                    <strong>{orgStats.totalUsers}</strong>
                                                </div>
                                                <div className="structure-bar-container">
                                                    <div className="structure-bar user-bar" style={{ width: `${(orgStats.totalUsers / (orgStats.totalMasterAdmins + orgStats.totalIssuers + orgStats.totalUsers || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Assign Existing Users Panel */}
                                <div className="glass-panel">
                                    <h2 className="section-title"><Users className="icon" /> Add Existing Users</h2>
                                    <p className="help-text">Select from existing users in the system who are not yet part of any organization.</p>
                                    <div className="unassigned-users-container">
                                        {unassignedUsers.length === 0 ? (
                                            <p className="empty-state">No unassigned users available in the system.</p>
                                        ) : (
                                            <div className="unassigned-users-list">
                                                {unassignedUsers.map(user => (
                                                    <div key={user.id} className="unassigned-user-card">
                                                        <div className="unassigned-info">
                                                            <span className="unassigned-email">{user.email}</span>
                                                            <span className={`status-badge-xs ${user.role === 'master_admin' ? 'danger' : user.role === 'issuer' ? 'warning' : 'success'}`}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            className="modern-btn primary btn-xs"
                                                            onClick={() => handleAssignUser(user.id)}
                                                        >
                                                            Add to Org
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Users belonging to this Org */}
                            <div className="list-section glass-panel">
                                <h2 className="section-title">Organization User Directory</h2>
                                <div className="table-container">
                                    {orgUsers.length === 0 ? (
                                        <p className="empty-state">No users belong to this organization yet.</p>
                                    ) : (
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orgUsers.map(user => (
                                                    <tr key={user.id} className="table-row">
                                                        <td>
                                                            {editingUser === user.id ? (
                                                                <input 
                                                                    type="email" 
                                                                    value={editEmail} 
                                                                    onChange={(e) => setEditEmail(e.target.value)} 
                                                                    className="edit-input"
                                                                />
                                                            ) : (
                                                                user.email
                                                            )}
                                                        </td>
                                                        <td>
                                                            {editingUser === user.id ? (
                                                                <select 
                                                                    value={editRole} 
                                                                    onChange={(e) => setEditRole(e.target.value)} 
                                                                    className="edit-select"
                                                                >
                                                                    <option value="master_admin">Master Admin</option>
                                                                    <option value="issuer">Issuer</option>
                                                                    <option value="user">User</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`status-badge ${user.role === 'master_admin' ? 'danger' : user.role === 'issuer' ? 'warning' : 'success'}`}>
                                                                    {user.role}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {editingUser === user.id ? (
                                                                <div className="action-buttons-group">
                                                                    <button onClick={() => handleSaveUserEdit(user.id)} className="icon-btn success-btn" title="Save">
                                                                        <Check size={18} />
                                                                    </button>
                                                                    <button onClick={handleCancelEdit} className="icon-btn cancel-btn" title="Cancel">
                                                                        <X size={18} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="action-buttons-group">
                                                                    <button onClick={() => handleStartEdit(user)} className="icon-btn edit-btn" title="Edit details">
                                                                        <Edit3 size={18} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteUser(user.id)} className="icon-btn delete-btn" title="Delete User">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
